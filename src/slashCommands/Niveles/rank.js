const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js')
const canvacord = require('canvacord')
const UserSchema = require('../../database/schemas/UserSchema')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Muestra tu nivel y experiencia actual')
    .addUserOption(option => option.setName('usuario').setDescription('Usuario para ver su rango')),

  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const userData = await UserSchema.findOne({ userID: user.id })

    if (!userData) return interaction.reply({ content: 'Este usuario no tiene datos de nivel aún.', ephemeral: true })

    const nextLevelXP = userData.level * userData.level * 100

    const rank = new canvacord.Rank()
      .setAvatar(user.displayAvatarURL({ extension: 'png' }))
      .setCurrentXP(userData.xp)
      .setRequiredXP(nextLevelXP)
      .setStatus('online')
      .setProgressBar('#FFFFFF', 'COLOR')
      .setUsername(user.username)
      .setDiscriminator(user.discriminator || '0000')
      .setLevel(userData.level)
      .setRank(1, 'RANK', false)

    const data = await rank.build()
    const attachment = new AttachmentBuilder(data, { name: 'rank.png' })

    await interaction.reply({ files: [attachment] })
  }
}
