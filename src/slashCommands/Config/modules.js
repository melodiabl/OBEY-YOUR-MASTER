const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { resolveInternalIdentity } = require('../../core/auth/resolveInternalIdentity')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { authorizeInternal } = require('../../core/auth/authorize')

// Lista controlada de módulos. Evita "typos" y permite escalar de forma consistente.
const MODULE_KEYS = [
  'auth',
  'admin',
  'moderation',
  'logs',
  'config',
  'economy',
  'levels',
  'jobs',
  'fun',
  'music',
  'gacha',
  'marriage',
  'suggestions'
]

function toChoice (k) {
  return { name: k, value: k }
}

function normalizeMap (m) {
  if (!m) return new Map()
  if (typeof m.get === 'function') return m
  return new Map(Object.entries(m))
}

async function requireInternal ({ interaction }) {
  const identity = await resolveInternalIdentity({
    guildId: interaction.guild.id,
    userId: interaction.user.id,
    member: interaction.member
  })

  const authz = authorizeInternal({
    identity,
    requiredRole: INTERNAL_ROLES.ADMIN,
    requiredPerms: PERMS.CONFIG_MANAGE
  })

  if (!authz.ok) {
    await interaction.reply({ content: `❌ ${authz.reason}`, ephemeral: true })
    return null
  }

  return identity
}

module.exports = {
  MODULE: 'config',
  CMD: new SlashCommandBuilder()
    .setName('modules')
    .setDescription('Activa o desactiva sistemas del bot por servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sc =>
      sc
        .setName('set')
        .setDescription('Activa/desactiva un módulo')
        .addStringOption(o =>
          o
            .setName('modulo')
            .setDescription('Módulo')
            .setRequired(true)
            .addChoices(...MODULE_KEYS.map(toChoice))
        )
        .addBooleanOption(o =>
          o
            .setName('habilitado')
            .setDescription('Estado')
            .setRequired(true)
        )
    )
    .addSubcommand(sc =>
      sc
        .setName('list')
        .setDescription('Lista el estado de módulos')
    ),

  async execute (client, interaction) {
    if (!interaction.guild) return

    const sub = interaction.options.getSubcommand()
    const identity = await requireInternal({ interaction })
    if (!identity) return

    const guildData = await client.db.getGuildData(interaction.guild.id)
    const modules = normalizeMap(guildData.modules)

    if (sub === 'set') {
      const moduleKey = interaction.options.getString('modulo', true)
      const enabled = interaction.options.getBoolean('habilitado', true)
      modules.set(moduleKey, enabled)
      guildData.modules = modules
      await guildData.save()

      return interaction.reply({ content: `✅ Módulo \`${moduleKey}\` -> **${enabled ? 'habilitado' : 'deshabilitado'}**.`, ephemeral: true })
    }

    if (sub === 'list') {
      const lines = MODULE_KEYS.map(k => {
        const v = modules.get(k)
        const state = v === false ? '❌ OFF' : '✅ ON'
        return `${state} \`${k}\``
      })

      return interaction.reply({ content: lines.join('\n'), ephemeral: true })
    }

    return interaction.reply({ content: '❌ Subcomando no reconocido.', ephemeral: true })
  }
}
