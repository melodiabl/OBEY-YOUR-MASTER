const { registry } = require('./assets/registry')
const { t,localeFor } = require('./i18n')
function errorTag(error){return {name:/^[\w-]{1,64}$/.test(error?.name||'')?error.name:'Error',code:/^[\w-]{1,64}$/.test(String(error?.code||''))?String(error.code):'command_failed'}}
async function executeSlashCommand(interaction,run) {
 try {return await run()}
 catch(error) {
  console.error('[Slash] Command failed:',errorTag(error))
  const locale=localeFor(interaction.client,interaction.guildId||interaction.guild?.id)
  const response={content:`${registry.markup('icon.error')} ${t(locale,'common.commandError')}`,embeds:[],components:[],allowedMentions:{parse:[]}}
  try {
   if(interaction.deferred)await interaction.editReply(response)
   else if(interaction.replied)await interaction.followUp({...response,ephemeral:true})
   else await interaction.reply({...response,ephemeral:true})
  }catch(replyError){console.error('[Slash] Error response failed:',errorTag(replyError))}
 }
}
module.exports={executeSlashCommand}
