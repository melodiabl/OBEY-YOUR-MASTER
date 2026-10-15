const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const { database } = require('../../handlers/music/database')

module.exports = {
  name: '247',
  description: 'Activa o desactiva el modo 24/7 (el bot permanece en el canal de voz)',
  memberpermissions: ['ManageGuild'],
  run: async (client, interaction) => {
    const gid = interaction.guild.id
    const cur = await database.get247Mode(gid)

    if (cur?.enabled) {
      await database.set247Mode(gid, false)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245)
        .setDescription(obeyUi.limit(obeyUi.owned('📴 **Modo 24/7 desactivado** — podré salir del canal cuando la música se detenga.'), 4096))] })
    }

    const voice = interaction.member?.voice?.channel
    if (!voice)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245)
        .setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz para activar el modo 24/7.'), 4096))], ephemeral: true })

    try { await client.music.joinChannel(gid, voice.id, interaction.channelId) } catch {}
    await database.set247Mode(gid, true, voice.id, interaction.channelId)
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff33)
      .setDescription(obeyUi.limit(`${obeyUi.markup("icon.radio")} **Modo 24/7 activado** — permaneceré en **${voice.name}** aunque la cola termine o se reinicie el bot.`, 4096))] })
  },
}
