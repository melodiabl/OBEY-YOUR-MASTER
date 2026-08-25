const { EmbedBuilder } = require('discord.js')
function fmtMs(ms){const s=Math.floor((ms||0)/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
module.exports = {
  name: 'playtop', description: 'Agrega una cancion al inicio de la cola (siguiente en reproducir)',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [{ String: { name: 'cancion', description: 'Nombre o URL de la cancion', required: true } }],
  run: async (client, interaction) => {
    const query = interaction.options.getString('cancion')
    if (!interaction.member?.voice?.channel) return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true })
    if (!client.music) return interaction.reply({ content: '❌ Sistema de música no disponible.', ephemeral: true })
    await interaction.deferReply()
    try {
      const result = await client.music.search(query, interaction.user)
      if (!result?.tracks?.length) return interaction.editReply({ content: '❌ Sin resultados.' })
      const track = result.tracks[0]
      const state = client.music.getState(interaction.guild.id)
      // Insert at front of queue
      if (state.currentTrack) {
        state.queue.unshift(track)
        const info = track.info||track
        const embed = new EmbedBuilder().setColor(0x5865F2)
          .setTitle('⬆️ Añadida al inicio de la cola')
          .setDescription(`**[${info.title||query}](${info.uri||''})**\n${info.author||''}\nDuración: \`${fmtMs(info.length)}\``)
          .setThumbnail(info.artworkUrl|| undefined)
          .setFooter({ text: `Pedido por ${interaction.user.username}` })
        return interaction.editReply({ embeds: [embed] })
      } else {
        // No current track — join and play directly
        const vc = interaction.member.voice.channel
        await client.music.joinChannel(interaction.guild.id, vc.id, interaction.channel.id)
        state.queue.unshift(track)
        await client.music._playNext(interaction.guild.id, client.shoukaku?.players?.get(interaction.guild.id))
        return interaction.editReply({ content: `▶️ Reproduciendo **${track.info?.title||query}**` })
      }
    } catch (e) { await interaction.editReply({ content: `❌ ${e.message}` }) }
  },
}
