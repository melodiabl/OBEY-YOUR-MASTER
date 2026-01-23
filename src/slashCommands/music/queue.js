const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { replyError } = require('../../core/ui/interactionKit')
const { buildQueueEmbed } = require('../../music/musicUi')
const { buildMusicControls } = require('../../music/musicComponents')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola (premium) con estado y tiempos')
    .addIntegerOption(o =>
      o
        .setName('pagina')
        .setDescription('Página de la cola')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)
    ),
  DEFER: true,
  async execute (client, interaction) {
    const music = getMusic(client)
    if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de música no está inicializado.' })

    const page = interaction.options.getInteger('pagina') || 1
    const state = await music.getQueue({ guildId: interaction.guild.id }).catch(() => null)
    if (!state) return replyError(client, interaction, { system: 'music', reason: 'No pude obtener la cola.' })

    const player = music.shoukaku.players.get(interaction.guild.id)
    const position = player ? player.position : 0

    const e = await buildQueueEmbed({ client, guildId: interaction.guild.id, state, positionMs: position, page, pageSize: 8 })
    const controls = state.currentTrack ? buildMusicControls({ ownerId: interaction.user.id, state }) : []
    return interaction.editReply({ embeds: [e], components: controls }).catch(() => {})
  }
}
