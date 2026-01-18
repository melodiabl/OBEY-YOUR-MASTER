const { getMusic } = require('../../music')
const { isSoundCloudUrl, getMemberVoiceChannel, botHasVoicePerms } = require('../../utils/voiceChecks')

module.exports = {
  DESCRIPTION: 'Reproduce musica en tu canal de voz (YouTube / Spotify).',
  ALIASES: ['p'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute (client, message, args) {
    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) return message.reply('Debes unirte a un canal de voz para reproducir musica.')

    const me = message.guild.members.me || message.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) return message.reply('No tengo permisos para unirme o hablar en ese canal de voz.')

    const query = args.join(' ').trim()
    if (!query) return message.reply('Debes proporcionar un enlace o busqueda.')

    if (isSoundCloudUrl(query)) {
      return message.reply('SoundCloud no esta soportado. Usa YouTube o Spotify.')
    }

    const music = getMusic(client)
    if (!music) return message.reply('El sistema de musica no esta inicializado.')

    try {
      const res = await music.play({
        guildId: message.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
        requestedBy: message.author,
        query
      })

      if (res.started) return message.reply(`Ahora: **${res.track.title}**`)
      return message.reply(`Agregado a la cola: **${res.track.title}**`)
    } catch (e) {
      return message.reply(`No pude reproducir: ${e?.message || e}`)
    }
  }
}
