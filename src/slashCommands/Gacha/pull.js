const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed, replyError } = require('../../core/ui/interactionKit')

const ITEMS = [
  { name: '🌟 Legendario: Dragón Dorado', chance: 0.05, kind: 'success' },
  { name: '💎 Épico: Espada de Diamante', chance: 0.15, kind: 'info' },
  { name: '⚔️ Raro: Escudo de Hierro', chance: 0.3, kind: 'info' },
  { name: '🪵 Común: Palo de Madera', chance: 0.5, kind: 'neutral' }
]

function pickItem () {
  const rand = Math.random()
  let cumulative = 0
  for (const item of ITEMS) {
    cumulative += item.chance
    if (rand < cumulative) return item
  }
  return ITEMS[ITEMS.length - 1]
}

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Realiza una tirada de Gacha (cuesta 500 monedas)'),

  async execute (client, interaction) {
    const cost = 500
    const userData = await client.db.getUserData(interaction.user.id)

    if (!userData || (userData.money || 0) < cost) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'Monedas insuficientes',
        reason: `Una tirada cuesta ${cost} monedas.`,
        hint: `Efectivo: ${Format.inlineCode(money(userData?.money || 0))}`
      }, { ephemeral: true })
    }

    userData.money -= cost

    const won = pickItem()
    if (!Array.isArray(userData.inventory)) userData.inventory = []
    userData.inventory.push({ name: won.name, date: new Date() })
    await userData.save()

    return replyEmbed(client, interaction, {
      system: 'economy',
      kind: won.kind,
      title: `${Emojis.gacha} Resultado del Gacha`,
      description: [
        headerLine(Emojis.gacha, 'Drop'),
        `${Emojis.dot} Costo: ${Emojis.money} ${Format.inlineCode(money(cost))}`,
        `${Emojis.dot} Obtuviste: ${Format.bold(won.name)}`,
        `${Emojis.dot} Saldo: ${Format.inlineCode(money(userData.money || 0))}`
      ].join('\n'),
      signature: 'Sigue tirando'
    }, { ephemeral: true })
  }
}

