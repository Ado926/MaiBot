import fetch from "node-fetch"
import yts from 'yt-search'
import axios from "axios"
const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text.trim()) {
      return conn.reply(m.chat, `❀ Por favor, ingresa el nombre de la música a descargar.`, m)
    }
  
    let videoIdToFind = text.match(youtubeRegexID) || null
    let ytplay2 = await yts(videoIdToFind === null ? text : 'https://youtu.be/' + videoIdToFind[1])

    if (videoIdToFind) {
      const videoId = videoIdToFind[1]  
      ytplay2 = ytplay2.all.find(item => item.videoId === videoId) || ytplay2.videos.find(item => item.videoId === videoId)
    } 
    ytplay2 = ytplay2.all?.[0] || ytplay2.videos?.[0] || ytplay2  

    if (!ytplay2 || ytplay2.length == 0) {
      return m.reply('✧ No se encontraron resultados para tu búsqueda.')
    }
    
    let { title, thumbnail, timestamp, views, ago, url, author } = ytplay2

    title = title || 'no encontrado'
    thumbnail = thumbnail || 'no encontrado'
    timestamp = timestamp || 'no encontrado'
    views = views || 'no encontrado'
    ago = ago || 'no encontrado'
    url = url || 'no encontrado'
    author = author || 'no encontrado'

    const vistas = formatViews(views)
    const canal = author.name ? author.name : 'Desconocido'

    // Crear el mensaje con la información del video de manera ordenada
    const infoMessage = `
╭♡༉✧˚ ༘⋆˚❀｡──♡───╮
 ʚ🌸ɞ URL 𝖣𝖾𝗌𝖼𝖺𝗋𝗀𝖺𝗌 🌴
╰♡༉✧˚ ༘⋆｡˚❀──♡───╯

*🍡 Título:* ${title}
*🍥 Canal:* ${canal}
*🌟 Vistas:* ${vistas}
*⏰ Duración:* ${timestamp}
*🗓️ Publicado:* ${ago}
*🔗 Enlace:* ${url}

⌜ ♡ 𝑬𝒔𝒑𝒆𝒓𝒂 𝒖𝒏 𝒑𝒐𝒒𝒖𝒊𝒕𝒐... ♡ ⌟
`

    const thumb = (await conn.getFile(thumbnail))?.data

    const JT = {
      contextInfo: {
        externalAdReply: {
          title: 'Mai Bot ☕',
          body: 'By Wirk 👻',
          mediaType: 1,
          previewType: 0,
          mediaUrl: url,
          sourceUrl: url,
          thumbnail: thumb,
          renderLargerThumbnail: true,
        },
      },
    }

    await conn.reply(m.chat, infoMessage, m, JT)

    if (command === 'play' || command === 'yta' || command === 'ytmp3' || command === 'playaudio') {
      try {
        const api = await (await fetch(`https://api.vreden.my.id/api/ytmp3?url=${url}`)).json()
        const resulta = api.result
        const result = resulta.download.url

        if (!result) throw new Error('⚠ El enlace de audio no se generó correctamente.')

        await conn.sendMessage(m.chat, { audio: { url: result }, fileName: `${api.result.title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: m })
      } catch (e) {
        return conn.reply(m.chat, '⚠︎ No se pudo enviar el audio. Esto puede deberse a que el archivo es demasiado pesado o a un error en la generación de la URL. Por favor, intenta nuevamente más tarde.', m)
      }
    } else if (command === 'playvid' || command === 'ytv' || command === 'ytmp4' || command === 'mp4') {
      try {
        const response = await fetch(`https://api.vreden.my.id/api/ytmp4?url=${url}`)
        const json = await response.json()
        const resultad = json.result
        const resultado = resultad.download.url

        if (!resultad || !resultado) throw new Error('⚠ El enlace de video no se generó correctamente.')

        await conn.sendFile(m.chat, resultado, resultad.title + '.mp4', title, m)

      } catch (e) {
        return conn.reply(m.chat, '⚠︎ No se pudo enviar el video. Esto puede deberse a que el archivo es demasiado pesado o a un error en la generación de la URL. Por favor, intenta nuevamente más tarde.', m)
      }
    } else {
      return conn.reply(m.chat, '✧︎ Comando no reconocido.', m)
    }

  } catch (error) {
    return m.reply(`⚠︎ Ocurrió un error: ${error}`)
  }
}

handler.command = handler.help = ['yta', 'ytmp3', 'playvid']
handler.tags = ['descargas']
handler.group = true

export default handler

function formatViews(views) {
  if (views === undefined) {
    return "No disponible"
  }

  if (views >= 1_000_000_000) {
    return `${(views / 1_000_000_000).toFixed(1)}B (${views.toLocaleString()})`
  } else if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M (${views.toLocaleString()})`
  } else if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}k (${views.toLocaleString()})`
  }
  return views.toString()
}
