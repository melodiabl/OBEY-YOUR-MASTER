const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Borra mensajes del canal actual (max 100).',
  ALIASES: ['clear'],
  PERMISSIONS: ['ManageMessages'],
  async execute (client, message, args) {
    const amount = Number(args?.[0])
    if (!Number.isFinite(amount) || amount < 1 || amount > 100) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Cantidad inválida',
        reason: 'Usa un número entre 1 y 100.',
        hint: `Ej: ${Format.inlineCode('purge 25')}`
      })
    }

    if (!message.channel?.bulkDelete) {
      return replyWarn(client, message, {
        system: 'moderation',
        title: 'Canal no compatible',
        lines: ['Este canal no soporta purge.']
      })
    }

    try {
      const deleted = await message.channel.bulkDelete(amount, true)
      return replyOk(client, message, {
        system: 'moderation',
        title: 'Purge completado',
        lines: [
          `${Emojis.dot} Mensajes borrados: ${Format.bold(deleted.size)}`
        ],
        signature: 'Discord no borra mensajes muy antiguos'
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No pude borrar',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}
