const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const Canvas = require('@napi-rs/canvas')

async function applySepia(avatarURL) {
  const img = await Canvas.loadImage(avatarURL)
  const c   = Canvas.createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, img.width, img.height)
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2]
    data.data[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
    data.data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
    data.data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
  }
  ctx.putImageData(data, 0, 0)
  return c.toBuffer('image/png')
}

module.exports = {
  name: 'sepia',
  description: 'Aplica efecto sépia al avatar de un usuario',
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
      const buffer = await applySepia(url)
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0xA0522D)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setImage('attachment://sepia.png'),
        ],
        files: [new AttachmentBuilder(buffer, { name: 'sepia.png' })],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Error al procesar la imagen.')],
      })
    }
  },
}
