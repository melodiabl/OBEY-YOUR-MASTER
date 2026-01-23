const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')
const { getGuildUiConfig, warnEmbed, headerLine } = require('../../core/ui/uiKit')
const { resolveMemberFromArgs, parseReason } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Advierte a un usuario (crea caso y aplica política).',
  ALIASES: ['w'],
  PERMISSIONS: ['ModerateMembers'],
  async execute (client, message, args) {
    const resolved = await resolveMemberFromArgs({ message, args, index: 0 })
    const user = resolved.user
    if (!user) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Falta el usuario',
        reason: 'Menciona un usuario o pasa un ID.',
        hint: `Ej: ${Format.inlineCode('warn @user spameo')}`
      })
    }
    if (user.bot) {
      return replyWarn(client, message, {
        system: 'moderation',
        title: 'Acción inválida',
        lines: ['No puedes advertir a un bot.']
      })
    }

    const reason = parseReason(args, 1, 'Sin razón.')

    try {
      const res = await Systems.moderation.warnUser({
        guildID: message.guild.id,
        targetID: user.id,
        moderatorID: message.author.id,
        reason
      })

      await replyOk(client, message, {
        system: 'moderation',
        title: 'Warn aplicado',
        lines: [
          `${Emojis.dot} Usuario: **${user.tag}** (${Format.inlineCode(user.id)})`,
          `${Emojis.dot} Total warns: ${Format.inlineCode(res.warnsCount)}`,
          `${Emojis.dot} Caso: ${Format.inlineCode(`#${res.case.caseNumber}`)}`,
          `${Emojis.quote} Razón: ${Format.italic(reason)}`
        ],
        signature: 'Moderación activa'
      })

      const policy = await Systems.moderation.handleWarnThresholdKick({
        client,
        guild: message.guild,
        targetID: user.id,
        moderatorID: message.author.id,
        warnsCount: res.warnsCount,
        threshold: 3
      })

      if (policy.triggered && !policy.kicked && policy.reason) {
        await replyWarn(client, message, {
          system: 'moderation',
          title: 'Auto-kick bloqueado',
          lines: [
            'Llegó a **3** warns, pero no pude kickearlo.',
            `Detalle: ${Format.inlineCode(policy.reason)}`
          ]
        })
      }
      if (policy.kicked) {
        await replyEmbed(client, message, {
          system: 'moderation',
          kind: 'success',
          title: `${Emojis.success} Auto-kick aplicado`,
          description: [
            headerLine(Emojis.moderation, 'Política'),
            `${Emojis.dot} Usuario: **${user.tag}** (${Format.inlineCode(user.id)})`,
            `${Emojis.dot} Motivo: alcanzó **3** warns.`
          ].join('\n')
        })
      }

      try {
        const ui = await getGuildUiConfig(client, message.guild.id)
        const dm = warnEmbed({
          ui,
          system: 'moderation',
          title: 'Recibiste un warn',
          lines: [
            `Servidor: **${message.guild.name}**`,
            `${Emojis.quote} Razón: ${reason}`,
            `${Emojis.stats} Total: ${res.warnsCount}`
          ],
          signature: 'Cuida tu conducta'
        })
        await user.send({ embeds: [dm] }).catch(() => {})
      } catch (e) {}
    } catch (e) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No pude advertir',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}
