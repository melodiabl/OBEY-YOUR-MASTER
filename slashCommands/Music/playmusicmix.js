const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playmusicmix', description: 'Reproduce una mezcla de canciones similares basada en una cancion',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [{ String: { name: 'cancion', description: 'Cancion base para la mezcla', required: true } }],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    const ok  = (t, d) => new EmbedBuilder().setColor(0x5865F2).setTitle(obeyUi.limit(t, 256)).setDescription(obeyUi.limit(d, 4096))

    const query = interaction.options.getString('cancion')
    if (!interaction.member?.voice?.channel) return interaction.reply({ embeds: [err(obeyUi.owned('❌ Debes estar en un canal de voz.'))], ephemeral: true })
    if (!client.music) return interaction.reply({ embeds: [err(obeyUi.owned('❌ Sistema de música no disponible.'))], ephemeral: true })
    await interaction.deferReply()
    try {
      const base = await client.music.search(query, interaction.user, { guildId: interaction.guildId })
      if (!base?.tracks?.length) return interaction.editReply({ embeds: [err('❌ Sin resultados para la canción base.')] })
      const seed = base.tracks[0]
      const seedInfo = seed.info || seed
      const mixQuery = `ytsearch:${seedInfo.author || seedInfo.title} mix playlist`
      const mix = await client.music.search(mixQuery, interaction.user, { guildId: interaction.guildId })
      const tracks = mix?.tracks?.slice(0, 10) || []
      if (!tracks.length) return interaction.editReply({ embeds: [err(obeyUi.owned('❌ No se pudo generar la mezcla.'))] })
      const vc = interaction.member.voice.channel
      await client.music.joinChannel(interaction.guild.id, vc.id, interaction.channelId)
      const state = client.music.getState(interaction.guild.id)
      await client.music.enqueue(interaction.guild.id, tracks)
      if (!state.currentTrack) {
        const player = client.shoukaku?.players?.get(interaction.guild.id)
        await client.music._playNext(interaction.guild.id, player)
      }
      await interaction.editReply({ embeds: [ok(obeyUi.owned('🎲 Mezcla generada'), `**${tracks.length}** canciones basadas en **${seedInfo.title}** añadidas a la cola.`)] })
    } catch (e) { await interaction.editReply({ embeds: [err(`${obeyUi.markup("icon.error")} ${e.message}`)] }) }
  },
}
