const { EmbedBuilder } = require('discord.js')
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const FormData = require('form-data')
const axios    = require('axios')
const path     = require('path')

try {
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/Genta.ttf'), 'Genta')
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/UbuntuMono.ttf'), 'UbuntuMono')
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/DMSans-Bold.ttf'), 'DM Sans')
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/STIXGeneral.ttf'), 'STIXGeneral')
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/Arial.ttf'), 'Arial')
} catch {}

const FONTS      = 'Genta, UbuntuMono, "DM Sans", STIXGeneral, Arial'
const WIDE_FONTS = '"DM Sans", STIXGeneral, Arial'

module.exports = {
  name: 'test',
  description: 'Prueba el sistema de bienvenida simulando un nuevo miembro',
  memberpermissions: ['ManageGuild'],
  options: [
    { User: { name: 'usuario', description: 'Usuario para previsualizar (por defecto: tú)', required: false } },
  ],

  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const target = interaction.options.getUser('usuario') || interaction.user
    const member = await interaction.guild.members.fetch(target.id).catch(() => null)
    if (!member) return interaction.reply({ embeds: [err('❌ Usuario no encontrado en el servidor.')], ephemeral: true })

    await interaction.deferReply()
    const guildId = interaction.guild.id
    const settings = client.settings.get(guildId, 'welcome')

    if (!settings || settings.channel === 'nochannel') {
      return interaction.editReply({ embeds: [err('❌ El sistema de bienvenida no está configurado.\nUsa `!setup-welcome` para configurarlo.')] })
    }

    try {
      const canvas = createCanvas(1772, 633)
      const ctx    = canvas.getContext('2d')

      const bg = client.settings.get(guildId, 'welcome.background')
      if (bg && bg !== 'transparent') {
        try { ctx.drawImage(await loadImage(bg), 0, 0, canvas.width, canvas.height) } catch {}
      } else {
        const guildIcon = interaction.guild.iconURL({ extension: 'png', size: 512, forceStatic: true })
        if (guildIcon) {
          try {
            const img = await loadImage(guildIcon)
            ctx.globalAlpha = 0.3
            ctx.drawImage(img, 1772 - 633, 0, 633, 633)
            ctx.globalAlpha = 1.0
          } catch {}
        }
      }

      if (client.settings.get(guildId, 'welcome.pb')) {
        try {
          const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true }))
          ctx.drawImage(avatar, 65, canvas.height / 2 - 250, 500, 500)
        } catch {}
      }

      if (client.settings.get(guildId, 'welcome.frame')) {
        let framecolor = (client.settings.get(guildId, 'welcome.framecolor') || '#3A98F0').toUpperCase()
        if (framecolor === '#FFFFFF') framecolor = '#FFFFF9'
        const hasDisc   = client.settings.get(guildId, 'welcome.discriminator')
        const hasSrv    = client.settings.get(guildId, 'welcome.servername')
        const framePath = hasDisc && hasSrv ? 'welcome3frame' : hasDisc ? 'welcome2frame_unten' : hasSrv ? 'welcome2frame_oben' : 'welcome1frame'
        try {
          ctx.drawImage(await loadImage(`./assets/welcome/${framecolor}/${framePath}.png`), 0, 0, canvas.width, canvas.height)
          if (client.settings.get(guildId, 'welcome.pb'))
            ctx.drawImage(await loadImage(`./assets/welcome/${framecolor}/welcome1framepb.png`), 0, 0, canvas.width, canvas.height)
        } catch {}
      }

      ctx.fillStyle = (client.settings.get(guildId, 'welcome.framecolor') || '#ffffff').toLowerCase()
      const uname = member.user.username
      if (uname.length >= 14) { ctx.font = `100px ${FONTS}`; ctx.fillText(uname, 720, canvas.height / 2) }
      else { ctx.font = `150px ${FONTS}`; ctx.fillText(uname, 720, canvas.height / 2 + 20) }
      ctx.font = `bold 50px ${WIDE_FONTS}`
      if (client.settings.get(guildId, 'welcome.membercount'))
        ctx.fillText(`Member #${interaction.guild.memberCount}`, 750, canvas.height / 2 + 200)
      if (client.settings.get(guildId, 'welcome.servername'))
        ctx.fillText(interaction.guild.name, 700, canvas.height / 2 - 150)

      const buf     = await canvas.encode('png')
      const es      = client.settings.get(guildId, 'embed') || {}
      const rawC    = es.color
      const color   = typeof rawC === 'number' ? rawC : parseInt(String(rawC || '').replace('#', ''), 16) || 0x5865F2
      const rawMsg  = client.settings.get(guildId, 'welcome.msg') || '¡Bienvenido {user} al servidor!'
      const description = rawMsg
        .replace('{user}', `${member.user}`)
        .replace('{username}', member.user.username)
        .replace('{usertag}', member.user.username)

      const form = new FormData()
      form.append('files[0]', buf, { filename: 'welcome-preview.png', contentType: 'image/png' })
      form.append('payload_json', JSON.stringify({
        content: `${member.user} — **Vista previa de la tarjeta de bienvenida**`,
        embeds: [{
          color,
          title: '👋 Bienvenido — Vista previa',
          description,
          image: { url: 'attachment://welcome-preview.png' },
          footer: { text: `ID: ${member.user.id}` },
          timestamp: new Date().toISOString(),
        }],
        attachments: [{ id: 0, filename: 'welcome-preview.png' }],
      }))

      const appId = client.user.id
      await axios.patch(
        `https://discord.com/api/v10/webhooks/${appId}/${interaction.token}/messages/@original`,
        form,
        { headers: { ...form.getHeaders() } }
      )
    } catch (e) {
      console.error('[Welcome Test]', JSON.stringify(e?.response?.data, null, 2) || e.message)
      await interaction.editReply({ embeds: [err(`❌ Error al generar la tarjeta: ${e.message || e}`)] })
    }
  },
}
