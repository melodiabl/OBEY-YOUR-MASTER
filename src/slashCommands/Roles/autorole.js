const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const GuildSchema = require('../../database/schemas/GuildSchema')
const { replyOk, replyWarn } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configura un rol automático para los nuevos miembros')
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('El rol que se dará automáticamente')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute (client, interaction) {
    const role = interaction.options.getRole('rol')

    if (role.managed) {
      return replyWarn(client, interaction, {
        system: 'config',
        title: 'Rol no válido',
        lines: ['No puedo asignar un rol gestionado por una integración.']
      }, { ephemeral: true })
    }

    let guildData = await GuildSchema.findOne({ guildID: interaction.guild.id })
    if (!guildData) {
      guildData = new GuildSchema({ guildID: interaction.guild.id })
    }

    guildData.autoRole = role.id
    await guildData.save()

    await replyOk(client, interaction, {
      system: 'config',
      title: 'Auto-rol configurado',
      lines: [
        `Rol: ${role}`,
        'A partir de ahora, los nuevos miembros lo recibirán automáticamente.'
      ],
      signature: 'Tip: revisa la jerarquía de roles si falla'
    })
  }
}
