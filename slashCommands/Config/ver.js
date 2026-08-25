const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'ver',
  description: 'Ver la configuración actual del servidor',
  memberpermissions: ['ManageGuild'],
  options: [],

  run: async (client, interaction) => {
    const gid = interaction.guild.id
    const g   = interaction.guild

    const prefix     = client.settings.get(gid, 'prefix')     || '!'
    const language   = client.settings.get(gid, 'language')   || 'es'
    const musicOn    = !!client.settings.get(gid, 'MUSIC')
    const logCh      = client.settings.get(gid, 'logger.channel')
    const adminroles = client.settings.get(gid, 'adminroles') || []
    const autoroles  = client.settings.get(gid, 'welcome.roles') || []
    const welcomeCh  = client.settings.get(gid, 'welcome.channel')

    const LANG_LABEL = { es: '🇪🇸 Español', en: '🇬🇧 English', de: '🇩🇪 Deutsch', fr: '🇫🇷 Français', it: '🇮🇹 Italiano', nl: '🇳🇱 Dutch', tr: '🇹🇷 Türkçe' }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`⚙️ Configuración — ${g.name}`)
      .setThumbnail(g.iconURL())
      .addFields(
        { name: '🔤 Prefijo',    value: `\`${prefix}\``,                                                      inline: true },
        { name: '🌐 Idioma',     value: LANG_LABEL[language] || language,                                      inline: true },
        { name: '🎵 Música',     value: musicOn ? '✅ Activada' : '❌ Desactivada',                            inline: true },
        { name: '📋 Canal logs', value: logCh && logCh !== 'no' ? `<#${logCh}>` : '*(no configurado)*',       inline: true },
        { name: '👋 Bienvenida', value: welcomeCh && welcomeCh !== 'nochannel' ? `<#${welcomeCh}>` : '*(no configurado)*', inline: true },
        { name: '🎭 Autoroles',  value: autoroles.length ? autoroles.slice(0, 5).map(id => `<@&${id}>`).join(', ') : '*(ninguno)*', inline: true },
        { name: '👑 Roles admin', value: adminroles.length ? adminroles.slice(0, 5).map(id => `<@&${id}>`).join(', ') : '*(ninguno)*', inline: false },
      )
      .setFooter({ text: 'Usa /config <módulo> para cambiar ajustes' })
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
  },
}
