const {EmbedBuilder,PermissionFlagsBits}=require('discord.js')
const Moderation=require('../../database/schemas/ModerationSchema')
const {nextCaseId}=require('./cases')
const {registry}=require('../assets/registry')
const {t,localeFor}=require('../i18n')
const permissions={ban:PermissionFlagsBits.BanMembers,kick:PermissionFlagsBits.KickMembers,timeout:PermissionFlagsBits.ModerateMembers}
async function notify(target,payload,timeoutMs=5000) {
 let timer
 try {return await Promise.race([Promise.resolve().then(()=>target.send(payload)).then(()=>true,()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(null),timeoutMs)})])}
 finally{clearTimeout(timer)}
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
module.exports={runModeration,notify}
