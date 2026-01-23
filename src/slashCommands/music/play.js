const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { botHasVoicePerms, isSoundCloudUrl } = require('../../utils/voiceChecks')
const Format = require('../../utils/formatter')
const { replyError } = require('../../core/ui/interactionKit')
const { startSearchPick } = require('../../music/musicInteractions')
const { buildPlayResultEmbed } = require('../../music/musicUi')
const { buildMusicControls } = require('../../music/musicComponents')

function isUrlLike (input) {
  return /^https?:\/\//i.test(String(input || '').trim())
}

function isDirectQuery (input) {
  const q = String(input || '').trim()
  return isUrlLike(q) || /^spotify:/i.test(q)
}

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce música en tu canal de voz (búsqueda / links)')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Enlace o búsqueda de la canción')
        .setRequired(true)
    ),
  DEFER: true,
  async execute (client, interaction) {
    const query = interaction.options.getString('query', true).trim()

    if (isSoundCloudUrl(query)) {
      return replyError(client, interaction, { system: 'music', reason: 'SoundCloud no está soportado. Usa YouTube o Spotify.' })
    }

    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return replyError(client, interaction, { system: 'music', reason: 'Debes estar en un canal de voz.' })
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) {
      return replyError(client, interaction, { system: 'music', reason: 'No tengo permisos para unirme o hablar en ese canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) {
        return replyError(client, interaction, { system: 'music', reason: 'El sistema de música no está inicializado.' })
      }

      if (!isDirectQuery(query) && query.length >= 2) {
        const pickPayload = await startSearchPick({ client, interaction, query }).catch(() => null)
        if (pickPayload) {
          return interaction.editReply(pickPayload).catch(() => {})
        }
      }

      const res = await music.play({
        guildId: interaction.guild.id,
        guild: interaction.guild,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channelId,
        requestedBy: interaction.user,
        query
      })

      const e = await buildPlayResultEmbed({ client, guildId: interaction.guild.id, res, voiceChannelId: voiceChannel.id })
      const controls = buildMusicControls({ ownerId: interaction.user.id, state: res.state })
      return interaction.editReply({ embeds: [e], components: controls }).catch(() => {})
    } catch (e) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'No pude procesar tu solicitud.',
        hint: `Detalle: ${Format.inlineCode(e?.message || e)}`
      })
    }
  }
}

