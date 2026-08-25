const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const Canvas = require('@napi-rs/canvas')

async function applyGreyscale(avatarURL) {
  const img = await Canvas.loadImage(avatarURL)
  const c   = Canvas.createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, img.width, img.height)
  for (let i = 0; i < data.data.length; i += 4) {
    const g = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2]
    data.data[i] = data.data[i + 1] = data.data[i + 2] = g
  }
  ctx.putImageData(data, 0, 0)
  return c.toBuffer('image/png')
}

module.exports = {
  name: 'greyscale',
  description: 'Convierte el avatar de un usuario a escala de grises',
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
      const buffer = await applyGreyscale(url)
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0x71717A)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setImage('attachment://greyscale.png'),
        ],
        files: [new AttachmentBuilder(buffer, { name: 'greyscale.png' })],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Error al procesar la imagen.')],
      })
    }
  },
}
