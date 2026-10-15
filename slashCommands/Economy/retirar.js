const { localeFor } = require('../../handlers/i18n')
const views = require('../../handlers/economy/messages')
const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter } = require('../../handlers/functions')

module.exports = {
  name: 'retirar',
  description: 'Retirar monedas del banco a la cartera',
  options: [
    { String: { name: 'cantidad', description: 'Cantidad a retirar o "todo"', required: true } },
  ],

  run: async (client, interaction) => {
    const gid=interaction.guild.id, locale=localeFor(client,gid)
    const fail=(key,vars)=>interaction.reply({embeds:[views.error(locale,key,vars)],ephemeral:true,allowedMentions:{parse:[]}})
    if(!client.settings.get(gid,'ECONOMY'))return fail('disabled')
    const uid=interaction.user.id, key=`${gid}-${uid}`
    ensure_economy_user(client,gid,uid)
    const available=client.economy.get(key,'bank')??0
    const amount=views.parseAmount(interaction.options.getString('cantidad'),available)
    if(amount===null)return fail('invalidAmount')
    if(available<amount)return fail('insufficientBank',{amount:nFormatter(available)})
    // This preserves the legacy two-write store; it is not a cross-process transaction.
    client.economy.math(key,'-',amount,'bank')
    client.economy.math(key,'+',amount,'balance')
    return interaction.reply({embeds:[views.transaction(locale,'withdrawn',amount,client.economy.get(key),nFormatter)],allowedMentions:{parse:[]}})
  },
}
