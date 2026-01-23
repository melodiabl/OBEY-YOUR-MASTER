const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  DESCRIPTION: 'Muestra el perfil económico (premium).',
  ALIASES: ['perfil'],
  async execute (client, message) {
    const user = message.mentions.users.first() || message.author
    const userData = await client.db.getUserData(user.id)
    const inv = Array.isArray(userData.inventory) ? userData.inventory : []
    const now = Date.now()

    const toRel = (ms) => `<t:${Math.floor(ms / 1000)}:R>`
    const readyOr = (until) => (until && until > now) ? toRel(until) : `${Emojis.success} Listo`
    const yesNo = (v) => (v ? `${Emojis.success} Sí` : `${Emojis.error} No`)

    const wallet = Number(userData.money || 0)
    const bank = Number(userData.bank || 0)
    const total = wallet + bank
    const walletPct = total > 0 ? Format.progressBar(wallet, total, 15) : Format.progressBar(0, 1, 15)

    const level = Number(userData.level || 1)
    const xp = Number(userData.xp || 0)
    const nextLevelXP = level * level * 100
    const xpBar = Format.progressBar(Math.min(xp, nextLevelXP), nextLevelXP || 1, 15)
    const rep = Number(userData.reputation || 0)

    const stream = userData.ecoStream || {}
    const streamActive = Boolean(stream.active)
    const streamStarted = stream.startedAt ? toRel(stream.startedAt) : Format.inlineCode('n/a')
    const streamLastCollect = stream.lastCollectAt ? toRel(stream.lastCollectAt) : Format.inlineCode('n/a')
    const streamTotal = Number(stream.totalEarned || 0)

    const robProtection = (userData.robProtectionUntil && userData.robProtectionUntil > now) ? toRel(userData.robProtectionUntil) : Format.inlineCode('OFF')
    const insurance = (userData.insuranceUntil && userData.insuranceUntil > now) ? toRel(userData.insuranceUntil) : Format.inlineCode('OFF')

    return replyEmbed(client, message, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.economy} Perfil`,
      description: [
        headerLine(Emojis.economy, user.tag),
        `${Emojis.quote} ${Format.italic('Tu estado económico, progreso y próximos movimientos en un solo lugar.')}`
      ].join('\n'),
      fields: [
        {
          name: `${Emojis.money} Finanzas`,
          value: [
            `${Emojis.dot} Efectivo: ${Format.inlineCode(money(wallet))}`,
            `${Emojis.dot} Banco: ${Format.inlineCode(money(bank))}`,
            `${Emojis.dot} Total: ${Format.bold(money(total))}`,
            `${Emojis.dot} Distribución: ${walletPct}`
          ].join('\n'),
          inline: false
        },
        {
          name: `${Emojis.level} Progreso`,
          value: [
            `${Emojis.dot} Nivel: ${Format.inlineCode(level)}`,
            `${Emojis.dot} XP: ${Format.inlineCode(`${xp} / ${nextLevelXP}`)}`,
            `${Emojis.dot} Barra: ${xpBar}`,
            `${Emojis.dot} Reputación: ${Format.inlineCode(rep)}`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.giveaway} Recompensas`,
          value: [
            `${Emojis.dot} Daily: ${readyOr(userData.dailyCooldown)} (${Format.inlineCode('/daily')} / ${Format.inlineCode('!daily')})`,
            `${Emojis.dot} Work: ${readyOr(userData.workCooldown)} (${Format.inlineCode('/work')} / ${Format.inlineCode('!work')})`,
            `${Emojis.dot} Weekly: ${readyOr(userData.weeklyCooldown)} (${Format.inlineCode('/weekly')})`,
            `${Emojis.dot} Monthly: ${readyOr(userData.monthlyCooldown)} (${Format.inlineCode('/monthly')})`,
            `${Emojis.dot} Streak: ${Format.inlineCode(userData.dailyStreak || 0)}`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.security} Seguridad`,
          value: [
            `${Emojis.dot} Protección robo: ${robProtection}`,
            `${Emojis.dot} Seguro: ${insurance}`,
            `${Emojis.dot} Tip: ${Format.inlineCode('/protect-buy')}`
          ].join('\n'),
          inline: false
        },
        {
          name: `${Emojis.work} Stream`,
          value: [
            `${Emojis.dot} Activo: ${yesNo(streamActive)}`,
            `${Emojis.dot} Inició: ${streamStarted}`,
            `${Emojis.dot} Último cobro: ${streamLastCollect}`,
            `${Emojis.dot} Total: ${Format.inlineCode(money(streamTotal))}`,
            `${Emojis.dot} Acciones: ${Format.inlineCode('/stream collect')} ${Emojis.dot} ${Format.inlineCode('/stream stop')}`
          ].join('\n'),
          inline: false
        },
        {
          name: `${Emojis.human} Social`,
          value: [
            `${Emojis.dot} Usuario: ${user}`,
            `${Emojis.dot} Pareja: ${userData.partner ? `<@${userData.partner}>` : Format.italic('Ninguna')}`,
            `${Emojis.dot} Inventario: ${Format.inlineCode(inv.length)}`,
            `${Emojis.dot} Mascota: ${userData.pet?.name ? Format.inlineCode(userData.pet.name) : Format.italic('Sin mascota')}`
          ].join('\n'),
          inline: false
        }
      ],
      thumbnail: user.displayAvatarURL({ size: 256 }),
      signature: 'Progreso real (premium)'
    })
  }
}
