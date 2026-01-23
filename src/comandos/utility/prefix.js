const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError, replyOk } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

function normalizePrefixes ({ client, guildPrefix }) {
  const envPrefixes = String(process.env.PREFIX || '!').trim().split(/\s+/).filter(Boolean)
  const dbPrefix = String(guildPrefix || '').trim()
  const mentionPrefix = `<@!${client.user.id}> `
  const mentionPrefixAlt = `<@${client.user.id}> `
  return [...new Set([...envPrefixes, dbPrefix, mentionPrefix, mentionPrefixAlt])].filter(Boolean)
}

module.exports = {
  DESCRIPTION: 'Muestra o cambia el prefix del servidor (modo compat).',
  ALIASES: ['setprefix'],
  async execute (client, message, args, _prefix, guildData) {
    const sub = String(args?.[0] || '').trim().toLowerCase()
    const isSet = sub === 'set' || sub === 'cambiar'
    const isReset = sub === 'reset' || sub === 'default'

    if (isSet || isReset) {
      if (!message.member.permissions.has('ManageGuild') && !message.member.permissions.has('Administrator')) {
        return replyError(client, message, {
          system: 'security',
          title: 'Permisos requeridos',
          reason: 'Necesitas `ManageGuild` para cambiar el prefix.'
        })
      }

      const newPrefix = isReset
        ? String(process.env.PREFIX || '!').trim().split(/\s+/).filter(Boolean)[0] || '!'
        : String(args?.[1] || '').trim()

      if (!newPrefix) {
        return replyError(client, message, {
          system: 'config',
          title: 'Falta el prefix',
          reason: 'Debes indicar un prefix.',
          hint: `Ej: ${Format.inlineCode('prefix set !')}`
        })
      }

      if (newPrefix.length > 5) {
        return replyError(client, message, {
          system: 'config',
          title: 'Prefix demasiado largo',
          reason: 'Usa un prefix de 1 a 5 caracteres.'
        })
      }

      try {
        const gd = await client.db.getGuildData(message.guild.id)
        gd.prefix = newPrefix
        await gd.save()
      } catch (e) {
        return replyError(client, message, {
          system: 'config',
          title: 'No pude guardar el prefix',
          reason: e?.message || 'Error desconocido.'
        })
      }

      return replyOk(client, message, {
        system: 'config',
        title: 'Prefix actualizado',
        lines: [
          `${Emojis.dot} Nuevo prefix: ${Format.inlineCode(newPrefix)}`,
          `${Emojis.dot} Tip: también puedes usar mención: ${Format.inlineCode(`<@${client.user.id}>`)}`
        ]
      })
    }

    const current = String(guildData?.prefix || process.env.PREFIX || '!').trim()
    const list = normalizePrefixes({ client, guildPrefix: current })

    return replyEmbed(client, message, {
      system: 'config',
      kind: 'info',
      title: `${Emojis.system} Prefix`,
      description: [
        headerLine(Emojis.system, 'Comandos legacy'),
        `${Emojis.dot} Prefix actual: ${Format.inlineCode(current || '!')}`,
        `${Emojis.dot} Alternativas: ${list.map(p => Format.inlineCode(p)).join(' ')}`,
        Format.softDivider(20),
        `${Emojis.dot} Cambiar: ${Format.inlineCode('prefix set <nuevo>')}`,
        `${Emojis.dot} Reset: ${Format.inlineCode('prefix reset')}`
      ].join('\n'),
      signature: 'Modo compat'
    })
  }
}
