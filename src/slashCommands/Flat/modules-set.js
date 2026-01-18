const { SlashCommandBuilder } = require('discord.js')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { ensureMap } = require('../../utils/interactionUtils')

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
  'suggestions',
  'tickets',
  'clans',
  'pets',
  'games'
]

function toChoice (k) {
  return { name: k, value: k }
}

module.exports = {
  INTERNAL_ROLE: INTERNAL_ROLES.ADMIN,
  INTERNAL_PERMS: [PERMS.CONFIG_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('modules-set')
    .setDescription('Activa o desactiva un modulo del bot en este servidor')
    .addStringOption(o =>
      o
        .setName('modulo')
        .setDescription('Modulo')
        .setRequired(true)
        .addChoices(...MODULE_KEYS.map(toChoice))
    )
    .addBooleanOption(o =>
      o
        .setName('habilitado')
        .setDescription('Estado')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const moduleKey = interaction.options.getString('modulo', true)
    const enabled = interaction.options.getBoolean('habilitado', true)
    const guildData = await client.db.getGuildData(interaction.guild.id)
    const modules = ensureMap(guildData.modules)
    modules.set(moduleKey, enabled)
    guildData.modules = modules
    await guildData.save()
    return interaction.reply({ content: `✅ Modulo \`${moduleKey}\` -> **${enabled ? 'habilitado' : 'deshabilitado'}**.`, ephemeral: true })
  }
}
