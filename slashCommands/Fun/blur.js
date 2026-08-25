const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const Canvas = require('@napi-rs/canvas')

async function applyBlur(avatarURL) {
  const img = await Canvas.loadImage(avatarURL)
  // Draw at full size then box-blur by downscale+upscale
  const S = 32
  const W = img.width, H = img.height
  const small = Canvas.createCanvas(S, S)
  small.getContext('2d').drawImage(img, 0, 0, S, S)
  const out = Canvas.createCanvas(W, H)
  const ctx = out.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(small, 0, 0, W, H)
  return out.toBuffer('image/png')
}

module.exports = {
  name: 'blur',
  description: 'Aplica un efecto blur al avatar de un usuario',
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
      const buffer = await applyBlur(url)
      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0x5865F2)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setImage('attachment://blur.png'),
        ],
        files: [new AttachmentBuilder(buffer, { name: 'blur.png' })],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Error al procesar la imagen.')],
      })
    }
  },
}
