const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const Systems = require('../../systems')
const { getGuildUiConfig, headerLine, embed } = require('../../core/ui/uiKit')

function onOff (ok) {
  return ok ? `${Emojis.success} on` : `${Emojis.error} off`
}
function isModuleOn (guildData, key) {
  const modules = guildData?.modules
  if (!modules) return true
  if (typeof modules.get === 'function') return modules.get(key) !== false
  return modules?.[key] !== false
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('sistemas')
    .setDescription('Verifica el estado de los sistemas del bot (panel visual)'),

  async execute (client, interaction) {
    const ui = await getGuildUiConfig(client, interaction.guild.id)
    const guildData = await client.db.getGuildData(interaction.guild.id).catch(() => null)

    const fields = [
      { name: `${Emojis.economy} Economía`, value: onOff(Boolean(Systems.economy)), inline: true },
      { name: `${Emojis.clan} Clanes`, value: onOff(Boolean(Systems.clans)), inline: true },
      { name: `${Emojis.level} Niveles`, value: onOff(Boolean(Systems.levels)), inline: true },
      { name: `${Emojis.music} Música`, value: onOff(Boolean(client.shoukaku)), inline: true },
      { name: `${Emojis.giveaway} Sorteos`, value: onOff(Boolean(Systems.giveaways)), inline: true },
      { name: `${Emojis.ticket} Tickets`, value: onOff(Boolean(Systems.tickets)), inline: true },
      { name: `${Emojis.moderation} Moderación`, value: onOff(Boolean(Systems.moderation)), inline: true },
      { name: `${Emojis.logs} Logs`, value: onOff(Boolean(Systems.logs)), inline: true },
      { name: `${Emojis.security} Seguridad`, value: onOff(Boolean(Systems.security) && isModuleOn(guildData, 'security')), inline: true },
      { name: `${Emojis.voice} Voice`, value: onOff(Boolean(Systems.voice) && isModuleOn(guildData, 'voice')), inline: true }
    ]

    const e = embed({
      ui,
      system: 'info',
      kind: 'info',
      title: `${Emojis.system} Estado de sistemas`,
      description: [
        headerLine(Emojis.system, 'Checklist'),
        `${Emojis.dot} **Ping:** ${Format.inlineCode(`${client.ws.ping}ms`)}`,
        `${Emojis.dot} **Uptime:** ${Format.inlineCode(`${Math.floor(process.uptime())}s`)}`,
        `${Emojis.dot} **Guild:** ${Format.inlineCode(interaction.guild.id)}`
      ].join('\n'),
      fields,
      signature: 'Todo sincronizado'
    })

    return interaction.reply({ embeds: [e], ephemeral: true })
  }
}
