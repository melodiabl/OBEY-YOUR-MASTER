const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed } = require('../../core/ui/interactionKit')
const { money } = require('./_catalog')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Muestra el balance (economía)')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario (opcional)').setRequired(false)),

  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const userData = await client.db.getUserData(user.id)
    const now = Date.now()

    const wallet = Number(userData.money || 0)
    const bank = Number(userData.bank || 0)
    const total = wallet + bank
    const dist = total > 0 ? Format.progressBar(wallet, total, 15) : Format.progressBar(0, 1, 15)
    const toRel = (ms) => `<t:${Math.floor(ms / 1000)}:R>`

    return replyEmbed(client, interaction, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.economy} Balance`,
      description: [
        headerLine(Emojis.economy, user.tag),
        `${Emojis.dot} ${Emojis.money} **Efectivo:** ${Format.inlineCode(money(wallet))}`,
        `${Emojis.dot} ${Emojis.bank} **Banco:** ${Format.inlineCode(money(bank))}`,
        `${Emojis.dot} **Distribución:** ${dist}`,
        Format.softDivider(20),
        `${Emojis.dot} ${Emojis.stats} **Total:** ${Format.bold(money(total))}`,
        Format.softDivider(20),
        `${Emojis.dot} ${Emojis.giveaway} **Daily:** ${(userData.dailyCooldown && userData.dailyCooldown > now) ? toRel(userData.dailyCooldown) : `${Emojis.success} Listo`} ${Format.inlineCode('/daily')}`,
        `${Emojis.dot} ${Emojis.work} **Work:** ${(userData.workCooldown && userData.workCooldown > now) ? toRel(userData.workCooldown) : `${Emojis.success} Listo`} ${Format.inlineCode('/work')}`,
        `${Emojis.dot} ${Emojis.security} **Protección:** ${(userData.robProtectionUntil && userData.robProtectionUntil > now) ? toRel(userData.robProtectionUntil) : Format.inlineCode('OFF')}`
      ].join('\n'),
      thumbnail: user.displayAvatarURL({ size: 256 }),
      signature: 'Economía sincronizada (premium)'
    }, { ephemeral: true })
  }
}
