const TTLCache = require('../../core/cache/ttlCache')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError, replyWarn } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

const cooldown = new TTLCache({ defaultTtlMs: 10_000, maxSize: 200_000 })

module.exports = {
  DESCRIPTION: 'Pregunta a la IA (modo compat).',
  ALIASES: ['ask', 'chat'],
  async execute (client, message, args) {
    const prompt = String(args.join(' ') || '').trim()
    if (!prompt) {
      return replyEmbed(client, message, {
        system: 'ai',
        kind: 'info',
        title: `${Emojis.ai} IA`,
        description: [
          headerLine(Emojis.ai, 'Cómo usar'),
          `${Emojis.dot} Pregunta: ${Format.inlineCode('ai <tu pregunta>')}`,
          `${Emojis.dot} Config: ${Format.inlineCode('/ai setup')} (canal IA)`,
          `${Emojis.dot} Tip: si hay canal IA, responde sola ahí.`
        ].join('\n'),
        signature: 'IA integrada'
      })
    }

    const key = `${message.guild.id}:${message.author.id}`
    if (cooldown.get(key)) {
      return replyWarn(client, message, {
        system: 'ai',
        title: 'Cooldown',
        lines: ['Espera unos segundos antes de volver a preguntar.']
      })
    }
    cooldown.set(key, true)

    if (!String(process.env.OPENAI_API_KEY || '').trim()) {
      return replyError(client, message, {
        system: 'ai',
        title: 'IA no configurada',
        reason: `Falta ${Format.inlineCode('OPENAI_API_KEY')} en el host.`,
        hint: `Admin: usa ${Format.inlineCode('/ai setup')} y configura el servidor.`
      })
    }

    try {
      await message.channel.sendTyping().catch(() => {})
      const res = await Systems.ai.ask({
        prompt,
        guildName: message.guild.name,
        userTag: message.author.tag,
        userId: message.author.id
      })

      return replyEmbed(client, message, {
        system: 'ai',
        kind: 'info',
        title: `${Emojis.ai} IA`,
        description: [
          headerLine(Emojis.ai, 'Respuesta'),
          `${Emojis.quote} ${Format.italic(prompt.length > 220 ? prompt.slice(0, 219) + '…' : prompt)}`,
          Format.softDivider(20),
          res.answer || Format.italic('Sin respuesta.')
        ].join('\n'),
        footer: `Model: ${res.model}`,
        signature: 'Recuerda: la IA puede equivocarse'
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'ai',
        title: 'IA no disponible',
        reason: e?.message || 'Error desconocido.',
        hint: 'Tip: intenta con una pregunta más corta y específica.'
      })
    }
  }
}
