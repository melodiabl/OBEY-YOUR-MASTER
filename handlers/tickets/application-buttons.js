const obeyUi = require("../assets/system")
const { ButtonBuilder,ButtonStyle }=require('discord.js')
const {registry}=require('../assets/registry')
const {t}=require('../i18n')
function buildApplicationButtons(locale='es') {
 const result={}
 for(const [key,id,label,asset,style]of [['acceptbutton','Apply_accept','accept','icon.success',ButtonStyle.Success],['declinebutton','Apply_deny','deny','icon.error',ButtonStyle.Danger],['ticketbutton','Apply_ticket','ask','icon.help',ButtonStyle.Secondary]]) {
  for(const disabled of [false,true])result[key+(disabled?'_d':'')]=new ButtonBuilder().setCustomId(id).setLabel(obeyUi.plain(t(locale,'tickets.'+label))).setEmoji(obeyUi.component(registry.emoji(asset))).setStyle(style).setDisabled(disabled)
 }
 for(let number=1;number<=5;number++)for(const disabled of [false,true])result[`emoji${number}button${disabled?'_d':''}`]=new ButtonBuilder().setCustomId(`Apply_${number}`).setLabel(obeyUi.plain(String(number))).setStyle(ButtonStyle.Primary).setDisabled(disabled)
 return result
}
module.exports={buildApplicationButtons}
