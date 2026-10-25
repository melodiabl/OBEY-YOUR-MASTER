const {EmbedBuilder,PermissionFlagsBits}=require('discord.js')
const Moderation=require('../../database/schemas/ModerationSchema')
const {nextCaseId}=require('./cases')
const {registry}=require('../assets/registry')
const {t,localeFor}=require('../i18n')
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
 const reason=(interaction.options.getString('razon')||t(locale,'moderation.noReason')).slice(0,512)
 const replyError=key=>interaction.editReply({content:`${registry.markup('icon.error')} ${t(locale,'moderation.'+key)}`,allowedMentions:{parse:[]}})
 await interaction.deferReply({ephemeral:true})
 if(!permission||!interaction.member?.permissions?.has(permission))return replyError('permission')
 if(!interaction.guild.members.me?.permissions?.has(permission))return replyError('botPermission')
 if(!target||[interaction.user.id,client.user.id,interaction.guild.ownerId].includes(target.id))return replyError('protectedTarget')
 const member=await interaction.guild.members.fetch(target.id).catch(()=>null)
 if(action!=='ban'&&!member)return replyError('missingMember')
 if(member) {
  const possible=action==='ban'?member.bannable:action==='kick'?member.kickable:member.moderatable
  if(!possible)return replyError('hierarchy')
  if(interaction.guild.ownerId!==interaction.user.id) {
   const actorRole=interaction.member.roles?.highest,targetRole=member.roles?.highest
   if(!actorRole||!targetRole)return replyError('hierarchy')
   const order=typeof targetRole.comparePositionTo==='function'?targetRole.comparePositionTo(actorRole):targetRole.position-actorRole.position
   if(order>=0)return replyError('hierarchy')
  }
 }
 if(action==='timeout'&&(!Number.isSafeInteger(options.duration)||options.duration<1||options.duration>7*86400000))return replyError('invalidDuration')
 try {
  if(action==='ban')await interaction.guild.members.ban(target.id,{reason,deleteMessageSeconds:(options.days||0)*86400})
  else if(action==='kick')await member.kick(reason)
  else await member.timeout(options.duration,reason)
 }catch{return replyError('actionFailed')}
 let caseId=null,recordFailed=false
 try {
  caseId=await allocate(interaction.guild.id)
  await model.create({guildId:interaction.guild.id,userId:target.id,action,reason,moderatorId:interaction.user.id,caseId,active:action!=='kick',...(action==='timeout'?{duration:options.duration}:{})})
 }catch{recordFailed=true}
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
module.exports={runModeration,notify,unbanUser,unbanReply}
