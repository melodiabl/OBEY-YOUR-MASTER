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

module.exports = {
  INTERNAL_ROLE: INTERNAL_ROLES.ADMIN,
  INTERNAL_PERMS: [PERMS.CONFIG_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('modules-list')
    .setDescription('Lista el estado de modulos del bot en este servidor'),

  async execute (client, interaction) {
    const guildData = await client.db.getGuildData(interaction.guild.id)
    const modules = ensureMap(guildData.modules)
    const lines = MODULE_KEYS.map(k => {
      const v = modules.get(k)
      const state = v === false ? '❌ OFF' : '✅ ON'
      return `${state} \`${k}\``
    })
    return interaction.reply({ content: lines.join('\n'), ephemeral: true })
  }
}

