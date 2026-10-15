const obeyMeta = require("../../handlers/presentation/metadata")
const { localeFor } = require('../../handlers/i18n')
const views = require('../../handlers/economy/messages')
const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter } = require('../../handlers/functions')

module.exports = {
  name: 'balance',
  description: 'Ver tu balance o el de otro usuario',
  options: [
    { User: { name: 'usuario', description: 'Usuario a consultar', required: false } },
  ],

  run: async (client, interaction) => {
    const gid=interaction.guild.id, locale=localeFor(client,gid)
    const fail=(key,vars)=>interaction.reply({embeds:[views.error(locale,key,vars)],ephemeral:true,allowedMentions:{parse:[]}})
    if(!client.settings.get(gid,'ECONOMY'))return fail('disabled')
    const target=interaction.options.getUser('usuario')||interaction.user
    if(target.bot)return fail('bots')
    ensure_economy_user(client,gid,target.id)
    const data=client.economy.get(`${gid}-${target.id}`)
    return interaction.reply({embeds:[views.balance(locale,target,data,nFormatter).setFooter(obeyMeta.asFooter({text:interaction.guild.name}))],allowedMentions:{parse:[]}})
  },
}
