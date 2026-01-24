const { PermissionsBitField } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyInfo, replyOk, replyWarn } = require('../../core/ui/interactionKit')

function canManageRoles (guild) {
  const me = guild?.members?.me
  if (!me) return false
  return me.permissions.has(PermissionsBitField.Flags.ManageRoles)
}

async function applyMutedOverwrites ({ guild, mutedRoleId }) {
  const roleId = String(mutedRoleId || '')
  if (!roleId) return { ok: false, reason: 'missing_role' }

  const channels = guild.channels.cache.values()
  let updated = 0

  for (const c of channels) {
    if (!c?.permissionOverwrites?.edit) continue
    const type = c.type
    const deny = []

    // Text-like
    if (typeof c.isTextBased === 'function' && c.isTextBased()) {
      deny.push(
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.CreatePublicThreads,
        PermissionsBitField.Flags.CreatePrivateThreads,
        PermissionsBitField.Flags.SendMessagesInThreads,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks
      )
    }

    // Voice-like
    if (type === 2) { // GuildVoice
      deny.push(PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Stream)
    }

    if (!deny.length) continue
    await c.permissionOverwrites.edit(roleId, { deny }, { reason: 'Muted role overwrites' }).catch(() => {})
    updated++
  }

  return { ok: true, updated }
}

module.exports = createSystemSlashCommand({
  name: 'mute',
  description: 'Mute temporal (timeout) y permanente (rol Muted)',
  moduleKey: 'moderation',
  subcommands: [
    {
      name: 'setup',
      description: 'Configura el rol Muted y sus permisos',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.MOD_MANAGE] },
      options: [
        { apply: (sub) => sub.addRoleOption(o => o.setName('rol').setDescription('Usar un rol existente (opcional)').setRequired(false)) },
        { apply: (sub) => sub.addBooleanOption(o => o.setName('aplicar_overwrites').setDescription('Aplicar denies en todos los canales').setRequired(false)) }
      ],
      handler: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true })
        const roleOpt = interaction.options.getRole('rol')
        const applyOverwrites = interaction.options.getBoolean('aplicar_overwrites') ?? true

        if (!canManageRoles(interaction.guild)) {
          return replyWarn(client, interaction, { system: 'moderation', title: 'Faltan permisos', lines: ['Necesito `ManageRoles`.'] }, { ephemeral: true })
        }

        const gd = await client.db.getGuildData(interaction.guild.id)

        let role = roleOpt
        if (!role) {
          role = await interaction.guild.roles.create({
            name: 'Muted',
            reason: 'Setup mute permanente'
          })
        }

        gd.mutedRoleId = role.id
        await gd.save()

        let overwritesRes = null
        if (applyOverwrites) {
          const r = await applyMutedOverwrites({ guild: interaction.guild, mutedRoleId: role.id })
          overwritesRes = r.ok ? `Canales actualizados: **${r.updated}**` : 'No pude aplicar overwrites.'
        }

        return replyOk(client, interaction, {
          system: 'moderation',
          title: 'Mute permanente configurado',
          lines: [
            `${Emojis.dot} Rol: <@&${role.id}>`,
            `${Emojis.dot} Overwrites: ${applyOverwrites ? `${Emojis.success} aplicado` : `${Emojis.warn} omitido`}`,
            overwritesRes ? `${Emojis.dot} ${overwritesRes}` : null,
            `${Emojis.dot} Siguiente: ${Format.inlineCode('/mute add')}`
          ].filter(Boolean)
        }, { ephemeral: true })
      }
    },
    {
      name: 'add',
      description: 'Aplica mute permanente (rol) a un usuario',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.MOD_MANAGE] },
      options: [
        { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)) },
        { apply: (sub) => sub.addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false).setMaxLength(300)) }
      ],
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'
        const member = await interaction.guild.members.fetch(user.id).catch(() => null)
        if (!member) return replyError(client, interaction, { system: 'moderation', reason: 'No pude obtener al miembro.' }, { ephemeral: true })
        if (!canManageRoles(interaction.guild)) return replyWarn(client, interaction, { system: 'moderation', title: 'Faltan permisos', lines: ['Necesito `ManageRoles`.'] }, { ephemeral: true })

        const gd = await client.db.getGuildData(interaction.guild.id)
        if (!gd.mutedRoleId) {
          return replyWarn(client, interaction, {
            system: 'moderation',
            title: 'No configurado',
            lines: [`Configura el rol con ${Format.inlineCode('/mute setup')}.`]
          }, { ephemeral: true })
        }

        const role = interaction.guild.roles.cache.get(gd.mutedRoleId)
        if (!role) return replyError(client, interaction, { system: 'moderation', reason: 'El rol Muted configurado no existe.' }, { ephemeral: true })

        await member.roles.add(role, `Permanent mute by ${interaction.user.id}`).catch(() => {})
        const modCase = await Systems.moderation.setPermanentMute({
          guildID: interaction.guild.id,
          targetID: user.id,
          moderatorID: interaction.user.id,
          reason
        })

        return replyOk(client, interaction, {
          system: 'moderation',
          title: 'Mute permanente aplicado',
          lines: [
            `${Emojis.dot} Usuario: ${user} (${Format.inlineCode(user.id)})`,
            `${Emojis.dot} Rol: <@&${role.id}>`,
            `${Emojis.dot} Caso: ${Format.inlineCode('#' + modCase.caseNumber)}`,
            `${Emojis.quote} ${Format.italic(reason)}`
          ]
        }, { ephemeral: true })
      }
    },
    {
      name: 'remove',
      description: 'Quita mute permanente (rol) a un usuario',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.MOD_MANAGE] },
      options: [
        { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)) },
        { apply: (sub) => sub.addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false).setMaxLength(300)) }
      ],
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'
        const member = await interaction.guild.members.fetch(user.id).catch(() => null)
        if (!member) return replyError(client, interaction, { system: 'moderation', reason: 'No pude obtener al miembro.' }, { ephemeral: true })
        if (!canManageRoles(interaction.guild)) return replyWarn(client, interaction, { system: 'moderation', title: 'Faltan permisos', lines: ['Necesito `ManageRoles`.'] }, { ephemeral: true })

        const gd = await client.db.getGuildData(interaction.guild.id)
        if (!gd.mutedRoleId) return replyWarn(client, interaction, { system: 'moderation', title: 'No configurado', lines: [`Configura el rol con ${Format.inlineCode('/mute setup')}.`] }, { ephemeral: true })

        const role = interaction.guild.roles.cache.get(gd.mutedRoleId)
        if (role) await member.roles.remove(role, `Permanent unmute by ${interaction.user.id}`).catch(() => {})

        const modCase = await Systems.moderation.clearPermanentMute({
          guildID: interaction.guild.id,
          targetID: user.id,
          moderatorID: interaction.user.id,
          reason
        })

        return replyOk(client, interaction, {
          system: 'moderation',
          title: 'Mute permanente removido',
          lines: [
            `${Emojis.dot} Usuario: ${user} (${Format.inlineCode(user.id)})`,
            `${Emojis.dot} Caso: ${Format.inlineCode('#' + modCase.caseNumber)}`
          ],
          signature: reason ? `Razón: ${reason}` : undefined
        }, { ephemeral: true })
      }
    },
    {
      name: 'status',
      description: 'Muestra estado de mute permanente de un usuario',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.MOD_MANAGE] },
      options: [
        { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)) }
      ],
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        const state = await Systems.moderation.getPermanentMuteState({ guildID: interaction.guild.id, targetID: user.id })
        const muted = Boolean(state?.permMuted)
        return replyInfo(client, interaction, {
          system: 'moderation',
          title: 'Estado de mute',
          lines: [
            `${Emojis.dot} Usuario: ${user} (${Format.inlineCode(user.id)})`,
            `${Emojis.dot} Permanente: ${muted ? `${Emojis.lock} sí` : `${Emojis.unlock} no`}`,
            muted && state?.muteReason ? `${Emojis.dot} Razón: ${Format.inlineCode(String(state.muteReason))}` : null,
            muted && state?.mutedBy ? `${Emojis.dot} Por: <@${state.mutedBy}>` : null
          ].filter(Boolean)
        }, { ephemeral: true })
      }
    }
  ]
})
