const { SlashCommandBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')
const MemberAuthSchema = require('../../database/schemas/MemberAuthSchema')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  INTERNAL_ROLE: INTERNAL_ROLES.ADMIN,
  INTERNAL_PERMS: [PERMS.SYNC_RUN],
  CMD: new SlashCommandBuilder()
    .setName('sync-run')
    .setDescription('Sincroniza datos Discord <-> DB (modo seguro)')
    .addStringOption(o =>
      o
        .setName('modo')
        .setDescription('Alcance de la sincronizacion')
        .setRequired(false)
        .addChoices(
          { name: 'self (solo yo)', value: 'self' },
          { name: 'guild_cached (miembros en cache)', value: 'guild_cached' }
        )
    ),

  async execute (client, interaction) {
    const mode = interaction.options.getString('modo') || 'self'
    await interaction.deferReply({ ephemeral: true })

    await client.db.getGuildData(interaction.guild.id)

    if (mode === 'self') {
      await client.db.getUserData(interaction.user.id)
      await MemberAuthSchema.findOneAndUpdate(
        { guildID: interaction.guild.id, userID: interaction.user.id },
        { $setOnInsert: { guildID: interaction.guild.id, userID: interaction.user.id } },
        { upsert: true }
      )
      return interaction.editReply('✅ Sync self completado (guild + user + auth).')
    }

    if (mode === 'guild_cached') {
      const ids = interaction.guild.members.cache.map(m => m.user.id)
      if (!ids.length) return interaction.editReply('❌ No hay miembros en cache para sincronizar.')

      const ops = ids.map(id => ({
        updateOne: {
          filter: { userID: id },
          update: { $setOnInsert: { userID: id } },
          upsert: true
        }
      }))

      const chunkSize = 500
      for (let i = 0; i < ops.length; i += chunkSize) {
        const chunk = ops.slice(i, i + chunkSize)
        await UserSchema.bulkWrite(chunk, { ordered: false })
      }

      return interaction.editReply(`✅ Sync guild_cached completado. Miembros procesados: **${ids.length}**.`)
    }

    return interaction.editReply('❌ Modo invalido.')
  }
}

