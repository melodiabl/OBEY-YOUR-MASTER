const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const ms = require('ms')

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
    if (!msDuration) return interaction.reply({ content: '❌ Duración inválida.', ephemeral: true })

    // Nota: Aquí se asume que client.giveawaysManager está configurado en index.js
    // Si no lo está, usaremos una implementación manual simple con embeds y reacciones/botones

    const endTimestamp = Date.now() + msDuration

    const embed = new EmbedBuilder()
      .setTitle('🎉 ¡NUEVO SORTEO! 🎉')
      .setDescription(`¡Participa para ganar **${prize}**!\n\n**Finaliza:** <t:${Math.floor(endTimestamp / 1000)}:R>\n**Anfitrión:** ${interaction.user}\n**Ganadores:** ${winnerCount}`)
      .setColor('LuminousVividPink')
      .setFooter({ text: 'Reacciona con 🎉 para participar' })
      .setTimestamp()

    const message = await channel.send({ embeds: [embed] })
    await message.react('🎉')

    await interaction.reply({ content: `✅ Sorteo iniciado en ${channel}`, ephemeral: true })

    // Lógica simple de finalización (para una implementación real se recomienda discord-giveaways)
    setTimeout(async () => {
      const updatedMessage = await channel.messages.fetch(message.id)
      const reaction = updatedMessage.reactions.cache.get('🎉')
      const users = await reaction.users.fetch()
      const participants = users.filter(u => !u.bot).map(u => u)

      if (participants.length === 0) {
        return channel.send(`😔 No hubo suficientes participantes para el sorteo de **${prize}**.`)
      }

      const winners = []
      for (let i = 0; i < Math.min(winnerCount, participants.length); i++) {
        const winner = participants[Math.floor(Math.random() * participants.length)]
        if (!winners.includes(winner)) winners.push(winner)
      }

      channel.send(`🎊 ¡Felicidades ${winners.join(', ')}! Han ganado **${prize}**.\nEnlace al sorteo: ${message.url}`)

      const endEmbed = EmbedBuilder.from(embed)
        .setTitle('🎊 SORTEO FINALIZADO 🎊')
        .setDescription(`**Premio:** ${prize}\n**Ganadores:** ${winners.join(', ')}\n**Anfitrión:** ${interaction.user}`)
        .setFooter({ text: 'Sorteo terminado' })

      await message.edit({ embeds: [endEmbed] })
    }, msDuration)
  }
}
