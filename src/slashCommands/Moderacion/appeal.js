const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyInfo, replyOk, replyWarn } = require('../../core/ui/interactionKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = createSystemSlashCommand({
  name: 'appeal',
  description: 'Apelaciones de moderación (usuarios + staff)',
  moduleKey: 'moderation',
  subcommands: [
    {
      name: 'create',
      description: 'Crea una apelación (1 abierta por usuario)',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      options: [
        {
          apply: (sub) => sub.addStringOption(o => o.setName('tipo').setDescription('Tipo').setRequired(true).addChoices(
            { name: 'warn', value: 'warn' },
            { name: 'timeout', value: 'timeout' },
            { name: 'kick', value: 'kick' },
            { name: 'ban', value: 'ban' },
            { name: 'other', value: 'other' }
          ))
        },
        {
          apply: (sub) => sub.addStringOption(o => o.setName('razon').setDescription('Explica tu caso (max 800)').setRequired(true).setMaxLength(800))
        }
      ],
      handler: async (client, interaction) => {
        const type = interaction.options.getString('tipo', true)
        const reason = interaction.options.getString('razon', true)
        const appeal = await Systems.moderation.createAppeal({
          client,
          guild: interaction.guild,
          userID: interaction.user.id,
          createdBy: interaction.user.id,
          type,
          reason
        })

        return replyOk(client, interaction, {
          system: 'moderation',
          title: `Apelación creada #${appeal.appealNumber}`,
          lines: [
            `${Emojis.dot} Estado: ${Format.inlineCode(appeal.status)}`,
            `${Emojis.dot} Tipo: ${Format.inlineCode(type)}`,
            `${Emojis.dot} Seguimiento: un staff responderá por los canales del servidor`,
            `${Emojis.dot} Tip: si agregas detalles, crea otra nota desde tu ticket de soporte`
          ],
          signature: 'Soporte y transparencia'
        }, { ephemeral: true })
      }
    },
    {
      name: 'list',
      description: 'Lista apelaciones abiertas',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.MOD_MANAGE] },
      options: [
        { apply: (sub) => sub.addIntegerOption(o => o.setName('limite').setDescription('1-20').setRequired(false).setMinValue(1).setMaxValue(20)) }
      ],
      handler: async (client, interaction) => {
        const limit = interaction.options.getInteger('limite') || 10
        const rows = await Systems.moderation.listAppeals({ guildID: interaction.guild.id, status: 'OPEN', limit })
        if (!rows.length) {
          return replyWarn(client, interaction, { system: 'moderation', title: 'Sin apelaciones', lines: ['No hay apelaciones abiertas.'] }, { ephemeral: true })
        }

        const lines = rows.map(a => {
          const ts = `<t:${Math.floor(new Date(a.createdAt).getTime() / 1000)}:R>`
          return `${Emojis.dot} #${Format.inlineCode(String(a.appealNumber))} ${Format.inlineCode(a.type)} ${ts} â€” <@${a.userID}>`
        })

        return replyEmbed(client, interaction, {
          system: 'moderation',
          kind: 'info',
          title: `${Emojis.ticket} Apelaciones`,
          description: [headerLine(Emojis.moderation, 'Abiertas'), lines.join('\n')].join('\n'),
          signature: `Acción: ${Format.inlineCode('/appeal accept')} / ${Format.inlineCode('/appeal reject')}`
        }, { ephemeral: true })
      }
    },
    {
      name: 'accept',
      description: 'Acepta una apelación (opcional: quitar timeout)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.MOD_MANAGE] },
      options: [
        { apply: (sub) => sub.addIntegerOption(o => o.setName('numero').setDescription('Número de apelación').setRequired(true).setMinValue(1)) },
        { apply: (sub) => sub.addBooleanOption(o => o.setName('quitar_timeout').setDescription('Intenta remover timeout').setRequired(false)) },
        { apply: (sub) => sub.addStringOption(o => o.setName('nota').setDescription('Nota interna (opcional)').setRequired(false).setMaxLength(400)) }
      ],
      handler: async (client, interaction) => {
        const number = interaction.options.getInteger('numero', true)
        const untimeout = interaction.options.getBoolean('quitar_timeout') || false
        const note = interaction.options.getString('nota')

        const appeal = await Systems.moderation.setAppealStatus({
          guildID: interaction.guild.id,
          appealNumber: number,
          status: 'ACCEPTED',
          reviewerID: interaction.user.id,
          note
        })

        let untimeoutRes = null
        if (untimeout) {
          const member = await interaction.guild.members.fetch(appeal.userID).catch(() => null)
          if (member?.moderatable) {
            await member.timeout(null, `Apelación aceptada #${number}`).catch(() => {})
            untimeoutRes = `${Emojis.success} timeout removido`
          } else {
            untimeoutRes = `${Emojis.warn} no pude remover timeout`
          }
        }

        // Caso de moderación para trazabilidad
        try {
          await Systems.moderation.logAction({
            guildID: interaction.guild.id,
            type: 'appeal_accept',
            targetID: appeal.userID,
            moderatorID: interaction.user.id,
            reason: note || `Apelación #${number} aceptada`,
            meta: { appealNumber: number, untimeout: Boolean(untimeout) }
          })
        } catch (e) {}

        return replyOk(client, interaction, {
          system: 'moderation',
          title: `Apelación aceptada #${number}`,
          lines: [
            `${Emojis.dot} Usuario: <@${appeal.userID}>`,
            `${Emojis.dot} Estado: ${Format.inlineCode(appeal.status)}`,
            untimeoutRes ? `${Emojis.dot} Acción: ${untimeoutRes}` : null
          ].filter(Boolean)
        }, { ephemeral: true })
      }
    },
    {
      name: 'reject',
      description: 'Rechaza una apelación',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.MOD_MANAGE] },
      options: [
        { apply: (sub) => sub.addIntegerOption(o => o.setName('numero').setDescription('Número de apelación').setRequired(true).setMinValue(1)) },
        { apply: (sub) => sub.addStringOption(o => o.setName('nota').setDescription('Motivo/nota (opcional)').setRequired(false).setMaxLength(400)) }
      ],
      handler: async (client, interaction) => {
        const number = interaction.options.getInteger('numero', true)
        const note = interaction.options.getString('nota')
        const appeal = await Systems.moderation.setAppealStatus({
          guildID: interaction.guild.id,
          appealNumber: number,
          status: 'REJECTED',
          reviewerID: interaction.user.id,
          note
        })

        try {
          await Systems.moderation.logAction({
            guildID: interaction.guild.id,
            type: 'appeal_reject',
            targetID: appeal.userID,
            moderatorID: interaction.user.id,
            reason: note || `Apelación #${number} rechazada`,
            meta: { appealNumber: number }
          })
        } catch (e) {}

        return replyOk(client, interaction, {
          system: 'moderation',
          title: `Apelación rechazada #${number}`,
          lines: [
            `${Emojis.dot} Usuario: <@${appeal.userID}>`,
            `${Emojis.dot} Estado: ${Format.inlineCode(appeal.status)}`,
            note ? `${Emojis.dot} Nota: ${Format.inlineCode(note)}` : null
          ].filter(Boolean)
        }, { ephemeral: true })
      }
    },
    {
      name: 'config',
      description: 'Configura canal/rol para alertas de apelaciones',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.MOD_MANAGE] },
      options: [
        { apply: (sub) => sub.addChannelOption(o => o.setName('canal').setDescription('Canal destino (opcional)').setRequired(false)) },
        { apply: (sub) => sub.addRoleOption(o => o.setName('rol').setDescription('Rol soporte (opcional)').setRequired(false)) }
      ],
      handler: async (client, interaction) => {
        const channel = interaction.options.getChannel('canal')
        const role = interaction.options.getRole('rol')
        const gd = await client.db.getGuildData(interaction.guild.id)

        if (channel) gd.appealsChannel = channel.id
        if (role) gd.appealsSupportRole = role.id
        await gd.save()

        return replyInfo(client, interaction, {
          system: 'moderation',
          title: 'Apelaciones configuradas',
          lines: [
            `${Emojis.dot} Canal: ${gd.appealsChannel ? `<#${gd.appealsChannel}>` : Format.italic('sin canal')}`,
            `${Emojis.dot} Rol: ${gd.appealsSupportRole ? `<@&${gd.appealsSupportRole}>` : Format.italic('sin rol')}`,
            `${Emojis.dot} Tip: si canal no existe, se usarán logs`
          ]
        }, { ephemeral: true })
      }
    }
  ]
})
