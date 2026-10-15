const { EmbedBuilder } = require('discord.js')
const { registry } = require('../assets/registry')
const { t,localeFor } = require('../i18n')
const { ticketService,TicketError } = require('./service')
const glyph={add:'icon.roles',remove:'icon.roles',claim:'icon.claim',close:'icon.close'}
async function runTicketAction(client,interaction,action,service=ticketService) {
 const locale=localeFor(client,interaction.guild.id),reason=interaction.options.getString?.('razon')||t(locale,'tickets.noReason')
 const target=['add','remove'].includes(action)?interaction.options.getUser('usuario'):null
 await interaction.deferReply({ephemeral:true})
 try {
  await service.perform(client,interaction,action,target)
  const user=`<@${target?.id||interaction.user.id}>`
  await interaction.editReply({content:`${registry.markup(glyph[action])} ${t(locale,`tickets.${action}Done`,{user})}`,allowedMentions:{parse:[]}})
  if(action==='close') {
   const logId=client.settings?.get?.(interaction.guild.id,'ticketlogchannel'),log=interaction.guild.channels?.cache?.get?.(logId)
   if(log?.guild?.id===interaction.guild.id)await log.send({embeds:[new EmbedBuilder().setColor(0xFFD36F).setTitle(t(locale,'tickets.closedTitle')).setDescription(t(locale,'tickets.closeLog',{user,reason:reason.slice(0,1000)})).setTimestamp()],allowedMentions:{parse:[]}}).catch(()=>{})
  }
 }catch(error) {
  const key=error instanceof TicketError?error.code:'failed'
  await interaction.editReply({content:`${registry.markup('icon.error')} ${t(locale,`tickets.${key}`)}`,allowedMentions:{parse:[]}})
 }
}
module.exports={runTicketAction}
