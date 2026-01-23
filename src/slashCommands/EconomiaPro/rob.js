const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyWarn, replyError } = require('../../core/ui/interactionKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Intenta robarle dinero a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario al que quieres robar')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)

    if (target.id === interaction.user.id) {
      return replyError(client, interaction, { system: 'games', title: 'Acción inválida', reason: 'No puedes robarte a ti mismo.' }, { ephemeral: true })
    }
    if (target.bot) {
      return replyError(client, interaction, { system: 'games', title: 'Acción inválida', reason: 'No puedes robarle a un bot.' }, { ephemeral: true })
    }

    const userData = await client.db.getUserData(interaction.user.id)
    const targetData = await client.db.getUserData(target.id)

    if (!userData || (userData.money || 0) < 100) {
      return replyError(client, interaction, { system: 'games', title: 'Fondos insuficientes', reason: 'Necesitas al menos 100 monedas para intentar un robo.' }, { ephemeral: true })
    }
    if (!targetData || (targetData.money || 0) < 100) {
      return replyWarn(client, interaction, {
        system: 'games',
        title: 'Objetivo pobre',
        lines: [`${Emojis.dot} El usuario no tiene suficiente dinero para que valga la pena el robo.`]
      }, { ephemeral: true })
    }

    const success = Math.random() > 0.7
    if (success) {
      const max = Math.floor((targetData.money || 0) * 0.3)
      const stolenAmount = Math.max(50, Math.floor(Math.random() * Math.max(1, max)) + 1)
      userData.money += stolenAmount
      targetData.money -= stolenAmount
      await userData.save()
      await targetData.save()

      return replyOk(client, interaction, {
        system: 'games',
        title: `${Emojis.rob} Robo exitoso`,
        lines: [
          `${Emojis.dot} Objetivo: ${target}`,
          `${Emojis.dot} Robaste: ${Emojis.money} ${Format.inlineCode(money(stolenAmount))}`,
          `${Emojis.dot} Tu saldo: ${Format.inlineCode(money(userData.money || 0))}`
        ],
        signature: 'Modo sigilo'
      }, { ephemeral: true })
    }

    const fine = 100
    userData.money = Math.max(0, (userData.money || 0) - fine)
    await userData.save()

    return replyWarn(client, interaction, {
      system: 'games',
      title: 'Te atraparon',
      lines: [
        `${Emojis.dot} Multa: ${Emojis.money} ${Format.inlineCode(money(fine))}`,
        `${Emojis.dot} Tu saldo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Más cuidado'
    }, { ephemeral: true })
  }
}

