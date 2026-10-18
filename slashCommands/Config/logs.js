const { MessageFlags } = require('discord.js')
const { openLogSetup } = require('../../handlers/setup-logs')

module.exports = {
  name: 'logs',
  description: 'Configura las categorías, canales y privacidad de los registros.',
  memberpermissions: ['ManageGuild'],
  options: [
    { Channel: { name: 'canal', description: 'Proponer un canal general; revisa y guarda en el panel.', required: false } },
  ],
  run: async (client, interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const channel = interaction.options.getChannel('canal')
    const origin = { guild: interaction.guild, author: interaction.user, channel: interaction.channel, channelId: interaction.channelId,
      async reply(payload) {
        const message = await interaction.editReply(payload)
        return Object.create(message, { edit: { value: next => interaction.editReply(next) } })
      },
    }
    return openLogSetup(client, origin, channel ? { defaultChannel: channel.id } : undefined)
  },
}
