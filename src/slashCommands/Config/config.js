const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Panel de configuración avanzada del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('logs')
        .setDescription('Configura el canal de auditoría avanzada')
        .addChannelOption(o => o.setName('canal').setDescription('Canal para registros').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('suggestions')
        .setDescription('Configura el sistema de sugerencias')
        .addChannelOption(o => o.setName('canal').setDescription('Canal para sugerencias').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('welcome')
        .setDescription('Configura el sistema de bienvenidas')
        .addChannelOption(o => o.setName('canal').setDescription('Canal para bienvenidas').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('Muestra la configuración actual del servidor')
    ),

  async execute (client, interaction) {
    const subcommand = interaction.options.getSubcommand()
    const guildId = interaction.guild.id
    
    // Obtener datos de la base de datos (usando el método disponible en el cliente o esquema)
    let guildData
    if (client.db && typeof client.db.getGuildData === 'function') {
      guildData = await client.db.getGuildData(guildId)
    } else {
      const GuildSchema = require('../../database/schemas/GuildSchema')
      guildData = await GuildSchema.findOne({ guildID: guildId })
      if (!guildData) guildData = new GuildSchema({ guildID: guildId })
    }

    if (subcommand === 'view') {
      const embed = new EmbedBuilder()
        .setTitle(Format.fancyTitle(Emojis.system, 'Configuración del Servidor'))
        .setColor('Gold')
        .setDescription(Format.toScript('Aquí puedes ver los módulos activos y sus canales configurados.'))
        .addFields(
          { name: `${Emojis.dot} Auditoría`, value: guildData.logsChannel ? `<#${guildData.logsChannel}>` : '`No configurado`', inline: true },
          { name: `${Emojis.dot} Sugerencias`, value: guildData.suggestionChannel ? `<#${guildData.suggestionChannel}>` : '`No configurado`', inline: true },
          { name: `${Emojis.dot} Bienvenidas`, value: guildData.welcomeChannel ? `<#${guildData.welcomeChannel}>` : '`No configurado`', inline: true }
        )
        .setFooter({ text: `ID del Servidor: ${guildId}` })
        .setTimestamp()

      return interaction.reply({ embeds: [embed] })
    }

    const channel = interaction.options.getChannel('canal')

    if (subcommand === 'logs') {
      guildData.logsChannel = channel.id
      await guildData.save()
      const embed = new EmbedBuilder()
        .setTitle(Format.fancyTitle(Emojis.success, 'Logs Configurados'))
        .setDescription(`${Format.toBold('Sistema de auditoría')} vinculado correctamente a <#${channel.id}>.`)
        .setColor('Green')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    if (subcommand === 'suggestions') {
      guildData.suggestionChannel = channel.id
      await guildData.save()
      const embed = new EmbedBuilder()
        .setTitle(Format.fancyTitle(Emojis.success, 'Sugerencias Configuradas'))
        .setDescription(`${Format.toBold('Sistema de sugerencias')} vinculado correctamente a <#${channel.id}>.`)
        .setColor('Green')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    if (subcommand === 'welcome') {
      guildData.welcomeChannel = channel.id
      await guildData.save()
      const embed = new EmbedBuilder()
        .setTitle(Format.fancyTitle(Emojis.success, 'Bienvenidas Configuradas'))
        .setDescription(`${Format.toBold('Sistema de bienvenidas')} vinculado correctamente a <#${channel.id}>.`)
        .setColor('Green')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  }
}
