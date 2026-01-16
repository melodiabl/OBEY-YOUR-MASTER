const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')
const MemberAuthSchema = require('../../database/schemas/MemberAuthSchema')
const { resolveInternalIdentity } = require('../../core/auth/resolveInternalIdentity')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { authorizeInternal } = require('../../core/auth/authorize')

async function requireInternal ({ interaction }) {
  const identity = await resolveInternalIdentity({
    guildId: interaction.guild.id,
    userId: interaction.user.id,
    member: interaction.member
  })

  const authz = authorizeInternal({
    identity,
    requiredRole: INTERNAL_ROLES.ADMIN,
    requiredPerms: PERMS.SYNC_RUN
  })

  if (!authz.ok) {
    await interaction.reply({ content: `❌ ${authz.reason}`, ephemeral: true })
    return null
  }

  return identity
}

module.exports = {
  MODULE: 'admin',
  CMD: new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Sincroniza datos Discord ↔ DB (modo seguro)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sc =>
      sc
        .setName('run')
        .setDescription('Ejecuta una sincronización')
        .addStringOption(o =>
          o
            .setName('modo')
            .setDescription('Alcance de la sincronización')
            .setRequired(false)
            .addChoices(
              { name: 'self (solo yo)', value: 'self' },
              { name: 'guild_cached (miembros en cache)', value: 'guild_cached' }
            )
        )
    ),

  async execute (client, interaction) {
    if (!interaction.guild) return
    const identity = await requireInternal({ interaction })
    if (!identity) return

    const mode = interaction.options.getString('modo') || 'self'
    await interaction.deferReply({ ephemeral: true })

    // Asegura documento de servidor.
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
      if (!ids.length) return interaction.editReply('⚠️ No hay miembros en cache para sincronizar.')

      // Upsert masivo: crea documentos faltantes sin pisar datos.
      const ops = ids.map(id => ({
        updateOne: {
          filter: { userID: id },
          update: { $setOnInsert: { userID: id } },
          upsert: true
        }
      }))

      // Mongo limita tamaño de request: procesar en bloques.
      const chunkSize = 500
      let createdOrTouched = 0
      for (let i = 0; i < ops.length; i += chunkSize) {
        const chunk = ops.slice(i, i + chunkSize)
        const res = await UserSchema.bulkWrite(chunk, { ordered: false })
        createdOrTouched += (res.upsertedCount || 0) + (res.modifiedCount || 0)
      }

      return interaction.editReply(`✅ Sync guild_cached completado. Miembros procesados: **${ids.length}**.`)
    }

    return interaction.editReply('❌ Modo inválido.')
  }
}
