const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { economy } = require('../../systems')

module.exports = createSystemSlashCommand({
  name: 'stream',
  description: 'Sistema de streaming (economía)',
  moduleKey: 'economy',
  subcommands: [
    {
      name: 'start',
      description: 'Inicia un stream',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        await economy.streamStart({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: '✅ Stream iniciado. Usa `/stream collect` para cobrar.', ephemeral: true })
      }
    },
    {
      name: 'collect',
      description: 'Cobra lo generado por tu stream',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const res = await economy.streamCollect({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: `✅ Cobrado: **+${res.earned}**. Total acumulado: **${res.stream.totalEarned}**.`, ephemeral: true })
      }
    },
    {
      name: 'stop',
      description: 'Detiene tu stream y cobra lo pendiente',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const res = await economy.streamStop({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: `✅ Stream detenido. Cobrado: **+${res.earned}**. Total: **${res.stream.totalEarned}**.`, ephemeral: true })
      }
    }
  ]
})
