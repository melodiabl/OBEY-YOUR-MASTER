const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const Canvas = require('@napi-rs/canvas')

async function buildRip(avatarURL, username) {
  const W = 400, H = 500
  const c   = Canvas.createCanvas(W, H)
  const ctx = c.getContext('2d')

  // dark stone background
  ctx.fillStyle = '#2e2e2e'
  ctx.fillRect(0, 0, W, H)

  // tombstone shape
  ctx.fillStyle = '#808080'
  ctx.beginPath()
  ctx.arc(W / 2, 120, 120, Math.PI, 0)
  ctx.rect(W / 2 - 120, 120, 240, 200)
  ctx.fill()

  // inner highlight
  ctx.fillStyle = '#9e9e9e'
  ctx.beginPath()
  ctx.arc(W / 2, 120, 100, Math.PI, 0)
  ctx.rect(W / 2 - 100, 120, 200, 170)
  ctx.fill()

  // avatar circular
  try {
    const img = await Canvas.loadImage(avatarURL)
    // greyscale first
    const tmp = Canvas.createCanvas(80, 80)
    const tc  = tmp.getContext('2d')
    tc.drawImage(img, 0, 0, 80, 80)
    const d = tc.getImageData(0, 0, 80, 80)
    for (let i = 0; i < d.data.length; i += 4) {
      const g = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]
      d.data[i] = d.data[i + 1] = d.data[i + 2] = g
    }
    tc.putImageData(d, 0, 0)
    ctx.save()
    ctx.beginPath()
    ctx.arc(W / 2, 140, 60, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(tmp, W / 2 - 60, 80, 120, 120)
    ctx.restore()
  } catch {}

  ctx.fillStyle = '#ffffff'
  ctx.font      = 'bold 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('R.I.P', W / 2, 230)
  ctx.font      = '16px sans-serif'
  ctx.fillText(username, W / 2, 255)

  ctx.fillStyle = '#cccccc'
  ctx.font      = '14px sans-serif'
  ctx.fillText(new Date().getFullYear().toString(), W / 2, 280)

  return c.toBuffer('image/png')
}

module.exports = {
  name: 'rip',
  description: 'Que descanse en paz un usuario 💀',
  options: [
    { User: { name: 'usuario', description: 'Usuario (por defecto tú)', required: false } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'FUN'))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de diversión no está activado.')],
        ephemeral: true,
      })

    const user = interaction.options.getUser('usuario') || interaction.user
    await interaction.deferReply()

    try {
      const url    = user.displayAvatarURL({ extension: 'png', size: 256 })
      const buffer = await buildRip(url, user.username)
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0x808080)
            .setDescription(`*${user.username} descansa en paz* 🪦`)
            .setImage('attachment://rip.png'),
        ],
        files: [new AttachmentBuilder(buffer, { name: 'rip.png' })],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Error al procesar la imagen.')],
      })
    }
  },
}
