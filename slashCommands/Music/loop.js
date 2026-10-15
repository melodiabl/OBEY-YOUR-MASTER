const obeyUi = require("../../handlers/assets/system")
const { registry } = require('../../handlers/assets/registry')
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'loop', description: 'Configura el modo de repeticion',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ StringChoices: { name: 'modo', description: 'Modo de repeticion', required: true,
    choices: [
      { name: 'Desactivado', value: 'none' },
      { name: 'Cancion actual', value: 'track' },
      { name: 'Cola completa', value: 'queue' },
    ],
  }}],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz.'), 4096))], ephemeral: true })
    await interaction.deferReply()
    const mode = interaction.options.getString('modo')
    client.music?.setLoop(interaction.guild.id, mode)
    const info = {
      none:  { emoji: obeyUi.component(registry.markup('icon.stop')), label: 'Loop desactivado',       desc: 'La cola terminará normalmente.',                  color: 0x4f545c },
      track: { emoji: obeyUi.component(registry.markup('icon.repeat-one')), label: 'Repitiendo canción',      desc: 'La canción actual se repetirá indefinidamente.',  color: 0x57F287 },
      queue: { emoji: obeyUi.component(registry.markup('icon.loop')), label: 'Repitiendo cola completa', desc: 'La cola completa se repetirá en bucle.',         color: 0x5865F2 },
    }
    const i = info[mode] || info.none
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(i.color)
      .setTitle(obeyUi.limit(`${i.emoji} ${i.label}`, 256))
      .setDescription(obeyUi.limit(i.desc, 4096))] })
  },
}
