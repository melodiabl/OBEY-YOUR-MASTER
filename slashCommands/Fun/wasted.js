const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const Canvas = require('@napi-rs/canvas')

async function buildWasted(avatarURL) {
  const img = await Canvas.loadImage(avatarURL)
  const W = img.width, H = img.height
  const c   = Canvas.createCanvas(W, H)
  const ctx = c.getContext('2d')

  // draw greyscale avatar
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, W, H)
  for (let i = 0; i < data.data.length; i += 4) {
    const g = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2]
    data.data[i] = data.data[i + 1] = data.data[i + 2] = g
  }
  ctx.putImageData(data, 0, 0)

  // WASTED text
  ctx.fillStyle = '#ff0000'
  ctx.font      = `bold ${Math.floor(W / 4)}px Impact, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('WASTED', W / 2, H / 2)

  return c.toBuffer('image/png')
}

module.exports = {
  name: 'wasted',
  description: 'WASTED! Estilo GTA',
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
      const buffer = await buildWasted(url)
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0x990000)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setImage('attachment://wasted.png'),
        ],
        files: [new AttachmentBuilder(buffer, { name: 'wasted.png' })],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Error al procesar la imagen.')],
      })
    }
  },
}
