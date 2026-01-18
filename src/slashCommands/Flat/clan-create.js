const { SlashCommandBuilder } = require('discord.js')
const { createClan } = require('../../systems').clans
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'clans',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('clan-create')
    .setDescription('Crea un clan')
    .addStringOption(o =>
      o
        .setName('nombre')
        .setDescription('Nombre del clan')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(30)
    )
    .addStringOption(o =>
      o
        .setName('tag')
        .setDescription('Tag (opcional)')
        .setRequired(false)
        .setMinLength(2)
        .setMaxLength(6)
    ),

  async execute (client, interaction) {
    const name = interaction.options.getString('nombre', true)
    const tag = interaction.options.getString('tag')
    try {
      const clan = await createClan({ client, guildID: interaction.guild.id, ownerID: interaction.user.id, name, tag })
      return interaction.reply({ content: `✅ Clan creado: **${clan.name}**${clan.tag ? ` [${clan.tag}]` : ''}`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
