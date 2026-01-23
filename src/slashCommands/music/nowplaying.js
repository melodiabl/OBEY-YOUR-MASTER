const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { replyError, replyWarn } = require('../../core/ui/interactionKit')
const { buildNowPlayingEmbed } = require('../../music/musicUi')
const { buildMusicControls } = require('../../music/musicComponents')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Muestra la canción actual + controles'),
  DEFER: true,
  async execute (client, interaction) {
    const music = getMusic(client)
    if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de música no está inicializado.' })

    const state = await music.nowPlaying({ guildId: interaction.guild.id }).catch(() => null)
    if (!state) return replyError(client, interaction, { system: 'music', reason: 'No pude obtener el estado de música.' })

    if (!state.currentTrack) {
      return replyWarn(client, interaction, {
        system: 'music',
        title: 'Sin reproducción',
        lines: ['No hay música reproduciéndose en este momento.']
      })
    }

    const player = music.shoukaku.players.get(interaction.guild.id)
    const position = player ? player.position : 0

    const e = await buildNowPlayingEmbed({ client, guildId: interaction.guild.id, state, positionMs: position })
    const controls = buildMusicControls({ ownerId: interaction.user.id, state })
    return interaction.editReply({ embeds: [e], components: controls }).catch(() => {})
  }
}
