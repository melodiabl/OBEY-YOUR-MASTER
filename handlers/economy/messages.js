const obeyMeta = require("../presentation/metadata")
const { EmbedBuilder } = require('discord.js')
const { registry } = require('../assets/registry')
const { t } = require('../i18n')
const { config } = require('../music/config')
function parseAmount(input, available) {
  const value = String(input ?? '').trim().toLowerCase()
  const amount = ['all','todo'].includes(value) ? available : /^\d+$/.test(value) ? Number(value) : NaN
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null
}
function error(locale, key, variables={}) { return new EmbedBuilder().setColor(0xED4245).setDescription(`${registry.markup('icon.error')} ${t(locale,'economy.'+key,variables)}`) }
function field(locale,key,asset,value) { return {name:`${registry.markup(asset)} ${t(locale,'economy.'+key)}`,value:String(value),inline:true} }
function balance(locale,user,data,format,inventory) {
  const cash=data?.balance??0,bank=data?.bank??0,coin=registry.markup('icon.coins')
  const embed=new EmbedBuilder().setColor(config.color.primary).setTitle(t(locale,'economy.balance'))
    .setAuthor(obeyMeta.asAuthor({name:user.username,iconURL:user.displayAvatarURL()}))
    .addFields(field(locale,'wallet','icon.wallet',`**${format(cash)}** ${coin}`),field(locale,'bank','icon.bank',`**${format(bank)}** ${coin}`),field(locale,'total','icon.coins',`**${format(cash+bank)}** ${coin}`))
  if(inventory)embed.addFields(field(locale,'inventory','icon.case',t(locale,'economy.inventoryValue',{count:inventory.count,amount:format(inventory.value)})))
  return embed
}
function transaction(locale,kind,amount,data,format,target) {
 const coin=registry.markup('icon.coins')
 const embed=new EmbedBuilder().setColor(config.color.primary).setTitle(`${registry.markup(kind==='transfer'?'icon.send':'icon.bank')} ${t(locale,'economy.'+kind)}`)
  .addFields(field(locale,'amount','icon.coins',`**${format(amount)}** ${coin}`),field(locale,'wallet','icon.wallet',`**${format(data.balance??0)}** ${coin}`))
 if(target)embed.addFields(field(locale,'recipient','icon.profile',`<@${target.id}>`))
 else embed.addFields(field(locale,'bank','icon.bank',`**${format(data.bank??0)}** ${coin}`))
 return embed
}
module.exports={parseAmount,error,balance,transaction}
