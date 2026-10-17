const {PermissionFlagsBits:F,RESTJSONErrorCodes}=require('discord.js')
const {ConfigurationError}=require('./welcome-configuration')
function denyWelcomeAccess(){
 const error=new ConfigurationError('No se verificó el permiso de configuración.','configuration_permissions')
 error.accessRevoked=true
 throw error
}
async function assertWelcomeActor(guild,actorId){
 let actor
 try{actor=await guild.members.fetch({user:actorId,force:true})}
 catch(error){
  if([RESTJSONErrorCodes.UnknownMember,RESTJSONErrorCodes.MissingAccess].includes(error.code))denyWelcomeAccess()
  throw error
 }
 if(!actor.permissions.has(F.ManageGuild))denyWelcomeAccess()
 return actor
}
async function assertWelcomeChannel(guild,actorId,channelId){
 const actor=await assertWelcomeActor(guild,actorId)
 if(channelId===null)return
 const [channels,bot]=await Promise.all([guild.channels.fetch(),guild.members.fetchMe({force:true})])
 const channel=channels.get(channelId)
 if(!channel||channel.type!==0)throw new ConfigurationError('El canal debe ser de texto y pertenecer a este servidor.','invalid_configuration')
 if(!channel.permissionsFor(actor)?.has(F.ViewChannel)||!channel.permissionsFor(bot)?.has([F.ViewChannel,F.SendMessages,F.EmbedLinks,F.AttachFiles]))throw new ConfigurationError('No se verificó el acceso necesario para publicar bienvenidas.','configuration_permissions')
}
module.exports={assertWelcomeActor,assertWelcomeChannel}
