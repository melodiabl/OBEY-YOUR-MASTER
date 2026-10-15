const raw = require('../../botconfig/emojis.json')
const { registry } = require('./registry')
const { normalizeLegacyText } = require('../i18n/legacy')
const semanticKeys = {
 discord_robot:'icon.bot',threadchannel:'icon.conversation',channel:'icon.channel',milratodev:'icon.code',botflag:'icon.bot',notes:'icon.edit',twitter:'icon.bird',youtube:'icon.video',spotify:'icon.headphones',tiktok:'icon.microphone',twitch:'icon.video',soundcloud:'icon.wave',automeme:'icon.conversation',validcode:'icon.verify',kick:'icon.gavel',message:'icon.conversation',title:'icon.feed',pruning:'icon.delete',equalizer:'icon.equalizer',leave_on_empty:'icon.voice',premium:'icon.crown',song_by:'icon.medal',dj:'icon.headphones',bot:'icon.bot',ping:'icon.connection',rewind:'icon.rewind',forward:'icon.forward',pause_resume:'icon.play',
 info:'icon.info',settings:'icon.settings',ERROR:'icon.error',cancel:'icon.close',SUCCESS:'icon.success',list:'icon.queue',roles:'icon.roles',builder:'icon.blueprint',loading:'motion.cargando',
 DOWNVOTE:'icon.vote-down',UPVOTE:'icon.vote-up',warn:'icon.warning',edit:'icon.edit',disabled:'icon.stop',enabled:'icon.success',
 cleared:'icon.delete',playing:'icon.music',time:'icon.clock',setup:'icon.settings',search:'icon.search',resume:'icon.play',pause:'icon.pause',lyrics:'icon.lyrics',disk:'icon.album',
 stop:'icon.stop',previous_track:'icon.previous',skip_track:'icon.skip',replay_track:'icon.loop',reduce_volume:'icon.volume-down',raise_volume:'icon.volume-up',toggle_mute:'icon.mute',repeat_mode:'icon.loop',autoplay_mode:'icon.autoplay',shuffle:'icon.shuffle',show_queue:'icon.queue',show_current_track:'icon.music',
}
function createLegacyEmojiConfig(source=raw,assets=registry) {
 const config=structuredClone(source)
 for(const [legacy,key] of Object.entries(semanticKeys)) {
  if(!Object.hasOwn(config.msg||{},legacy))continue
  const fallback=source.msg[legacy]
  Object.defineProperty(config.msg,legacy,{enumerable:true,get(){
   const resolved=assets.emoji(key)
   return resolved.id ? assets.markup(key) : /<a?:\w+:\d+>/.test(fallback) ? normalizeLegacyText(fallback,assets) : fallback
  }})
 }
 for(const [legacy,key] of Object.entries(semanticKeys)) {
  if(!Object.hasOwn(config.react||{},legacy))continue
  const fallback=source.react[legacy]
  Object.defineProperty(config.react,legacy,{enumerable:true,get(){const e=assets.emoji(key);return e.id||(/^\d{17,20}$/.test(fallback)?e.name:fallback)}})
 }
 if(config.msg?.progress_bar)for(const [field,key] of [['emptyframe','icon.progress-empty'],['filledframe','icon.progress-filled']]) {
  const fallback=source.msg.progress_bar[field]
  Object.defineProperty(config.msg.progress_bar,field,{enumerable:true,get(){return assets.emoji(key).id?assets.markup(key):fallback}})
 }
 if(Array.isArray(source.numberEmojis))config.numberEmojis=source.numberEmojis.map((fallback,n)=>assets.emoji('icon.ordinal-'+n).id?assets.markup('icon.ordinal-'+n):fallback)
 return config
}
const config=createLegacyEmojiConfig()
// Expose only compatibility fields; helper metadata must not enter user payloads.
module.exports=config
Object.defineProperties(module.exports,{createLegacyEmojiConfig:{value:createLegacyEmojiConfig},semanticKeys:{value:semanticKeys}})
