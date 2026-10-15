const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const { database } = require('../../handlers/music/database')

const OK = 0x00ff33, NO = 0xED4245

module.exports = {
  name: '247',
  category: 'Music',
  aliases: ['24/7', '24-7', 'stay', 'alwayson'],
  description: 'Activa o desactiva el modo 24/7 (el bot permanece en el canal de voz)',
  usage: '247',
  memberpermissions: ['ManageGuild'],
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    const gid = message.guild.id
    const cur = await database.get247Mode(gid)

    if (cur?.enabled) {
      await database.set247Mode(gid, false)
      return message.reply({ embeds: [new EmbedBuilder().setColor(NO)
        .setDescription(obeyUi.limit(obeyUi.owned('📴 **Modo 24/7 desactivado** — podré salir del canal cuando la música se detenga.'), 4096))] }).catch(() => {})
    }

    const voice = message.member?.voice?.channel
    if (!voice)
      return message.reply({ embeds: [new EmbedBuilder().setColor(NO)
        .setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz para activar el modo 24/7.'), 4096))] }).catch(() => {})

    try { await client.music.joinChannel(gid, voice.id, message.channel.id) } catch {}
    await database.set247Mode(gid, true, voice.id, message.channel.id)
    return message.reply({ embeds: [new EmbedBuilder().setColor(OK)
      .setDescription(obeyUi.limit(`${obeyUi.markup("icon.radio")} **Modo 24/7 activado** — permaneceré en **${voice.name}** aunque la cola termine o se reinicie el bot.`, 4096))] }).catch(() => {})
  },
}
