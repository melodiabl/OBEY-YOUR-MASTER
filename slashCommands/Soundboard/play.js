const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice')
const path = require('path')
const fs   = require('fs')

const AUDIO_DIR = path.join(process.cwd(), 'commands', '🔊 Soundboard', 'audio')

// Lista de sonidos disponibles (nombre → archivo)
const SOUNDS = (() => {
  try {
    return fs.readdirSync(AUDIO_DIR)
      .filter(f => /\.(mp3|m4a|wav|ogg)$/.test(f))
      .map(f => ({ name: path.parse(f).name, file: path.join(AUDIO_DIR, f) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch { return [] }
})()

module.exports = {
  name: 'play',
  description: 'Reproducir un sonido del soundboard en tu canal de voz',
  options: [
    {
      StringAutocomplete: {
        name: 'sonido',
        description: 'Nombre del sonido (escribe para filtrar)',
        required: true,
      },
    },
  ],

  // Autocomplete: filtrar por lo que escribe el usuario
  autocomplete: async (client, interaction) => {
    const focused = interaction.options.getFocused().toLowerCase()
    const choices = SOUNDS
      .filter(s => s.name.includes(focused))
      .slice(0, 25)
      .map(s => ({ name: s.name, value: s.name }))
    await interaction.respond(choices).catch(() => {})
  },

  run: async (client, interaction) => {
    const err = d => ({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(d)], ephemeral: true })

    if (!client.settings.get(interaction.guild.id, 'SOUNDBOARD'))
      return interaction.reply(err('❌ El sistema de soundboard no está activado.'))

    const soundName = interaction.options.getString('sonido')
    const sound     = SOUNDS.find(s => s.name === soundName)

    if (!sound)
      return interaction.reply(err(`❌ Sonido \`${soundName}\` no encontrado. Usa autocomplete para ver los disponibles.`))

    const voiceChannel = interaction.member?.voice?.channel
    if (!voiceChannel)
      return interaction.reply(err('❌ Debes estar en un canal de voz.'))

    const botChannel = interaction.guild.members.me?.voice?.channel
    if (botChannel && botChannel.id !== voiceChannel.id)
      return interaction.reply(err(`❌ Ya estoy en **${botChannel.name}**. Únete a ese canal.`))

    if (!voiceChannel.permissionsFor(interaction.guild.members.me).has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]))
      return interaction.reply(err('❌ No tengo permisos para unirme o hablar en ese canal.'))

    await interaction.deferReply({ ephemeral: true })

    try {
      const connection = joinVoiceChannel({
        channelId:      voiceChannel.id,
        guildId:        interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      })

      const resource = createAudioResource(sound.file, { inlineVolume: true })
      resource.volume?.setVolume(0.25)

      const player = createAudioPlayer()
      connection.subscribe(player)
      player.play(resource)

      player.on(AudioPlayerStatus.Idle, () => {
        try { player.stop() }    catch {}
        try { connection.destroy() } catch {}
      })
      player.on('error', () => {
        try { connection.destroy() } catch {}
      })

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x5865F2)
          .setDescription(`🔊 Reproduciendo \`${soundName}\` en **${voiceChannel.name}**`)],
      })
    } catch (e) {
      await interaction.editReply(err(`❌ Error: ${e.message}`))
    }
  },
}
