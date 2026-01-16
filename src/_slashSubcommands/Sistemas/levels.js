const { EmbedBuilder, ChannelType } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const UserSchema = require('../../database/schemas/UserSchema')

function nextLevelXp (level) {
  const l = Number(level || 1)
  return l * l * 100
}

async function addXp ({ client, userID, amount }) {
  const a = Number(amount)
  if (!Number.isFinite(a)) throw new Error('Cantidad inválida.')
  const user = await client.db.getUserData(userID)
  user.xp = Number(user.xp || 0) + a
  if (user.xp < 0) user.xp = 0

  const needed = nextLevelXp(user.level || 1)
  let leveledUp = false
  if (user.xp >= needed) {
    user.level = Number(user.level || 1) + 1
    user.xp = 0
    leveledUp = true
  }
  await user.save()
  return { user, leveledUp, needed }
}

module.exports = createSystemSlashCommand({
  name: 'levels',
  description: 'XP / niveles / rankings (base escalable)',
  moduleKey: 'levels',
  defaultCooldownMs: 2_000,
  groups: [
    {
      name: 'rewards',
      description: 'Recompensas por nivel (roles)',
      subcommands: [
        {
          name: 'list',
          description: 'Lista recompensas configuradas',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LEVELS_CONFIG] },
          handler: async (client, interaction) => {
            const guildDoc = await client.db.getGuildData(interaction.guild.id)
            const map = guildDoc.levelsRoleRewards
            const entries = map?.entries ? Array.from(map.entries()) : Object.entries(map || {})
            if (!entries.length) return interaction.reply({ content: 'No hay rewards configurados.', ephemeral: true })
            const lines = entries
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([lvl, roleId]) => `- Nivel **${lvl}** → <@&${roleId}>`)
            return interaction.reply({ content: `**Rewards**\n${lines.join('\n')}`, ephemeral: true })
          }
        },
        {
          name: 'set',
          description: 'Set reward: nivel → rol',
          options: [
            {
              apply: (sc) =>
                sc
                  .addIntegerOption(o => o.setName('level').setDescription('Nivel').setRequired(true).setMinValue(1).setMaxValue(1000))
                  .addRoleOption(o => o.setName('role').setDescription('Rol').setRequired(true))
            }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LEVELS_CONFIG] },
          handler: async (client, interaction) => {
            const level = String(interaction.options.getInteger('level', true))
            const role = interaction.options.getRole('role', true)
            const guildDoc = await client.db.getGuildData(interaction.guild.id)
            const map = guildDoc.levelsRoleRewards
            if (map?.set) map.set(level, role.id)
            else guildDoc.levelsRoleRewards = new Map([[level, role.id]])
            guildDoc.markModified('levelsRoleRewards')
            await guildDoc.save()
            return interaction.reply({ content: `ƒo. Reward set: nivel ${level} → <@&${role.id}>`, ephemeral: true })
          }
        },
        {
          name: 'remove',
          description: 'Elimina reward de un nivel',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('level').setDescription('Nivel').setRequired(true).setMinValue(1).setMaxValue(1000)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LEVELS_CONFIG] },
          handler: async (client, interaction) => {
            const level = String(interaction.options.getInteger('level', true))
            const guildDoc = await client.db.getGuildData(interaction.guild.id)
            if (guildDoc.levelsRoleRewards?.delete) guildDoc.levelsRoleRewards.delete(level)
            guildDoc.markModified('levelsRoleRewards')
            await guildDoc.save()
            return interaction.reply({ content: `ƒo. Reward eliminado para nivel ${level}.`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'config',
      description: 'Configuración de niveles',
      subcommands: [
        {
          name: 'show',
          description: 'Muestra configuración',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LEVELS_CONFIG] },
          handler: async (client, interaction) => {
            const doc = await client.db.getGuildData(interaction.guild.id)
            return interaction.reply({
              content: `**Levels config**\nEnabled: ${doc.levelsEnabled ? 'ON' : 'OFF'}\nAnnounce: ${doc.levelsAnnounceChannel ? `<#${doc.levelsAnnounceChannel}>` : '*default*'}`,
              ephemeral: true
            })
          }
        },
        {
          name: 'enable',
          description: 'Habilita niveles',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LEVELS_CONFIG] },
          handler: async (client, interaction) => {
            const doc = await client.db.getGuildData(interaction.guild.id)
            doc.levelsEnabled = true
            await doc.save()
            return interaction.reply({ content: 'ƒo. Levels habilitado.', ephemeral: true })
          }
        },
        {
          name: 'disable',
          description: 'Deshabilita niveles',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LEVELS_CONFIG] },
          handler: async (client, interaction) => {
            const doc = await client.db.getGuildData(interaction.guild.id)
            doc.levelsEnabled = false
            await doc.save()
            return interaction.reply({ content: 'ƒo. Levels deshabilitado.', ephemeral: true })
          }
        },
        {
          name: 'channel',
          description: 'Set canal de anuncios',
          options: [{ apply: (sc) => sc.addChannelOption(o => o.setName('channel').setDescription('Canal').setRequired(true).addChannelTypes(ChannelType.GuildText)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LEVELS_CONFIG] },
          handler: async (client, interaction) => {
            const channel = interaction.options.getChannel('channel', true)
            const doc = await client.db.getGuildData(interaction.guild.id)
            doc.levelsAnnounceChannel = channel.id
            await doc.save()
            return interaction.reply({ content: `ƒo. Anuncios en <#${channel.id}>.`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'xp',
      description: 'Administrar XP (staff)',
      subcommands: [
        {
          name: 'add',
          description: 'Agrega XP',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('XP').setRequired(true).setMinValue(1).setMaxValue(1_000_000)) }],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LEVELS_XP] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user', true)
            const amount = interaction.options.getInteger('amount', true)
            const res = await addXp({ client, userID: user.id, amount })
            return interaction.reply({ content: `ƒo. +${amount} XP para <@${user.id}>. Nivel: ${res.user.level} XP: ${res.user.xp}/${res.needed}`, ephemeral: true })
          }
        },
        {
          name: 'remove',
          description: 'Quita XP',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('XP').setRequired(true).setMinValue(1).setMaxValue(1_000_000)) }],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LEVELS_XP] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user', true)
            const amount = interaction.options.getInteger('amount', true)
            const res = await addXp({ client, userID: user.id, amount: -amount })
            return interaction.reply({ content: `ƒo. -${amount} XP para <@${user.id}>. Nivel: ${res.user.level} XP: ${res.user.xp}/${res.needed}`, ephemeral: true })
          }
        },
        {
          name: 'set',
          description: 'Set XP (no baja nivel)',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('XP').setRequired(true).setMinValue(0).setMaxValue(1_000_000)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LEVELS_XP] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user', true)
            const amount = interaction.options.getInteger('amount', true)
            const doc = await client.db.getUserData(user.id)
            doc.xp = amount
            await doc.save()
            return interaction.reply({ content: `ƒo. XP seteado para <@${user.id}>: ${doc.xp}`, ephemeral: true })
          }
        },
        {
          name: 'reset',
          description: 'Reset XP/Level (usuario)',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LEVELS_XP] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user', true)
            const doc = await client.db.getUserData(user.id)
            doc.level = 1
            doc.xp = 0
            await doc.save()
            return interaction.reply({ content: `ƒo. Reset de <@${user.id}> completado.`, ephemeral: true })
          }
        },
        {
          name: 'resetall',
          description: 'Reset global (solo OWNER)',
          auth: { role: INTERNAL_ROLES.OWNER, perms: [] },
          handler: async (client, interaction) => {
            await UserSchema.updateMany({}, { $set: { level: 1, xp: 0 } })
            return interaction.reply({ content: 'ƒo. Reset global aplicado.', ephemeral: true })
          }
        }
      ]
    }
  ],
  subcommands: [
    {
      name: 'rank',
      description: 'Tu rank (o de un usuario)',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user
        const doc = await client.db.getUserData(user.id)
        const needed = nextLevelXp(doc.level || 1)
        const embed = new EmbedBuilder()
          .setTitle(`📈 Rank • ${user.username}`)
          .setColor('Blurple')
          .addFields(
            { name: 'Nivel', value: String(doc.level || 1), inline: true },
            { name: 'XP', value: `${doc.xp || 0}/${needed}`, inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'leaderboard',
      description: 'Top niveles (global)',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('limit').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const limit = interaction.options.getInteger('limit') || 10
        const rows = await UserSchema.find({}).sort({ level: -1, xp: -1 }).limit(limit)
        if (!rows.length) return interaction.reply({ content: 'No hay datos aún.', ephemeral: true })
        const lines = rows.map((u, i) => `**${i + 1}.** <@${u.userID}> • lvl ${u.level || 1} (xp ${u.xp || 0})`)
        return interaction.reply({ content: `**Levels Leaderboard (global)**\n${lines.join('\n')}`, ephemeral: true })
      }
    }
  ]
})
