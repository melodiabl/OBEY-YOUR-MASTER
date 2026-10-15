const { PermissionFlagsBits } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
const { createActionQueue } = require('../music/action-queue')
class TicketError extends Error { constructor(code){super(code);this.code=code} }
function createTicketService(model=Ticket) {
 const actions=createActionQueue()
 async function find(client,guildId,channelId) {
  const record=await model.findOne({guildId,channelId})
  if(record)return {kind:'model',record,userId:record.userId,status:record.status,claimedBy:record.claimedBy}
  const legacy=client.setups?.get?.(channelId,'ticketdata')
  if(legacy?.guild===guildId && legacy.channel===channelId && typeof legacy.user==='string')return {kind:'legacy',record:legacy,userId:legacy.user,status:legacy.state,claimedBy:legacy.claimedBy}
  throw new TicketError('notTicket')
 }
 function staff(interaction){return Boolean(interaction.member?.permissions?.has?.(PermissionFlagsBits.ManageChannels))}
 function botPermission(client,interaction) {
  const permissions=interaction.appPermissions||interaction.channel?.permissionsFor?.(client.user)
  if(!permissions?.has?.(PermissionFlagsBits.ManageChannels))throw new TicketError('botPermission')
 }
 async function save(client,context,fields) {
  if(context.kind==='model'){const previous=Object.fromEntries(Object.keys(fields).map(key=>[key,context.record[key]]));Object.assign(context.record,fields);try{await context.record.save()}catch(error){Object.assign(context.record,previous);throw error}}
  else for(const [key,value]of Object.entries(fields))client.setups.set(context.record.channel,value,`ticketdata.${key==='status'?'state':key}`)
 }
 return {
  async perform(client,interaction,action,target) {
   return actions.run(`${interaction.guild.id}:${interaction.channelId}`,async()=>{
    if(!['add','remove','claim','close'].includes(action))throw new TicketError('unknownAction')
    const context=await find(client,interaction.guild.id,interaction.channelId)
    if(!['open','claimed'].includes(context.status))throw new TicketError('closed')
    const isStaff=staff(interaction)
    if(action==='close' ? !(isStaff||context.userId===interaction.user.id) : !isStaff)throw new TicketError('permission')
    botPermission(client,interaction)
    if(action==='claim') {
     if(context.claimedBy)throw new TicketError('alreadyClaimed')
     if(context.kind==='model') {
      const claimed=await model.findOneAndUpdate({guildId:interaction.guild.id,channelId:interaction.channelId,status:'open',claimedBy:null},{$set:{claimedBy:interaction.user.id,status:'claimed'}},{new:true})
      if(!claimed)throw new TicketError('alreadyClaimed')
     }else await save(client,context,{claimedBy:interaction.user.id,status:'claimed'})
    } else if(action==='close') {
     const owner=context.userId,previous=interaction.channel.permissionOverwrites.cache?.get?.(owner)
     const oldPermission=name=>previous?.allow?.has(name)?true:previous?.deny?.has(name)?false:null
     const restore={SendMessages:oldPermission(PermissionFlagsBits.SendMessages),AddReactions:oldPermission(PermissionFlagsBits.AddReactions)}
     await interaction.channel.permissionOverwrites.edit(owner,{SendMessages:false,AddReactions:false})
     try { await save(client,context,{status:'closed'}) }
     catch(error) {
      try { if(previous)await interaction.channel.permissionOverwrites.edit(owner,restore);else await interaction.channel.permissionOverwrites.delete(owner) }
      catch { throw new TicketError('reconcile') }
      throw error
     }
    } else {
     if(!target)throw new TicketError('unknownMember')
     const member=await interaction.guild.members.fetch(target.id).catch(()=>null)
     if(!member)throw new TicketError('unknownMember')
     if(action==='remove'&&target.id===context.userId)throw new TicketError('ownerProtected')
     if(action==='remove'&&member.permissions?.has?.(PermissionFlagsBits.Administrator))throw new TicketError('privilegedMember')
     if(action==='add')await interaction.channel.permissionOverwrites.edit(member,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true})
     else if(action==='remove')await interaction.channel.permissionOverwrites.edit(member,{ViewChannel:false,SendMessages:false,ReadMessageHistory:false})
     else throw new TicketError('unknownAction')
    }
    return {action,userId:context.userId}
   })
  },find,
 }
}
module.exports={TicketError,createTicketService,ticketService:createTicketService()}
