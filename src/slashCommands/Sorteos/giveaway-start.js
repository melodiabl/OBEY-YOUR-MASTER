const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const ms = require('ms')
const { replyError, replyOk } = require('../../core/ui/interactionKit')
const { startGiveaway } = require('../../systems').giveaways
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('giveaway-start')
    .setDescription('Inicia un sorteo en el servidor')
    .addStringOption(option => option.setName('duracion').setDescription('Duración del sorteo (ej: 1h, 1d)').setRequired(true))
    .addIntegerOption(option => option.setName('ganadores').setDescription('Número de ganadores').setRequired(true))
    .addStringOption(option => option.setName('premio').setDescription('El premio del sorteo').setRequired(true))
    .addChannelOption(option => option.setName('canal').setDescription('Canal donde se realizará el sorteo').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute (client, interaction) {
    const duration = interaction.options.getString('duracion')
    const winnerCount = interaction.options.getInteger('ganadores')
    const prize = interaction.options.getString('premio')
    const channel = interaction.options.getChannel('canal') || interaction.channel

    const msDuration = ms(duration)
    if (!msDuration || msDuration < 10_000) {
      return replyError(client, interaction, {
        system: 'events',
        reason: 'Duración inválida.',
        hint: 'Ejemplos: 10m, 1h, 1d.'
      }, { ephemeral: true })
    }

    if (!channel?.isTextBased?.()) {
      return replyError(client, interaction, {
        system: 'events',
        reason: 'Canal inválido.',
        hint: 'Selecciona un canal de texto.'
      }, { ephemeral: true })
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(client.user.id)
    const perms = channel.permissionsFor?.(me)
    if (!perms?.has(PermissionFlagsBits.SendMessages) || !perms?.has(PermissionFlagsBits.EmbedLinks)) {
      return replyError(client, interaction, {
        system: 'events',
        reason: 'No tengo permisos para publicar el sorteo en ese canal.',
        hint: 'Necesito `SendMessages` y `EmbedLinks`.'
      }, { ephemeral: true })
    }

    try {
      const { doc, message } = await startGiveaway({
        client,
        guildID: interaction.guild.id,
        channel,
        createdBy: interaction.user.id,
        prize,
        winnerCount,
        msDuration
      })

      return replyOk(client, interaction, {
        system: 'events',
        title: 'Sorteo iniciado',
        lines: [
          `Canal: ${channel}`,
          `Premio: **${prize}**`,
          `Ganadores: ${Format.inlineCode(winnerCount)}`,
          `Finaliza: <t:${Math.floor(new Date(doc.endsAt).getTime() / 1000)}:R>`,
          message?.url ? `Link: ${message.url}` : null
        ].filter(Boolean),
        signature: 'Se cierra automaticamente'
      }, { ephemeral: true })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'events',
        reason: 'No pude iniciar el sorteo.',
        hint: e?.message ? `Detalle: ${e.message}` : undefined
      }, { ephemeral: true })
    }
  }
}
