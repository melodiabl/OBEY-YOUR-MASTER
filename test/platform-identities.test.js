const test=require('node:test'),assert=require('node:assert/strict')
const {platform,platforms}=require('../handlers/music/platforms')
const {catalog}=require('../handlers/assets/production')
const {semanticKeys}=require('../handlers/assets/legacy-config')
const web=require('../assets/obey/web-icon-map.json')
const assets={markup:key=>'own:'+key,emoji:()=>({id:'123456789012345678'}),imageURL:key=>'https://example.test/'+key+'.png'}
test('each musical source identifies its brand instead of a colored piece or generic music icon',()=>{
 for(const [source,data]of Object.entries(platforms)){
  const value=platform('',source,assets)
  assert.equal(value.key,data.key);assert.ok(value.key.startsWith('brand.'));assert.ok(catalog.entries[value.key]);assert.equal(value.emoji,'own:'+value.key)
 }
})
test('URL detection distinguishes YouTube Music and rejects unrelated host substrings',()=>{
 assert.equal(platform('https://music.youtube.com/watch?v=a','',assets).key,'brand.youtubemusic')
 assert.equal(platform('https://open.spotify.com/track/a','youtube',assets).key,'brand.spotify')
 assert.equal(platform('https://notspotify.example/audio','unknown',assets).name,'Audio')
 assert.equal(platform('https://spotify.com.example/audio','unknown',assets).name,'Audio')
 assert.equal(platform('','__proto__',assets).name,'Audio')
})
test('missing upload IDs show the platform name without pretending another icon is its logo',()=>{
 const value=platform('','spotify',{...assets,emoji:()=>({name:'🔗'}),imageURL:()=>undefined})
 assert.equal(value.name,'Spotify');assert.equal(value.emoji,'');assert.equal(value.imageURL,undefined)
})
test('platform fields and web classes are separated from OBEY function icons',()=>{
 assert.equal(semanticKeys.spotify,'brand.spotify');assert.equal(semanticKeys.youtube,'brand.youtube')
 assert.equal(web.classes['fa-spotify'],'brand.spotify');assert.equal(web.classes['fa-youtube'],'brand.youtube')
 assert.equal(web.classes['fa-headphones'],'icon.headphones');assert.equal(web.classes['fa-music'],'icon.music')
})
