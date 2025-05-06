/**
 * ⋆｡˚ ☁︎｡⋆｡ ˚☽˚｡⋆ ✦ ⋆｡˚☁︎｡⋆｡ ˚☽˚｡⋆ ✦
 * 
 * 𝐓𝐨𝐢𝐥𝐞𝐭-𝐁𝐨𝐮𝐧𝐝 𝐌𝐚𝐢-𝐜𝐡𝐚𝐧 𝐑𝐞𝐠𝐢𝐬𝐭𝐫𝐨 𝐝𝐞 𝐒𝐞𝐫𝐞𝐬 𝐄𝐬𝐩𝐢𝐫𝐢𝐭𝐮𝐚𝐥𝐞𝐬
 * 
 * "Los rumores dicen que si escribes tu nombre en el Libro de los Siete Misterios,
 * Mai-chan te concederá un deseo a cambio de convertirte en su asistente..."
 * 
 * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 * ┃       七不思議        ┃
 * ┃   Los Siete Misterios   ┃
 * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
 * 
 * ⋆｡˚ ☁︎｡⋆｡ ˚☽˚｡⋆ ✦ ⋆｡˚☁︎｡⋆｡ ˚☽˚｡⋆ ✦
 */

import db from '../lib/database.js'
import fs from 'fs'
import PhoneNumber from 'awesome-phonenumber'
import { createHash } from 'crypto'
import fetch from 'node-fetch'
import moment from 'moment-timezone'

// ✿ Sello mágico para validar el pacto con Mai-chan ✿
const SelloMistico = /\|?(.*)([.|] *?)([0-9]*)$/i

/**
 * ⋆｡°✩ Ritual de Invocación ✩°｡⋆
 * Mai-chan, Mai-chan... ¿Estás ahí?
 */
let handler = async function (m, { conn, text, usedPrefix, command }) {
  // ✧ Identificar al invocador espiritual
  const who = m.mentionedJid?.[0] || (m.fromMe ? conn.user.jid : m.sender)
  const mentionedJid = [who]

  // ✧ Obtener la imagen del espejo del invocador
  const pp = await conn.profilePictureUrl(who, 'image').catch(() => 'https://files.catbox.moe/xr2m6u.jpg')
  const user = global.db.data.users[m.sender]
  const name2 = conn.getName(m.sender)

  // ✧ Verificar si ya existe un pacto con Mai-chan
  if (user.registered) {
    return m.reply(`『✦』 ¡Ya existe un pacto entre nosotros, ${name2}-chan! (◕ᴗ◕✿)

¿Deseas crear un nuevo pacto?
Utiliza *${usedPrefix}unreg* para romper el sello actual.`)
  }

  // ✧ Verificar el formato del ritual
  if (!SelloMistico.test(text)) {
    return m.reply(`『❀』 ¡El ritual no es correcto! (っ °Д °;)っ

✧ Formato correcto: *${usedPrefix + command} nombre.edad*
✧ Ejemplo: *${usedPrefix + command} ${name2}.18*

"Para invocar a Mai-chan, debes escribir tu nombre y edad correctamente..."`)
  }

  // ✧ Extraer la información del ritual
  let [_, name, __, age] = text.match(SelloMistico)
  
  // ✧ Validar el nombre del invocador
  if (!name) return m.reply('『❀』 ¡Tu nombre no puede quedar en blanco! Mai-chan necesita conocerte (⁠>⁠﹏⁠<⁠)')
  if (!age) return m.reply('『❀』 ¡Tu edad es importante para el pacto! (╯°□°）╯︵ ┻━┻')
  if (name.length >= 100) return m.reply('『❀』 ¡Ese nombre es demasiado largo! ¿Eres un yokai antiguo? (⊙_⊙)')

  // ✧ Validar la edad del invocador
  age = parseInt(age)
  if (age > 1000) return m.reply('『❀』 ¡Oh! ¿Eres un espíritu ancestral como yo? (◐.̃◐)')
  if (age < 5) return m.reply('『❀』 Los niños pequeños no deberían jugar con yokais... ¡Es peligroso! (；⌣̀_⌣́)')

  // ✧ Registrar al nuevo asistente de Mai-chan
  user.name = `${name}⋆˙⟡♱⟡˙⋆`.trim()
  user.age = age
  user.regTime = +new Date()
  user.registered = true

  // ✧ Bendiciones espirituales por el pacto
  user.coin += 46       // Monedas de la suerte de Mai
  user.exp += 310       // Poder espiritual
  user.joincount += 25  // Sellos de invocación

  // ✧ Crear el sello único del pacto
  const sn = createHash('md5').update(m.sender).digest('hex').slice(0, 20)

  // ✧ Certificado del pacto con Mai-chan
  const certificadoPacto = `
╭─────⋞ ✿ ⋟─────╮
│       *Registro*     
│         Mai 🪴    
╰─────⋞ ✿ ⋟─────╯
♡ *Nombre:* ${name}
♡ *Edad:* ${age} añitos
♡ *ID:* ${sn}

✧⋆｡°✩ Recompensas ✩°｡⋆✧
⋆ 🎀 MimiCoins: +46
⋆ ✨ Experiencia: +310
⋆ 🌸 Tokens: +25

꒰🍓꒱ ¡Bienvenido a la familia de Mai~!
https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R

╰────── *Powered by Wirk* ──────╯
`.trim()

  // ✧ Reacción mística
  await m.react('👻')

  // ✧ Enviar el certificado del pacto
  await conn.sendMessage(m.chat, {
    text: certificadoPacto,
    contextInfo: {
      externalAdReply: {
        title: '✧ Registro Completado ✧',
        body: 'https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R',
        thumbnailUrl: pp,
        sourceUrl: 'https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R',
        mediaType: 1,
        showAdAttribution: true,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m })

  // ✧ Notificar al Reino Espiritual (grupo de notificaciones)
  const reinoEspiritual = '120363402846939411@newsletter'
  const mensajeNotificacion = `
╭─「 ✨ Nuevo User Registrado ✨ 」─╮
🌸 *Nombre:* ${name}
🎀 *Edad:* ${age} añitos
💖 *ID:* ${sn}

✧⋆｡°✩ Recompensas ✩°｡⋆✧
⋆ 🪙 MimiCoins: +46
⋆ 🌟 Experiencia: +310
⋆ 🐾 Tokens: +25

🗓️ *Registro:* ${moment().format('YYYY-MM-DD HH:mm:ss')}
*Powered by Wirk & Mai-bot 🌸*
╰────────────────────────────╯`

  // ✧ Intento de comunicación con el Reino Espiritual
  try {
    if (global.conn?.sendMessage) {
      const ppGroup = await conn.profilePictureUrl(who, 'image').catch(() => null)
      await global.conn.sendMessage(reinoEspiritual, {
        image: { url: ppGroup || pp },
        caption: mensajeNotificacion
      })
    }
  } catch (e) {
    console.error('✧ Error al notificar al Reino Espiritual:', e)
  }
}

// ✧ Invocaciones permitidas ✧
handler.help = ['reg']
handler.tags = ['rg']
handler.command = ['verify', 'verificar', 'reg', 'register', 'registrar']

export default handler

/**
 * ─────────────────────────────────
 *      ╭──❁ Mai-chan ❁──╮
 *      │ "¿Necesitas ayuda? │
 *      │  Yo puedo cumplir  │
 *      │    tu deseo..."    │
 *      ╰──────✦❘✦──────╯
 * ─────────────────────────────────
 */
