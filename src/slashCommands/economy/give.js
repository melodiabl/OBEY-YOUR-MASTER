const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/interactionKit')
const { money } = require('./_catalog')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Transfiere dinero a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario que recibirá el dinero')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a transferir')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)
    const amount = interaction.options.getInteger('cantidad', true)

    if (target.bot) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'Destino inválido',
        reason: 'No puedes transferir dinero a bots.'
      }, { ephemeral: true })
    }
    if (target.id === interaction.user.id) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'Destino inválido',
        reason: 'No puedes transferirte dinero a ti mismo.'
      }, { ephemeral: true })
    }

    const senderData = await client.db.getUserData(interaction.user.id)
    if ((senderData.money || 0) < amount) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'Fondos insuficientes',
        reason: 'No tienes suficiente dinero para transferir.',
        hint: `Efectivo: ${Format.inlineCode(money(senderData.money || 0))}`
      }, { ephemeral: true })
    }

    const receiverData = await client.db.getUserData(target.id)
    senderData.money -= amount
    receiverData.money = (receiverData.money || 0) + amount
    await senderData.save()
    await receiverData.save()

    return replyOk(client, interaction, {
      system: 'economy',
      title: `${Emojis.success} Transferencia enviada`,
      lines: [
        `${Emojis.dot} A: ${target}`,
        `${Emojis.dot} Monto: ${Emojis.money} ${Format.inlineCode(money(amount))}`,
        `${Emojis.dot} Tu efectivo: ${Format.inlineCode(money(senderData.money || 0))}`
      ],
      signature: 'Transacción segura'
    }, { ephemeral: true })
  }
}

