const obeyUi = require("../assets/system")
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js')
const { registry } = require('../assets/registry')
const { t } = require('../i18n')
function voteEmoji(direction, configured) {
 const key=direction==='up'?'icon.vote-up':'icon.vote-down'
 const defaults=direction==='up'?['✅','<:yes:833101995723194437>','<a:yes:833101995723194437>']:['❌','<:no:833101993668771842>','<a:no:833101993668771842>']
 if(!configured||defaults.includes(configured))return registry.emoji(key)
 try { return new ButtonBuilder().setEmoji(configured).data.emoji } catch { return registry.emoji(key) }
}
function voteButtons(settings={},counts={},locale='es') {
 const buttons=[['up','Suggest_upvote',counts.upvotes??0,settings.approveemoji,'for'],['down','Suggest_downvote',counts.downvotes??0,settings.denyemoji,'against']].map(([direction,id,count,configured,label])=>new ButtonBuilder().setCustomId(id).setStyle(ButtonStyle.Secondary).setEmoji(voteEmoji(direction,configured)).setLabel(obeyUi.plain(`${t(locale,'suggestions.'+label)} · ${count}`)))
 buttons.push(new ButtonBuilder().setCustomId('Suggest_who').setStyle(ButtonStyle.Primary).setEmoji(obeyUi.component(registry.emoji('icon.info'))).setLabel(obeyUi.plain(t(locale,'suggestions.who'))))
 return new ActionRowBuilder().addComponents(buttons)
}
function updateVoteEmbed(original,counts,locale='es') {
 const embed=EmbedBuilder.from(original),fields=embed.data.fields||[]
 const voteFields=[['icon.vote-up','for',counts.upvotes],['icon.vote-down','against',counts.downvotes]].map(([key,label,count])=>({name:`${registry.markup(key)} ${t(locale,'suggestions.'+label)}`,value:t(locale,'suggestions.count',{count:count??0}),inline:true}))
 return embed.setFields(...voteFields,...fields.slice(2))
}
module.exports={voteEmoji,voteButtons,updateVoteEmbed}
