const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')
const { cleanId } = require('../../core/commands/legacyArgs')

function ts (d) {
  try {
    return `<t:${Math.floor(new Date(d).getTime() / 1000)}:R>`
  } catch (e) {
    return Format.inlineCode('n/a')
  }
}

module.exports = {
  DESCRIPTION: 'Muestra info de un rol.',
  ALIASES: ['ri', 'role'],
  async execute (client, message, args) {
    const token = String(args?.[0] || '').trim()
    const id = cleanId(token)
    const mentioned = message.mentions.roles.first()
    const role = mentioned || (id ? message.guild.roles.cache.get(id) : null)

    if (!role) {
      return replyError(client, message, {
        system: 'info',
        title: 'Rol inválido',
        reason: 'Menciona un rol o pasa un ID.',
        hint: `Ej: ${Format.inlineCode('roleinfo @Moderador')}`
      })
    }

    const fields = [
      { name: `${Emojis.id} ID`, value: Format.inlineCode(role.id), inline: true },
      { name: `${Emojis.stats} Miembros`, value: Format.inlineCode(role.members.size), inline: true },
      { name: `${Emojis.calendar} Creado`, value: ts(role.createdAt), inline: true },
      { name: `${Emojis.theme} Color`, value: Format.inlineCode(role.hexColor || 'n/a'), inline: true },
      { name: `${Emojis.role} Posición`, value: Format.inlineCode(role.position), inline: true },
      { name: `${Emojis.lock} Mencionable`, value: role.mentionable ? 'Sí' : 'No', inline: true }
    ]

    return replyEmbed(client, message, {
      system: 'info',
      kind: 'info',
      title: `${Emojis.role} Role Info`,
      description: [
        headerLine(Emojis.role, role.name),
        `${Emojis.dot} Rol: ${role}`
      ].join('\n'),
      fields,
      signature: 'Jerarquía y permisos'
    })
  }
}
