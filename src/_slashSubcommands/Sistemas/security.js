const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = createSystemSlashCommand({
  name: 'security',
  description: 'Seguridad y anti-abuso (base)',
  moduleKey: 'security',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'status',
      description: 'Muestra configuración de seguridad del servidor',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LOGS_VIEW] },
      handler: async (client, interaction) => {
        const g = await client.db.getGuildData(interaction.guild.id)
        return interaction.reply({
          content: `**Seguridad (base)**\n- globalCooldownMs: **${Number(g.globalCooldownMs || 0)}ms**\n- módulo security: **${(g.modules?.get && g.modules.get('security') === false) ? 'OFF' : 'ON'}**`,
          ephemeral: true
        })
      }
    },
    {
      name: 'set-global-cooldown',
      description: 'Configura cooldown global (ms) para todos los slash commands',
      options: [
        {
          apply: (sc) =>
            sc.addIntegerOption(o =>
              o
                .setName('ms')
                .setDescription('Milisegundos (0 para desactivar)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(60_000)
            )
        }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ms = interaction.options.getInteger('ms', true)
        const g = await client.db.getGuildData(interaction.guild.id)
        g.globalCooldownMs = ms
        await g.save()
        return interaction.reply({ content: `✅ globalCooldownMs actualizado a **${ms}ms**.`, ephemeral: true })
      }
    }
  ]
})

