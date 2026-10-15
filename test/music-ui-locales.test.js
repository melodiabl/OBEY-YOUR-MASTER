const test = require('node:test')
const assert = require('node:assert/strict')
const { catalogs, t, localeFor } = require('../handlers/i18n')
const { catRows, catEmbed, addedEmbed } = require('../handlers/music/playui')
const song = { encoded: 'song', info: { title: 'Song', author: 'Artist', length: 10000, uri: 'https://example.com/song', totalTracks: 4 } }
function flatten(object, prefix = '') { return Object.entries(object).flatMap(([k,v]) => typeof v === 'object' ? flatten(v, prefix+k+'.') : [[prefix+k, v]]) }
test('all new JSON locales have the same keys and placeholders', () => {
  const es = new Map(flatten(catalogs.es)), en = new Map(flatten(catalogs.en))
  assert.deepEqual([...es.keys()], [...en.keys()])
  for (const [key,value] of es) assert.deepEqual([...(value.match(/\{\w+\}/g)||[])].sort(), [...(en.get(key).match(/\{\w+\}/g)||[])].sort(), key)
  assert.equal(t('en-US','music.savedFrom',{server:'OBEY'}),'Saved from OBEY')
  assert.equal(t('de','common.cancel'),'Cancelar')
  assert.throws(()=>t('es','music.savedFrom'), /Missing translation variable/)
  assert.throws(()=>t('es','__proto__.x'), /Unknown translation/)
  assert.equal(localeFor({settings:{get:()=> 'en'}},'guild'),'en')
})
test('music selector preserves IDs and values while separating image emoji from labels', () => {
  const rows = catRows('albums',[song],'test','en-US').map(r=>r.toJSON())
  const select=rows[0].components[0], buttons=rows[1].components
  assert.equal(select.custom_id,'test_pick');assert.equal(select.options[0].value,'0')
  assert.equal(select.options[0].label,'1. Song');assert.equal(select.placeholder,'Choose an album…')
  assert.equal(buttons[0].label,'Tracks');assert.equal(buttons[1].label,'Albums');assert.equal(buttons[2].custom_id,'test_cancel')
  assert.ok(buttons.every(b=> b.emoji && !b.label.includes('<:')))
  assert.match(catEmbed('albums',[song],'query','en').toJSON().footer.text,/1 albums/)
  assert.match(addedEmbed(song.info,{isNow:true,added:1},'123','en').toJSON().title,/Now playing/)
})
test('music grab translates the private and respects blocked-DM result', async () => {
  const command=require('../commands/Music/grab')
  const replies=[],privates=[]
  const client={settings:{get:()=> 'en'},music:{getState:()=>({currentTrack:song})}}
  const message={guild:{id:'guild',name:'Server'},author:{send:async payload=>privates.push(payload)},reply:async payload=>replies.push(payload)}
  await command.run(client,message)
  assert.match(privates[0].embeds[0].toJSON().description,/Open link/)
  assert.match(replies[0].embeds[0].toJSON().description,/direct message/)
  message.author.send=async()=>{throw new Error('blocked')};replies.length=0
  await command.run(client,message)
  assert.match(replies[0].embeds[0].toJSON().description,/could not send/)
})
