const {EmbedBuilder}=require('discord.js')
const {t}=require('../i18n')
const {registry}=require('../assets/registry')
const catalog=require('../../assets/obey/presentation.json')
const states={ready:{key:'icon.info',color:0xFFD36F},loading:{key:'motion.cargando',color:0xF0B232},empty:{key:'icon.info',color:0x8795AF},success:{key:'icon.success',color:0xFFD36F},error:{key:'icon.error',color:0xED4245},expired:{key:'icon.clock',color:0x8795AF}}
function buildModuleMessage(module,state,locale='es',{description,fields=[]}={}) {
 if(!Object.hasOwn(catalog.modules,module)||!Object.hasOwn(states,state))throw new Error('Unknown module or message state')
 const selected=states[state],text=description??t(locale,`modules.${module}.${state}.description`)
 if(typeof text!=='string'||text.length>3900||!Array.isArray(fields)||fields.length>25)throw new Error('Invalid module message data')
 const embed=new EmbedBuilder().setColor(selected.color).setTitle(t(locale,`modules.${module}.${state}.title`)).setDescription(`${registry.markup(selected.key)} ${text}`)
 if(fields.length)embed.addFields(fields)
 return {embeds:[embed],allowedMentions:{parse:[]}}
}
module.exports={buildModuleMessage,catalog}
