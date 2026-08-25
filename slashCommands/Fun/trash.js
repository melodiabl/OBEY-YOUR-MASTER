const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const Canvas = require('@napi-rs/canvas')

async function buildTrash(avatarURL) {
  const W = 400, H = 400
  const c   = Canvas.createCanvas(W, H)
  const ctx = c.getContext('2d')

  // dark background
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, W, H)

  // draw avatar centered, circular
  try {
    const img = await Canvas.loadImage(avatarURL)
    ctx.save()
    ctx.beginPath()
    ctx.arc(W / 2, H / 2 - 20, 130, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, W / 2 - 130, H / 2 - 150, 260, 260)
    ctx.restore()
  } catch {}

  ctx.fillStyle = '#ffffff'
  ctx.font      = 'bold 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🗑️ TRASH', W / 2, H - 30)

  return c.toBuffer('image/png')
}

module.exports = {
  name: 'trash',
  description: 'Muestra a un usuario como trash',
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
      const buffer = await buildTrash(url)
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0x1a1a1a)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setImage('attachment://trash.png'),
        ],
        files: [new AttachmentBuilder(buffer, { name: 'trash.png' })],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Error al procesar la imagen.')],
      })
    }
  },
}
