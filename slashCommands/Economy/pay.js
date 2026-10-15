const { localeFor } = require('../../handlers/i18n')
const views = require('../../handlers/economy/messages')
const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter } = require('../../handlers/functions')

module.exports = {
  name: 'pay',
  description: 'Transferir monedas a otro usuario',
  options: [
    { User:    { name: 'usuario', description: 'A quién enviar',     required: true } },
    { Integer: { name: 'cantidad', description: 'Cantidad a enviar', required: true } },
  ],

  run: async (client, interaction) => {
    const gid=interaction.guild.id, locale=localeFor(client,gid)
    const fail=(key,vars)=>interaction.reply({embeds:[views.error(locale,key,vars)],ephemeral:true,allowedMentions:{parse:[]}})
    if(!client.settings.get(gid,'ECONOMY'))return fail('disabled')
    const target=interaction.options.getUser('usuario'),amount=interaction.options.getInteger('cantidad'),uid=interaction.user.id
    if(target.id===uid)return fail('selfPay')
    if(target.bot)return fail('bots')
    if(!Number.isSafeInteger(amount)||amount<1)return fail('invalidAmount')
    ensure_economy_user(client,gid,uid);ensure_economy_user(client,gid,target.id)
    const key=`${gid}-${uid}`,available=client.economy.get(key,'balance')??0
    if(available<amount)return fail('insufficientWallet',{amount:nFormatter(available)})
    client.economy.math(key,'-',amount,'balance')
    client.economy.math(`${gid}-${target.id}`,'+',amount,'balance')
    return interaction.reply({embeds:[views.transaction(locale,'transfer',amount,client.economy.get(key),nFormatter,target)],allowedMentions:{parse:[]}})
  },
}
