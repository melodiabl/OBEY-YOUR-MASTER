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
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)

    if (!w || w.channel === 'nochannel' || !w.channel) {
      return interaction.reply({
        embeds: [err('❌ El sistema de bienvenida no está configurado.\nUsa `!setup-welcome` para configurarlo.')],
        ephemeral: true,
      })
    }

    const channel   = interaction.guild.channels.cache.get(w.channel)
    const hasImage  = w.image === true || w.image === 1
    const hasCard   = w.pb    === true || w.pb    === 1

    const embed = new EmbedBuilder()
      .setColor(es.color || 0x5865F2)
      .setTitle(`👋 Configuración de Bienvenida — ${interaction.guild.name}`)
      .setThumbnail(interaction.guild.iconURL())
      .addFields(
        { name: '📢 Canal',         value: channel ? `<#${w.channel}>` : `\`${w.channel}\` (no encontrado)`, inline: true },
        { name: '🖼️ Imagen',        value: hasImage ? '✅ Activada' : '❌ Desactivada', inline: true },
        { name: '🪪 Foto de perfil', value: hasCard  ? '✅ Circular'  : '❌ Sin foto',    inline: true },
        { name: '🎨 Frame',         value: w.frame  ? `✅ Color: \`${w.framecolor || '#5865F2'}\`` : '❌ Sin frame', inline: true },
        { name: '📊 Contador',      value: w.membercount ? '✅ Activado' : '❌ Desactivado', inline: true },
        { name: '🏠 Nombre servidor', value: w.servername ? '✅ Activado' : '❌ Desactivado', inline: true },
        { name: '✉️ Canal 2',       value: w.secondchannel && w.secondchannel !== 'nochannel'
          ? `<#${w.secondchannel}>` : '❌ No configurado', inline: true },
        { name: '📬 DM',            value: w.dm ? '✅ Activado' : '❌ Desactivado', inline: true },
        { name: '🔒 Captcha',       value: w.captcha ? '✅ Activado' : '❌ Desactivado', inline: true },
      )
      .addFields(
        { name: '💬 Mensaje',
          value: w.msg
            ? `\`\`\`${String(w.msg).substring(0, 200)}\`\`\``
            : '*(no configurado)*',
        }
      )
      .setFooter({ text: 'Usa !setup-welcome para cambiar la configuración' })

    await interaction.reply({ embeds: [embed], ephemeral: true })
  },
}
