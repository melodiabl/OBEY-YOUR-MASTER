const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { economy } = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, okEmbed } = require('../../core/ui/uiKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

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
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        await economy.streamStart({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const e = okEmbed({
          ui,
          system: 'economy',
          title: `${Emojis.work} Stream iniciado`,
          lines: [
            `${Emojis.dot} Cobrá con ${Format.inlineCode('/stream collect')}.`,
            `${Emojis.dot} Finalizá con ${Format.inlineCode('/stream stop')}.`
          ]
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'collect',
      description: 'Cobra lo generado por tu stream',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const res = await economy.streamCollect({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const e = embed({
          ui,
          system: 'economy',
          kind: 'success',
          title: `${Emojis.money} Cobro realizado`,
          description: [
            headerLine(Emojis.economy, 'Stream'),
            `${Emojis.dot} **Cobrado:** ${Format.inlineCode('+' + money(res.earned))}`,
            `${Emojis.dot} **Acumulado:** ${Format.inlineCode(money(res.stream.totalEarned))}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'stop',
      description: 'Detiene tu stream y cobra lo pendiente',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const res = await economy.streamStop({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const e = embed({
          ui,
          system: 'economy',
          kind: 'warn',
          title: `${Emojis.stop} Stream detenido`,
          description: [
            headerLine(Emojis.economy, 'Cierre'),
            `${Emojis.dot} **Cobrado:** ${Format.inlineCode('+' + money(res.earned))}`,
            `${Emojis.dot} **Total generado:** ${Format.inlineCode(money(res.stream.totalEarned))}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ]
})
