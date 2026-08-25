const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playmusicmix', description: 'Reproduce una mezcla de canciones similares basada en una cancion',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [{ String: { name: 'cancion', description: 'Cancion base para la mezcla', required: true } }],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const ok  = (t, d) => new EmbedBuilder().setColor(0x5865F2).setTitle(t).setDescription(d)

    const query = interaction.options.getString('cancion')
    if (!interaction.member?.voice?.channel) return interaction.reply({ embeds: [err('❌ Debes estar en un canal de voz.')], ephemeral: true })
    if (!client.music) return interaction.reply({ embeds: [err('❌ Sistema de música no disponible.')], ephemeral: true })
    await interaction.deferReply()
    try {
      const base = await client.music.search(query, interaction.user)
      if (!base?.tracks?.length) return interaction.editReply({ embeds: [err('❌ Sin resultados para la canción base.')] })
      const seed = base.tracks[0]
      const seedInfo = seed.info || seed
      const mixQuery = `ytsearch:${seedInfo.author || seedInfo.title} mix playlist`
      const mix = await client.music.search(mixQuery, interaction.user)
      const tracks = mix?.tracks?.slice(0, 10) || []
      if (!tracks.length) return interaction.editReply({ embeds: [err('❌ No se pudo generar la mezcla.')] })
      const vc = interaction.member.voice.channel
      await client.music.joinChannel(interaction.guild.id, vc.id, interaction.channel.id)
      const state = client.music.getState(interaction.guild.id)
      for (const t of tracks) state.queue.push(t)
      if (!state.currentTrack) {
        const player = client.shoukaku?.players?.get(interaction.guild.id)
        await client.music._playNext(interaction.guild.id, player)
      }
      await interaction.editReply({ embeds: [ok('🎲 Mezcla generada', `**${tracks.length}** canciones basadas en **${seedInfo.title}** añadidas a la cola.`)] })
    } catch (e) { await interaction.editReply({ embeds: [err(`❌ ${e.message}`)] }) }
  },
}
