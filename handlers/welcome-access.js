const {PermissionFlagsBits:F}=require('discord.js')
const {ConfigurationError}=require('./welcome-configuration')
async function assertWelcomeChannel(guild,actorId,channelId){
 if(channelId===null)return
 const [channels,actor,bot]=await Promise.all([guild.channels.fetch(),guild.members.fetch({user:actorId,force:true}),guild.members.fetchMe({force:true})])
 const channel=channels.get(channelId)
 if(!channel||channel.type!==0)throw new ConfigurationError('El canal debe ser de texto y pertenecer a este servidor.','invalid_configuration')
 if(!actor.permissions.has(F.ManageGuild)||!channel.permissionsFor(actor)?.has(F.ViewChannel)||!channel.permissionsFor(bot)?.has([F.ViewChannel,F.SendMessages,F.EmbedLinks,F.AttachFiles]))throw new ConfigurationError('No se verificó el acceso necesario para publicar bienvenidas.','configuration_permissions')
}
module.exports={assertWelcomeChannel}
