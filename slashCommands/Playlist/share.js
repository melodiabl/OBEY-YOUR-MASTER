const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')

module.exports = {
  name: 'share',
  description: 'Hacer una playlist pública o privada',
  options: [
    { String: { name: 'nombre', description: 'Nombre de la playlist', required: true } },
    {
      StringChoices: {
        name: 'visibilidad',
        description: 'Pública = visible para todos; Privada = solo tú',
        required: true,
        choices: [
          { name: '🌐 Pública',  value: 'public'  },
          { name: '🔒 Privada', value: 'private' },
        ],
      },
    },
  ],
  run: async (client, interaction) => {
    const name       = interaction.options.getString('nombre').trim()
    const visibility = interaction.options.getString('visibilidad')
    await interaction.deferReply({ ephemeral: true })

    const playlist = await Playlist.findOneAndUpdate(
      { userId: interaction.user.id, name: { $regex: new RegExp(`^${name}$`, 'i') } },
      { isPublic: visibility === 'public' },
      { new: true },
    ).catch(() => null)

    if (!playlist)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setDescription(`❌ No tienes una playlist llamada **${name}**.`)],
      })

    const label = playlist.isPublic ? '🌐 Pública' : '🔒 Privada'
    const desc  = playlist.isPublic
      ? `Cualquiera puede verla con \`/playlist show nombre: ${playlist.name} usuario: @${interaction.user.username}\`.`
      : 'Solo tú puedes verla.'

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setTitle(`✅ Playlist actualizada — ${label}`)
        .setDescription(`**${playlist.name}** ahora es **${label.slice(3)}**.\n${desc}`)],
    })
  },
}
