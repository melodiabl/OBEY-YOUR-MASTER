const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/interactionKit')
const { money } = require('./_catalog')

const COST = 100
const rewards = [
  { name: '🍞 Pan', weight: 50 },
  { name: '🪓 Hacha', weight: 20 },
  { name: '🎣 Caña', weight: 15 },
  { name: '🧪 Elixir', weight: 10 },
  { name: '🛡️ Escudo', weight: 5 }
]

function getRandomReward () {
  const total = rewards.reduce((acc, item) => acc + item.weight, 0)
  let rand = Math.random() * total
  for (const item of rewards) {
    if (rand < item.weight) return item.name
    rand -= item.weight
  }
  return rewards[0].name
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('gacha')
    .setDescription(`Gacha: paga ${COST} monedas y recibe un ítem aleatorio`),

  async execute (client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id)
    if ((userData.money || 0) < COST) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'Fondos insuficientes',
        reason: `Necesitas ${COST} monedas para usar el gacha.`,
        hint: `Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      }, { ephemeral: true })
    }

    userData.money -= COST
    if (!Array.isArray(userData.inventory)) userData.inventory = []
    const reward = getRandomReward()
    userData.inventory.push(reward)
    await userData.save()

    return replyOk(client, interaction, {
      system: 'economy',
      title: `${Emojis.gacha} Gacha`,
      lines: [
        `${Emojis.dot} Resultado: ${Format.bold(reward)}`,
        `${Emojis.dot} Costo: ${Emojis.money} ${Format.inlineCode(money(COST))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Drop conseguido'
    }, { ephemeral: true })
  }
}

