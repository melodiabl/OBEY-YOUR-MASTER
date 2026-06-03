const { EmbedBuilder } = require('discord.js')
module.exports = {
    name: 'play',
    description: 'Plays a Song/Playlist from Youtube/Spotify',
    parameters: { type: 'music', activeplayer: false, previoussong: false },
    options: [
        { String: { name: 'what_song', description: 'Song name, URL or playlist link', required: true } },
    ],
    run: async (client, interaction, cmduser, es, ls) => {
        const query = interaction.options.getString('what_song')
        if (!query) return interaction.reply({ content: '❌ Ingresa el nombre o URL de la canción.', ephemeral: true })

        const voiceChannel = interaction.member?.voice?.channel
        if (!voiceChannel) return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true })

        if (!client.music) return interaction.reply({ content: '❌ Sistema de música no disponible.', ephemeral: true })

        await interaction.deferReply()

        try {
            await client.music.play(
                interaction.guild.id,
                voiceChannel.id,
                interaction.channel.id,
                query,
                interaction.user
            )
            await interaction.editReply({ content: `🎵 Buscando y reproduciendo: **${query}**` })
        } catch (e) {
            await interaction.editReply({ content: `❌ Error: ${e.message || e}` })
        }
    },
}
