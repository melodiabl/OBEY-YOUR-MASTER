const os = require('os')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

function formatBytes (b) {
  const n = Number(b || 0)
  if (n < 1024) return `${n}B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)}KB`
  if (n < 1024 ** 3) return `${(n / (1024 ** 2)).toFixed(1)}MB`
  return `${(n / (1024 ** 3)).toFixed(1)}GB`
}

module.exports = createSystemSlashCommand({
  name: 'bot',
  description: 'Estado, diagnóstico y healthchecks',
  moduleKey: 'admin',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'health',
      description: 'Healthcheck rápido (latencia + memoria)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LOGS_VIEW] },
      handler: async (client, interaction) => {
        const mem = process.memoryUsage()
        return interaction.reply({
          content: [
            `✅ **OK**`,
            `- Ping WS: **${client.ws.ping}ms**`,
            `- Uptime: **${Math.floor(process.uptime())}s**`,
            `- RAM RSS: **${formatBytes(mem.rss)}**`,
            `- Node: **${process.version}**`,
            `- CPU: **${os.cpus()?.[0]?.model || 'N/A'}**`
          ].join('\n'),
          ephemeral: true
        })
      }
    },
    {
      name: 'db',
      description: 'Verifica conectividad a DB con lecturas básicas',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SYNC_RUN] },
      handler: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true })
        await client.db.getGuildData(interaction.guild.id)
        await client.db.getUserData(interaction.user.id)
        return interaction.editReply('✅ DB OK (guild + user upsert).')
      }
    }
  ]
})
