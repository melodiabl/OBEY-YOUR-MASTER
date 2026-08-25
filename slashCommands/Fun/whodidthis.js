const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const Canvas = require('@napi-rs/canvas')

async function buildWhodidthis(avatarURL) {
  const W = 400, H = 400
  const c   = Canvas.createCanvas(W, H)
  const ctx = c.getContext('2d')

  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, W, H)

  try {
    const img = await Canvas.loadImage(avatarURL)
    ctx.save()
    ctx.beginPath()
    ctx.arc(W / 2, H / 2 - 30, 120, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, W / 2 - 120, H / 2 - 150, 240, 240)
    ctx.restore()
    // greyscale
    const data = ctx.getImageData(0, 0, W, H)
    for (let i = 0; i < data.data.length; i += 4) {
      const g = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2]
      data.data[i] = data.data[i + 1] = data.data[i + 2] = g
    }
    ctx.putImageData(data, 0, 0)
  } catch {}

  ctx.fillStyle = '#111111'
  ctx.font      = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('WHO DID THIS?', W / 2, H - 30)

  return c.toBuffer('image/png')
}

module.exports = {
  name: 'whodidthis',
  description: 'Señala a un culpable estilo meme',
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
      const buffer = await buildWhodidthis(url)
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0x71717A)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setImage('attachment://whodidthis.png'),
        ],
        files: [new AttachmentBuilder(buffer, { name: 'whodidthis.png' })],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Error al procesar la imagen.')],
      })
    }
  },
}
