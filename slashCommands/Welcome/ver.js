const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'ver',
  description: 'Ver la configuración actual del sistema de bienvenida',
  memberpermissions: ['ManageGuild'],
  options: [],

  run: async (client, interaction) => {
    const gid = interaction.guild.id
    const w   = client.settings.get(gid, 'welcome') || {}
    const es  = client.settings.get(gid, 'embed') || {}
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))

    if (!w || w.channel === 'nochannel' || !w.channel) {
      return interaction.reply({
        embeds: [err(obeyUi.owned('❌ El sistema de bienvenida no está configurado.\nUsa `!setup-welcome` para configurarlo.'))],
        ephemeral: true,
      })
    }

    const channel   = interaction.guild.channels.cache.get(w.channel)
    const hasImage  = w.image === true || w.image === 1
    const hasCard   = w.pb    === true || w.pb    === 1

    const embed = new EmbedBuilder()
      .setColor(es.color || 0x5865F2)
      .setTitle(obeyUi.limit(`${obeyUi.markup("icon.hand")} Configuración de Bienvenida — ${interaction.guild.name}`, 256))
      .setThumbnail(interaction.guild.iconURL())
      .addFields(
        { name: obeyUi.owned('📢 Canal'),         value: channel ? `<#${w.channel}>` : `\`${w.channel}\` (no encontrado)`, inline: true },
        { name: obeyUi.owned('🖼️ Imagen'),        value: hasImage ? obeyUi.owned('✅ Activada') : obeyUi.owned('❌ Desactivada'), inline: true },
        { name: obeyUi.owned('🪪 Foto de perfil'), value: hasCard  ? obeyUi.owned('✅ Circular')  : obeyUi.owned('❌ Sin foto'),    inline: true },
        { name: obeyUi.owned('🎨 Frame'),         value: w.frame  ? `${obeyUi.markup("icon.success")} Color: \`${w.framecolor || '#5865F2'}\`` : obeyUi.owned('❌ Sin frame'), inline: true },
        { name: obeyUi.owned('📊 Contador'),      value: w.membercount ? obeyUi.owned('✅ Activado') : obeyUi.owned('❌ Desactivado'), inline: true },
        { name: obeyUi.owned('🏠 Nombre servidor'), value: w.servername ? obeyUi.owned('✅ Activado') : obeyUi.owned('❌ Desactivado'), inline: true },
        { name: obeyUi.owned('✉️ Canal 2'),       value: w.secondchannel && w.secondchannel !== 'nochannel'
          ? `<#${w.secondchannel}>` : obeyUi.owned('❌ No configurado'), inline: true },
        { name: obeyUi.owned('📬 DM'),            value: w.dm ? obeyUi.owned('✅ Activado') : obeyUi.owned('❌ Desactivado'), inline: true },
        { name: obeyUi.owned('🔒 Captcha'),       value: w.captcha ? obeyUi.owned('✅ Activado') : obeyUi.owned('❌ Desactivado'), inline: true },
      )
      .addFields(
        { name: obeyUi.owned('💬 Mensaje'),
          value: w.msg
            ? `\`\`\`${String(w.msg).substring(0, 200)}\`\`\``
            : '*(no configurado)*',
        }
      )
      .setFooter(obeyMeta.asFooter({ text: 'Usa !setup-welcome para cambiar la configuración' }))

    await interaction.reply({ embeds: [embed], ephemeral: true })
  },
}
