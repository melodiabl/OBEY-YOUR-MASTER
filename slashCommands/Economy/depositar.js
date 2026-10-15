const { localeFor } = require('../../handlers/i18n')
const views = require('../../handlers/economy/messages')
const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter } = require('../../handlers/functions')

module.exports = {
  name: 'depositar',
  description: 'Depositar monedas en el banco',
  options: [
    { String: { name: 'cantidad', description: 'Cantidad a depositar o "todo"', required: true } },
  ],

  run: async (client, interaction) => {
    const gid=interaction.guild.id, locale=localeFor(client,gid)
    const fail=(key,vars)=>interaction.reply({embeds:[views.error(locale,key,vars)],ephemeral:true,allowedMentions:{parse:[]}})
    if(!client.settings.get(gid,'ECONOMY'))return fail('disabled')
    const uid=interaction.user.id, key=`${gid}-${uid}`
    ensure_economy_user(client,gid,uid)
    const available=client.economy.get(key,'balance')??0
    const amount=views.parseAmount(interaction.options.getString('cantidad'),available)
    if(amount===null)return fail('invalidAmount')
    if(available<amount)return fail('insufficientWallet',{amount:nFormatter(available)})
    // This preserves the legacy two-write store; it is not a cross-process transaction.
    client.economy.math(key,'-',amount,'balance')
    client.economy.math(key,'+',amount,'bank')
    return interaction.reply({embeds:[views.transaction(locale,'deposited',amount,client.economy.get(key),nFormatter)],allowedMentions:{parse:[]}})
  },
}
