const { SlashCommandBuilder } = require('discord.js')
const { creditWallet } = require('../../systems/economy/economyService')
const { ensureMap } = require('../../utils/interactionUtils')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')

function randInt (min, max) {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

module.exports = {
  MODULE: 'economy',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('Reclama tu recompensa semanal'),

  async execute (client, interaction) {
    const user = await client.db.getUserData(interaction.user.id)
    const map = ensureMap(user.ecoCooldowns)
    const last = Number(map.get('weekly') || 0)
    const cd = 7 * 24 * 60 * 60 * 1000
    const rem = cd - (Date.now() - last)
    if (rem > 0) {
      const hours = Math.ceil(rem / (60 * 60 * 1000))
      return interaction.reply({ content: `❌ Aun tienes cooldown: **${hours}h**.`, ephemeral: true })
    }

    const amount = randInt(2500, 5000)
    map.set('weekly', Date.now())
    user.ecoCooldowns = map
    user.markModified('ecoCooldowns')
    await user.save()

    await creditWallet({ client, guildID: interaction.guild.id, actorID: interaction.user.id, userID: interaction.user.id, amount, type: 'weekly', meta: {} })
    return interaction.reply({ content: `✅ Weekly reclamado: **+${amount}**.`, ephemeral: true })
  }
}

