const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { reloadPlugins } = require('../../core/plugins/pluginLoader')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed } = require('../../core/ui/uiKit')

module.exports = createSystemSlashCommand({
  name: 'plugins',
  description: 'Sistema de plugins (lista/recarga)',
  moduleKey: 'config',
  subcommands: [
    {
      name: 'list',
      description: 'Lista plugins cargados',
      auth: { role: INTERNAL_ROLES.CREATOR, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)

        const plugins = Array.from(client.plugins?.values?.() || [])
        const lines = plugins.map(p => `${Emojis.dot} ${p.ok ? Emojis.success : Emojis.error} **${p.name}**${p.version ? ` ${Format.inlineCode(p.version)}` : ''}${p.description ? ` *${p.description}*` : ''}${p.error ? `\n${Emojis.quote} ${Format.italic(p.error)}` : ''}`)

        const lastLoad = client.pluginMeta?.lastLoad ? `<t:${Math.floor(new Date(client.pluginMeta.lastLoad).getTime() / 1000)}:R>` : 'N/A'
        const e = embed({
          ui,
          system: 'config',
          kind: 'info',
          title: `${Emojis.system} Plugins`,
          description: [
            headerLine(Emojis.system, 'Estado'),
            `${Emojis.dot} **Directorio:** ${Format.inlineCode(client.pluginMeta?.lastResult?.dir || 'plugins/bot')}`,
            `${Emojis.dot} **Última carga:** ${lastLoad}`,
            Format.softDivider(20),
            lines.join('\n') || '*No hay plugins.*'
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'reload',
      description: 'Recarga plugins desde disco',
      auth: { role: INTERNAL_ROLES.CREATOR, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const res = await reloadPlugins(client)
        client.pluginMeta.lastLoad = new Date()
        client.pluginMeta.lastResult = res
        client.plugins.clear()
        for (const p of res.plugins) client.plugins.set(p.name, p)

        const e = embed({
          ui,
          system: 'config',
          kind: res.failed ? 'warn' : 'success',
          title: `${Emojis.system} Plugins recargados`,
          description: [
            headerLine(Emojis.system, 'Resultado'),
            `${Emojis.dot} **Cargados:** ${Format.inlineCode(res.loaded)}`,
            `${Emojis.dot} **Fallidos:** ${Format.inlineCode(res.failed)}`,
            `${Emojis.dot} **Dir:** ${Format.inlineCode(res.dir)}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ]
})
