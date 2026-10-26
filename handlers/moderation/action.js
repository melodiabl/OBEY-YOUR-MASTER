const {EmbedBuilder,PermissionFlagsBits}=require('discord.js')
const Moderation=require('../../database/schemas/ModerationSchema')
const {nextCaseId}=require('./cases')
const {registry}=require('../assets/registry')
const {t,localeFor}=require('../i18n')
const {performBan}=require('./ban')
const {performMemberAction,parseTimeout,formatTimeout}=require('./member-actions')
const {canObserveModerationAudit}=require('../logs/policy')
const {emitModerationLog}=require('../../src/modules/moderation/application/logging')
async function settleWithin(work,timeoutMs=5000) {
 let timer
 try {return await Promise.race([Promise.resolve().then(work).then(()=>true,()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(null),timeoutMs)})])}
 finally{clearTimeout(timer)}
}
function notify(target,payload,timeoutMs=5000) {
 return settleWithin(()=>target.send(payload),timeoutMs)
}
async function runModeration(client,interaction,action,options={},dependencies={}) {
 const model=dependencies.model||Moderation,allocate=dependencies.allocate||nextCaseId
 const locale=localeFor(client,interaction.guild.id),target=interaction.options.getUser('usuario')
 const reason=(interaction.options.getString('razon')||t(locale,'moderation.noReason')).slice(0,512).toWellFormed()
 const replyError=key=>interaction.editReply({content:`${registry.markup('icon.error')} ${t(locale,'moderation.'+key)}`,allowedMentions:{parse:[]}})
 await interaction.deferReply({ephemeral:true})
 if(action==='ban') {
  const result=await performBan(client,{guild:interaction.guild,actorId:interaction.user.id,targetId:target?.id,reason,days:options.days??0,policy:'slash'})
  if(result.status!=='banned')return replyError(result.status)
 } else {
  const result=await performMemberAction(client,{guild:interaction.guild,actorId:interaction.user.id,targetId:target?.id,reason,duration:options.duration,policy:'slash',action})
  if(result.status!=='applied')return replyError(result.status)
  if(action==='kick'&&!canObserveModerationAudit(client,interaction.guild))
   void emitModerationLog(client,{guildId:interaction.guild.id,kind:'kicked',userId:target.id,user:target,actorId:interaction.user.id,reason})
 }

 let caseId=null
 const recorded=await settleWithin(async()=>{
  caseId=await allocate(interaction.guild.id)
  await model.create({guildId:interaction.guild.id,userId:target.id,action,reason,moderatorId:interaction.user.id,caseId,active:action!=='kick',...(action==='timeout'?{duration:options.duration}:{})})
 },dependencies.recordTimeoutMs??5000)
 const recordFailed=recorded!==true
 const asset=action==='timeout'?'icon.clock':'icon.shield'
 const dm=new EmbedBuilder().setColor(0xF0B232).setTitle(t(locale,`moderation.${action}Dm`,{server:interaction.guild.name})).setDescription(`${t(locale,'moderation.reason')}: ${reason}`)
 const delivery=await notify(target,{embeds:[dm],allowedMentions:{parse:[]}},dependencies.notificationTimeoutMs??5000)
 const embed=new EmbedBuilder().setColor(0xFFD36F).setTitle(`${registry.markup(asset)} ${t(locale,`moderation.${action}Done`)}`).addFields({name:t(locale,'moderation.user'),value:`<@${target.id}>`,inline:true},{name:t(locale,'moderation.reason'),value:reason})
 if(!recordFailed)embed.addFields({name:t(locale,'moderation.case'),value:`#${caseId}`,inline:true})
 const notes=[]
 if(recordFailed)notes.push(t(locale,'moderation.recordFailed'))
 if(delivery!==true)notes.push(t(locale,'moderation.dmUnconfirmed'))
 if(notes.length)embed.setDescription(notes.join('\n'))
 return interaction.editReply({embeds:[embed],allowedMentions:{parse:[]}})
}
async function runPrefixBan(client,message,args,command) {
 const locale=localeFor(client,message.guild.id),es=client.settings.get(message.guild.id,'embed')
 let targetId=args[0],days=0,reasonArgs=args.slice(1)
 if(command==='ban') {
  const mention=typeof targetId==='string'?/^<@!?(\d{17,20})>$/.exec(targetId):null
  if(mention)targetId=mention[1]
  if(args[1]!==undefined&&String(args[1]).trim()!==''&&!Number.isNaN(Number(args[1]))) {
   days=Number(args[1]);reasonArgs=args.slice(2)
  }
 }
 const reason=reasonArgs.join(' ')||t(locale,'moderation.noReason')
 const result=await performBan(client,{guild:message.guild,actorId:message.author.id,targetId,reason,days,policy:'prefix',command})
 const success=result.status==='banned'
 const embed=new EmbedBuilder().setColor(success?(es?.color??0xFFD36F):(es?.wrongcolor??0xED4245))
 if(!success)embed.setDescription(t(locale,'moderation.'+result.status))
 else {
  embed.setTitle(t(locale,'moderation.banDone')).addFields({name:t(locale,'moderation.user'),value:result.targetId},{name:t(locale,'moderation.reason'),value:result.reason})
  const results=await Promise.all([
   command==='ban'?settleWithin(()=>client.stats.push(message.guild.id+message.author.id,Date.now(),'ban')):true,
   command==='ban'&&result.user&&!result.user.bot?notify(result.user,{embeds:[new EmbedBuilder().setColor(0xF0B232).setTitle(t(locale,'moderation.banDm',{server:message.guild.name})).setDescription(result.reason)],allowedMentions:{parse:[]}}):true,
  ])
  const notes=[]
  if(results[0]!==true)notes.push(t(locale,'moderation.statsUnconfirmed'))
  if(results[1]!==true)notes.push(t(locale,'moderation.dmUnconfirmed'))
  if(notes.length)embed.setDescription(notes.join('\n'))
 }
 embed.setFooter(require('../presentation/metadata').asFooter(client.getFooter(es)))
 return message.reply({embeds:[embed],allowedMentions:{parse:[]}})
}
function closeHistory(model,guildId,userId,action,cutoff,timeoutMs=5000) {
 return settleWithin(async()=>{
  const result=await model.updateMany({guildId,userId,action,active:true,$or:[{createdAt:{$lte:cutoff}},{createdAt:{$exists:false}}]},{$set:{active:false}})
  if(result?.acknowledged!==true)throw new Error('Unconfirmed moderation write')
 },timeoutMs)
}
async function runPrefixMemberAction(client,message,args,command) {
 const locale=localeFor(client,message.guild.id),es=client.settings.get(message.guild.id,'embed')
 const mention=typeof args[0]==='string'?/^<@!?(\d{17,20})>$/.exec(args[0]):null
 const targetId=mention?mention[1]:args[0]
 const reason=(command==='removetimeout'?'':args.slice(command==='timeout'?2:1).join(' '))||t(locale,'moderation.noReason')
 const result=await performMemberAction(client,{guild:message.guild,actorId:message.author.id,targetId,policy:'prefix',command,action:command,reason,duration:command==='timeout'?parseTimeout(args[1]):undefined})
 const success=result.status==='applied',key=command==='removetimeout'?'timeoutRemoved':command+'Done'
 const embed=new EmbedBuilder().setColor(success?(es?.color??0xFFD36F):(es?.wrongcolor??0xED4245))
 if(!success)embed.setDescription(t(locale,'moderation.'+result.status))
 else {
  embed.setTitle(t(locale,'moderation.'+key)).addFields({name:t(locale,'moderation.user'),value:targetId},{name:t(locale,'moderation.reason'),value:result.reason})
  if(command==='timeout')embed.addFields({name:t(locale,'moderation.duration'),value:formatTimeout(result.duration,locale)})
  const dmKey=command==='removetimeout'?'timeoutRemovedDm':command+'Dm'
  const results=await Promise.all([
   settleWithin(()=>client.stats.push(message.guild.id+message.author.id,Date.now(),command==='kick'?'kick':'mute')),
   !result.user.bot?notify(result.user,{embeds:[new EmbedBuilder().setColor(0xF0B232).setTitle(t(locale,'moderation.'+dmKey,{server:message.guild.name})).setDescription(result.reason)],allowedMentions:{parse:[]}}):true,
   command==='kick'&&!canObserveModerationAudit(client,message.guild)?settleWithin(async()=>{
    const delivery=await emitModerationLog(client,{guildId:message.guild.id,kind:'kicked',userId:targetId,user:result.user,actorId:message.author.id,reason:result.reason})
    if(!['sent','skipped'].includes(delivery.status))throw new Error('Log delivery unconfirmed')
   }):true,
   command==='removetimeout'?closeHistory(Moderation,message.guild.id,targetId,'timeout',result.historyCutoff):true,
  ])
  const notes=[]
  if(results[0]!==true)notes.push(t(locale,'moderation.memberStatsUnconfirmed'))
  if(results[1]!==true)notes.push(t(locale,'moderation.dmUnconfirmed'))
  if(results[2]!==true)notes.push(t(locale,'moderation.memberLogUnconfirmed'))
  if(results[3]!==true)notes.push(t(locale,'moderation.timeoutHistoryUnconfirmed'))
  if(notes.length)embed.setDescription(notes.join('\n'))
 }
 embed.setFooter(require('../presentation/metadata').asFooter(client.getFooter(es)))
 return message.reply({embeds:[embed],allowedMentions:{parse:[]}})
}
// Prefix retains Administrator; slash retains BanMembers. Refresh both actors before mutation.
async function unbanUser(client,{guild,actorId,userId,actorPermission,reason},dependencies={}) {
 const validId=value=>typeof value==='string'&&/^\d{17,20}$/.test(value)
 if(!validId(userId))return {status:'invalidUserId'}
 if(!validId(guild?.id)||!validId(actorId)||![PermissionFlagsBits.Administrator,PermissionFlagsBits.BanMembers].includes(actorPermission))return {status:'permission'}
 if(client._shuttingDown)return {status:'stopping'}
 let lookupError=null
 try {await guild.bans.fetch({user:userId,force:true})}catch(error){lookupError=error}
 let actor,bot
 try {
  [actor,bot]=await Promise.all([guild.members.fetch({user:actorId,force:true}),guild.members.fetchMe({force:true})])
 }catch{return {status:'accessUnconfirmed'}}
 if(!actor?.permissions?.has(actorPermission))return {status:'permission'}
 if(!bot?.permissions?.has(PermissionFlagsBits.BanMembers))return {status:'botPermission'}
 if(lookupError)return {status:lookupError.code===10026?'notBanned':'unbanLookupFailed'}
 if(client._shuttingDown)return {status:'stopping'}
 const boundedReason=typeof reason==='string'?reason.slice(0,512).toWellFormed():''
 const historyCutoff=new Date()
 try {await guild.members.unban(userId,boundedReason)}catch{return {status:'actionFailed'}}
 const model=dependencies.model||Moderation
 const recorded=await closeHistory(model,guild.id,userId,'ban',historyCutoff,dependencies.recordTimeoutMs??5000)
 return {status:'unbanned',userId,reason:boundedReason,recordFailed:recorded!==true}
}
function unbanReply(result,locale,{successColor=0x22C55E,errorColor=0xED4245}={}) {
 const success=result.status==='unbanned'
 const embed=new EmbedBuilder().setColor(success?successColor:errorColor)
 if(success){
  embed.setTitle(t(locale,'moderation.unbanDone')).addFields({name:t(locale,'moderation.user'),value:result.userId},{name:t(locale,'moderation.reason'),value:result.reason||t(locale,'moderation.noReason')})
  if(result.recordFailed)embed.setDescription(t(locale,'moderation.unbanRecordFailed'))
 }else embed.setDescription(t(locale,'moderation.'+result.status))
 return {embeds:[embed],allowedMentions:{parse:[]}}
}
module.exports={runModeration,notify,unbanUser,unbanReply,runPrefixBan,runPrefixMemberAction}
