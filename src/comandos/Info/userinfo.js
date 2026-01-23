const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')
const { resolveMemberFromArgs } = require('../../core/commands/legacyArgs')

function safeTs (d) {
  try {
    return `<t:${Math.floor(new Date(d).getTime() / 1000)}:R>`
  } catch (e) {
    return Format.inlineCode('n/a')
  }
}

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  DESCRIPTION: 'Muestra información detallada de un usuario.',
  ALIASES: ['ui', 'user', 'whois'],
  async execute (client, message, args) {
    const res = await resolveMemberFromArgs({ message, args, index: 0 })
    const user = res.user || message.author
    const member = res.member || message.member

    if (!user) {
      return replyError(client, message, {
        system: 'info',
        title: 'Usuario inválido',
        reason: 'No pude resolver ese usuario.',
        hint: `Ej: ${Format.inlineCode('userinfo @usuario')}`
      })
    }

    const userData = await client.db.getUserData(user.id).catch(() => null)
    const wallet = Number(userData?.money || 0)
    const bank = Number(userData?.bank || 0)
    const level = Number(userData?.level || 0)
    const xp = Number(userData?.xp || 0)
    const nextLevelXP = level > 0 ? level * level * 100 : 100

    const rolePreview = member?.roles?.cache
      ? member.roles.cache
        .filter(r => r.id !== message.guild.roles.everyone.id)
        .sort((a, b) => b.position - a.position)
        .first(10)
        .map(r => r.toString())
      : []

    const fields = [
      {
        name: `${Emojis.info} Cuenta`,
        value: [
          `${Emojis.id} ID: ${Format.inlineCode(user.id)}`,
          `${Emojis.calendar} Creada: ${safeTs(user.createdAt)}`
        ].join('\n'),
        inline: true
      },
      {
        name: `${Emojis.member} Servidor`,
        value: member
          ? [
            `${Emojis.calendar} Entró: ${safeTs(member.joinedAt)}`,
            `${Emojis.stats} Roles: ${Format.inlineCode(member.roles.cache.size - 1)}`
            ].join('\n')
          : Format.italic('No está en el servidor.'),
        inline: true
      },
      {
        name: `${Emojis.economy} Perfil`,
        value: [
          `${Emojis.money} Efectivo: ${Format.inlineCode(money(wallet))}`,
          `${Emojis.bank} Banco: ${Format.inlineCode(money(bank))}`,
          `${Emojis.level} Nivel: ${Format.inlineCode(level)}`,
          `${Emojis.stats} XP: ${Format.inlineCode(`${xp} / ${nextLevelXP}`)}`
        ].join('\n'),
        inline: false
      }
    ]

    if (rolePreview.length) {
      fields.push({
        name: `${Emojis.role} Top roles`,
        value: rolePreview.join(' '),
        inline: false
      })
    }

    return replyEmbed(client, message, {
      system: 'info',
      kind: 'info',
      title: `${Emojis.member} User Info`,
      description: [headerLine(Emojis.info, user.tag || user.username), `${Emojis.dot} ${user}`].join('\n'),
      fields,
      thumbnail: user.displayAvatarURL({ size: 256 }),
      signature: 'Perfil sincronizado'
    })
  }
}
