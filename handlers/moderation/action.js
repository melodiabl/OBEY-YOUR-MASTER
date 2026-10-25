const {EmbedBuilder,PermissionFlagsBits}=require('discord.js')
const Moderation=require('../../database/schemas/ModerationSchema')
const {nextCaseId}=require('./cases')
const {registry}=require('../assets/registry')
const {t,localeFor}=require('../i18n')
const {performBan}=require('./ban')
const permissions={ban:PermissionFlagsBits.BanMembers,kick:PermissionFlagsBits.KickMembers,timeout:PermissionFlagsBits.ModerateMembers}
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
 const locale=localeFor(client,interaction.guild.id),permission=permissions[action],target=interaction.options.getUser('usuario')
 const reason=(interaction.options.getString('razon')||t(locale,'moderation.noReason')).slice(0,512).toWellFormed()
 const replyError=key=>interaction.editReply({content:`${registry.markup('icon.error')} ${t(locale,'moderation.'+key)}`,allowedMentions:{parse:[]}})
 await interaction.deferReply({ephemeral:true})
 if(action==='ban') {
  const result=await performBan(client,{guild:interaction.guild,actorId:interaction.user.id,targetId:target?.id,reason,days:options.days??0,policy:'slash'})
  if(result.status!=='banned')return replyError(result.status)
 } else {
  if(!permission||!interaction.member?.permissions?.has(permission))return replyError('permission')
  if(!interaction.guild.members.me?.permissions?.has(permission))return replyError('botPermission')
  if(!target||[interaction.user.id,client.user.id,interaction.guild.ownerId].includes(target.id))return replyError('protectedTarget')
  const member=await interaction.guild.members.fetch(target.id).catch(()=>null)
  if(!member)return replyError('missingMember')
  const possible=action==='kick'?member.kickable:member.moderatable
  if(!possible)return replyError('hierarchy')
  if(interaction.guild.ownerId!==interaction.user.id) {
   const actorRole=interaction.member.roles?.highest,targetRole=member.roles?.highest
   if(!actorRole||!targetRole)return replyError('hierarchy')
   const order=typeof targetRole.comparePositionTo==='function'?targetRole.comparePositionTo(actorRole):targetRole.position-actorRole.position
   if(order>=0)return replyError('hierarchy')
  }
  if(action==='timeout'&&(!Number.isSafeInteger(options.duration)||options.duration<1||options.duration>7*86400000))return replyError('invalidDuration')
  try {
   if(action==='kick')await member.kick(reason)
   else await member.timeout(options.duration,reason)
  }catch{return replyError('actionFailed')}
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
   command!=='idban'?settleWithin(async()=>{
    const destination=client.settings.get(message.guild.id,'adminlog')
    if(!destination||destination==='no')return
    const channel=message.guild.channels.cache.get(destination)
    if(!channel||typeof channel.send!=='function')throw new Error('Log destination unavailable')
    await channel.send({embeds:[new EmbedBuilder().setColor(0xFFD36F).setTitle(t(locale,'moderation.banDone')).addFields({name:t(locale,'moderation.user'),value:result.targetId},{name:t(locale,'moderation.reason'),value:result.reason},{name:t(locale,'moderation.moderator'),value:message.author.id})],allowedMentions:{parse:[]}})
   }):true,
  ])
  const notes=[]
  if(results[0]!==true)notes.push(t(locale,'moderation.statsUnconfirmed'))
  if(results[1]!==true)notes.push(t(locale,'moderation.dmUnconfirmed'))
  if(results[2]!==true)notes.push(t(locale,'moderation.logUnconfirmed'))
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
 const recorded=await settleWithin(async()=>{
  const result=await model.updateMany({guildId:guild.id,userId,action:'ban',active:true,$or:[{createdAt:{$lte:historyCutoff}},{createdAt:{$exists:false}}]},{$set:{active:false}})
  if(result?.acknowledged!==true)throw new Error('Unconfirmed moderation write')
 },dependencies.recordTimeoutMs??5000)
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
module.exports={runModeration,notify,unbanUser,unbanReply,runPrefixBan}
