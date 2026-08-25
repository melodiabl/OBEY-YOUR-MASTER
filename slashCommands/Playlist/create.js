const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')

const MAX_PLAYLISTS = 10
const NAME_RE       = /^[\w\s\-]{1,32}$/

module.exports = {
  name: 'create',
  description: 'Crear una nueva playlist personal',
  options: [
    { String: { name: 'nombre', description: 'Nombre de la playlist (máx. 32 caracteres)', required: true } },
  ],

  run: async (client, interaction) => {
    const userId = interaction.user.id
    const name   = interaction.options.getString('nombre').trim()

    if (!NAME_RE.test(name))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Nombre inválido. Solo letras, números, espacios y guiones (máx. 32 caracteres).')],
        ephemeral: true,
      })

    await interaction.deferReply({ ephemeral: true })

    const count = await Playlist.countDocuments({ userId })
    if (count >= MAX_PLAYLISTS)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ Ya tienes **${MAX_PLAYLISTS}** playlists. Elimina una antes de crear otra.`)],
      })

    const exists = await Playlist.findOne({ userId, name: { $regex: new RegExp(`^${name}$`, 'i') } })
    if (exists)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ Ya tienes una playlist llamada **${name}**.`)],
      })

    await Playlist.create({ userId, name, tracks: [] })

    await interaction.editReply({
      embeds: [
        new EmbedBuilder().setColor(0x22C55E)
          .setTitle('✅ Playlist creada')
          .setDescription(`**${name}** está lista. Usa \`/playlist add\` para agregar canciones.`),
      ],
    })
  },
}
