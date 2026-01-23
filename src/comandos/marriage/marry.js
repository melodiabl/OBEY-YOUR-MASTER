const marriageManager = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError, replyWarn } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Propone matrimonio a otro usuario',
  async execute (client, message, args, prefix) {
    const p = String(prefix || '!').trim() || '!'
    const target = message.mentions.users.first()

    if (!target) {
      return replyError(client, message, {
        system: 'fun',
        title: 'Falta mencionar a alguien',
        reason: 'Debes mencionar a una persona para proponer.',
        hint: `Ejemplo: ${Format.inlineCode(`${p}marry @usuario`)}`
      })
    }
    if (target.bot) {
      return replyError(client, message, {
        system: 'fun',
        title: 'Destino inválido',
        reason: 'No puedes casarte con bots.'
      })
    }
    if (target.id === message.author.id) {
      return replyError(client, message, {
        system: 'fun',
        title: 'No tan rápido',
        reason: 'No puedes casarte contigo mismo.'
      })
    }

    const proposerData = await client.db.getUserData(message.author.id)
    const targetData = await client.db.getUserData(target.id)

    if (proposerData.partner) {
      return replyWarn(client, message, {
        system: 'fun',
        title: 'Ya estás casado',
        lines: [`${Emojis.dot} Pareja: <@${proposerData.partner}>`]
      })
    }
    if (targetData.partner) {
      return replyWarn(client, message, {
        system: 'fun',
        title: 'No disponible',
        lines: [`${Emojis.dot} ${target} ya está casado.`]
      })
    }
    if (marriageManager.hasPending(target.id)) {
      return replyWarn(client, message, {
        system: 'fun',
        title: 'Propuesta pendiente',
        lines: [`${Emojis.dot} ${target} ya tiene una propuesta activa.`]
      })
    }

    marriageManager.propose(message.author.id, target.id)

    return replyEmbed(client, message, {
      system: 'fun',
      kind: 'info',
      title: `${Emojis.reputation} Propuesta de matrimonio`,
      description: [
        headerLine(Emojis.star, '¿Aceptas?'),
        `${Emojis.dot} ${target}, ${Format.bold('¿aceptas casarte con')} ${message.author}?`,
        Format.softDivider(20),
        `${Emojis.confirm} Aceptar: ${Format.inlineCode(`${p}accept`)}`,
        `${Emojis.cancel} Rechazar: ${Format.inlineCode(`${p}reject`)}`,
        '',
        `${Emojis.quote} ${Format.italic('Consejo: responde rápido; las propuestas pendientes pueden ser reemplazadas.')}`
      ].join('\n'),
      signature: '𓆩♡𓆪 Romance system 𓆩♡𓆪'
    })
  }
}

