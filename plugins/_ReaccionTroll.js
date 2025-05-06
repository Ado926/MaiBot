import fetch from "node-fetch";
import axios from 'axios';

// Constantes
const VIDEO_THRESHOLD = 70 * 1024 * 1024; // 70 MB
const HEAVY_FILE_THRESHOLD = 100 * 1024 * 1024; // 100 MB
const REQUEST_LIMIT = 3;
const REQUEST_WINDOW_MS = 10000;
const COOLDOWN_MS = 120000;

// Estado de control
const requestTimestamps = [];
let isCooldown = false;
let isProcessingHeavy = false;

// Validar URL de YouTube
const isValidYouTubeUrl = (url) =>
  /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/.test(url);

// Formato bonito de tamaño
function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return 'Desconocido';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

// Obtener tamaño de un archivo
async function getSize(url) {
  try {
    const response = await axios.head(url, { timeout: 10000 });
    const size = parseInt(response.headers['content-length'], 10);
    if (!size) throw new Error('Tamaño no disponible');
    return size;
  } catch {
    throw new Error('No se pudo obtener el tamaño del archivo');
  }
}

// Descarga desde ymcdn.org
async function ytdl(text) {
  const headers = {
    accept: '*/*',
    'accept-language': 'en-US,en;q=0.9',
    referer: 'https://id.ytmp3.mobi/',
    'sec-fetch-site': 'cross-site'
  };

  try {
    const initRes = await fetch(`https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Date.now()}`, { headers });
    const init = await initRes.json();

    const videoId = text.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?/]+)/)?.[1];
    if (!videoId) throw new Error('ID de video no encontrado');

    const convertRes = await fetch(`${init.convertURL}&v=${videoId}&f=mp4&_=${Date.now()}`, { headers });
    const convert = await convertRes.json();

    let info;
    for (let i = 0; i < 3; i++) {
      const progressRes = await fetch(convert.progressURL, { headers });
      info = await progressRes.json();
      if (info.progress === 3) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!info || !convert.downloadURL) throw new Error('No se pudo obtener la URL de descarga');
    return { url: convert.downloadURL, title: info.title || 'Video sin título' };
  } catch (e) {
    throw new Error(`Principal falló: ${e.message}`);
  }
}

// Fallback con zenzapis.xyz
async function ytdlFallback(text) {
  try {
    const res = await axios.get(`https://zenzapis.xyz/downloader/youtube`, {
      params: { url: text, apikey: 'tu_api_key_aqui' },
      timeout: 15000
    });
    if (!res.data.result || !res.data.result.url_video) throw new Error('URL no encontrada');
    return { url: res.data.result.url_video, title: res.data.result.title };
  } catch (e) {
    throw new Error(`Fallback falló: ${e.message}`);
  }
}

// Limitar spam de descargas
function checkRequestLimit() {
  const now = Date.now();
  requestTimestamps.push(now);
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > REQUEST_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= REQUEST_LIMIT) {
    isCooldown = true;
    setTimeout(() => {
      isCooldown = false;
      requestTimestamps.length = 0;
    }, COOLDOWN_MS);
    return false;
  }
  return true;
}

// Comando principal
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return conn.reply(m.chat, `👉 Uso: ${usedPrefix}${command} https://youtube.com/watch?v=...`, m);
  if (!isValidYouTubeUrl(text)) return m.reply('🚫 Enlace inválido de YouTube');

  if (isCooldown || !checkRequestLimit()) {
    return conn.reply(m.chat, '⏳ Demasiadas solicitudes, espera 2 minutos.', m);
  }

  if (isProcessingHeavy) {
    return conn.reply(m.chat, '⏳ Estoy procesando otro video grande, espera...', m);
  }

  await m.react('📀');

  try {
    let data;
    try {
      data = await ytdl(text); // primer intento
    } catch (e) {
      console.log('[INFO] Usando fallback...');
      data = await ytdlFallback(text); // fallback si falla
    }

    const { url, title } = data;
    const size = await getSize(url);

    if (size > HEAVY_FILE_THRESHOLD) {
      isProcessingHeavy = true;
      await conn.reply(m.chat, '🤨 Procesando archivo grande, espera...', m);
    }

    const caption = `*💌 ${title}*\n> ⚖️ Peso: ${formatSize(size)}\n> 🌎 URL: ${text}`;
    const isSmallVideo = size < VIDEO_THRESHOLD;

    const buffer = await (await fetch(url)).buffer();
    await conn.sendFile(
      m.chat,
      buffer,
      `${title}.mp4`,
      caption,
      m,
      null,
      {
        mimetype: 'video/mp4',
        asDocument: !isSmallVideo,
        filename: `${title}.mp4`
      }
    );

    await m.react('🟢');
    isProcessingHeavy = false;
  } catch (e) {
    await m.react('🔴');
    isProcessingHeavy = false;
    await conn.reply(m.chat, `❌ Error: ${e.message}`);
  }
};

handler.help = ['ytmp4 <url>'];
handler.command = ['ytmp4yt'];
handler.tags = ['descargas'];
handler.diamond = true;

export default handler;
