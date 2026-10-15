const obeyUi = require("../assets/system")
const {EmbedBuilder,ButtonBuilder,ActionRowBuilder,ButtonStyle}=require('discord.js')
const {t,localeFor}=require('../i18n')
const {registry}=require('../assets/registry')
function publicHttps(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null}catch{return null}}
async function runProjectInfo(client,message,type,configuration={}) {
 const locale=localeFor(client,message.guild?.id),name=client.user.username||'OBEY',buttons=[]
 const repository=publicHttps(configuration.repository??process.env.PROJECT_REPOSITORY_URL)
 const support=publicHttps(configuration.support??client.config?.info?.supportServer??process.env.SUPPORT_SERVER)
 const contact=publicHttps(configuration.contact??process.env.PROJECT_CONTACT_URL)
 const embed=new EmbedBuilder().setColor(0xFFD36F).setTitle(obeyUi.limit(t(locale,`project.${type}Title`,{name}), 256)).setDescription(obeyUi.limit(`${registry.markup('icon.info')} ${t(locale,`project.${type}Body`)}`, 4096))
 if(typeof client.user.displayAvatarURL==='function')embed.setThumbnail(client.user.displayAvatarURL())
 const add=(url,label)=>{if(url)buttons.push(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(url).setLabel(obeyUi.plain(t(locale,'project.'+label))))}
 if(type==='github')add(repository,'repository')
 if(type==='support'||type==='developer')add(support,'support')
 if(type==='developer')add(contact,'contact')
 if(!buttons.length&&type!=='sponsor')embed.addFields({name:t(locale,'project.links'),value:t(locale,'project.notConfigured')})
 return message.reply({embeds:[embed],components:buttons.length?[new ActionRowBuilder().addComponents(buttons)]:[],allowedMentions:{parse:[]}})
}
module.exports={publicHttps,runProjectInfo}
