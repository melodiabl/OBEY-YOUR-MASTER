const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
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

    const LANG_LABEL = { es: obeyUi.owned('🇪🇸 Español'), en: obeyUi.owned('🇬🇧 English'), de: obeyUi.owned('🇩🇪 Deutsch'), fr: obeyUi.owned('🇫🇷 Français'), it: obeyUi.owned('🇮🇹 Italiano'), nl: obeyUi.owned('🇳🇱 Dutch'), tr: obeyUi.owned('🇹🇷 Türkçe') }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(obeyUi.limit(`${obeyUi.markup("icon.settings")} Configuración — ${g.name}`, 256))
      .setThumbnail(g.iconURL())
      .addFields(
        { name: obeyUi.owned('🔤 Prefijo'),    value: `\`${prefix}\``,                                                      inline: true },
        { name: obeyUi.owned('🌐 Idioma'),     value: LANG_LABEL[language] || language,                                      inline: true },
        { name: obeyUi.owned('🎵 Música'),     value: musicOn ? obeyUi.owned('✅ Activada') : obeyUi.owned('❌ Desactivada'),                            inline: true },
        { name: obeyUi.owned('📋 Canal logs'), value: logCh && logCh !== 'no' ? `<#${logCh}>` : '*(no configurado)*',       inline: true },
        { name: obeyUi.owned('👋 Bienvenida'), value: welcomeCh && welcomeCh !== 'nochannel' ? `<#${welcomeCh}>` : '*(no configurado)*', inline: true },
        { name: obeyUi.owned('🎭 Autoroles'),  value: autoroles.length ? autoroles.slice(0, 5).map(id => `<@&${id}>`).join(', ') : '*(ninguno)*', inline: true },
        { name: obeyUi.owned('👑 Roles admin'), value: adminroles.length ? adminroles.slice(0, 5).map(id => `<@&${id}>`).join(', ') : '*(ninguno)*', inline: false },
      )
      .setFooter({ text: 'Usa /config para consultar las opciones y cambiar ajustes' })
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
  },
}
