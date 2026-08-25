const { EmbedBuilder, AttachmentBuilder } = require('discord.js')

const CUSTOM_EMOJI = /<a?:[\w]+:(\d+)>/

module.exports = {
  name: 'enlarge',
  description: 'Agranda un emoji personalizado del servidor',
  options: [
    { String: { name: 'emoji', description: 'Emoji personalizado a agrandar', required: true } },
  ],

  run: async (client, interaction) => {
    const raw = interaction.options.getString('emoji').trim()
    const match = CUSTOM_EMOJI.exec(raw)

    if (!match)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Eso no es un emoji personalizado válido. Solo funcionan emojis de servidores (no emojis de Unicode).')],
        ephemeral: true,
      })

    const id        = match[1]
    const animated  = raw.startsWith('<a:')
    const ext       = animated ? 'gif' : 'png'
    const url       = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=512`

    await interaction.reply({
      files: [new AttachmentBuilder(url, { name: `emoji.${ext}` })],
    })
  },
}
