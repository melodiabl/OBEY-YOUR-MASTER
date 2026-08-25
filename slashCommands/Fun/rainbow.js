const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const Canvas = require('@napi-rs/canvas')

async function applyRainbow(avatarURL) {
  const img  = await Canvas.loadImage(avatarURL)
  const W = img.width, H = img.height
  const c    = Canvas.createCanvas(W, H)
  const ctx  = c.getContext('2d')

  // Draw original
  ctx.drawImage(img, 0, 0)

  // Rainbow overlay (horizontal stripes with low opacity)
  const colors = ['#ff0000','#ff7700','#ffff00','#00ff00','#0000ff','#8b00ff']
  const stripeH = Math.floor(H / colors.length)
  ctx.globalAlpha = 0.35
  colors.forEach((col, i) => {
    ctx.fillStyle = col
    ctx.fillRect(0, i * stripeH, W, stripeH + 2)
  })
  ctx.globalAlpha = 1

  return c.toBuffer('image/png')
}

module.exports = {
  name: 'rainbow',
  description: 'Aplica efecto arcoíris al avatar de un usuario 🌈',
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
      const buffer = await applyRainbow(url)
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0xFF7700)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setImage('attachment://rainbow.png'),
        ],
        files: [new AttachmentBuilder(buffer, { name: 'rainbow.png' })],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Error al procesar la imagen.')],
      })
    }
  },
}
