const test=require('node:test'),assert=require('node:assert/strict')
const {EmbedBuilder}=require('discord.js')
const {asFooter,asAuthor}=require('../handlers/presentation/metadata')
test('legacy footer and author strings become valid v14 objects preserving public metadata',()=>{
 const embed=new EmbedBuilder().setFooter(asFooter('Guild','https://example.com/icon.png')).setAuthor(asAuthor('Member','attachment://avatar.png','https://example.com'))
 const data=embed.toJSON();assert.equal(data.footer.text,'Guild');assert.equal(data.author.name,'Member');assert.equal(data.author.icon_url,'attachment://avatar.png')
})
test('plain metadata omits custom emoji markup and credential-bearing URLs',()=>{
 assert.deepEqual(asFooter('<:old:123456789012345678> Status','https://user:secret@example.com'),{text:'Status'})
 assert.equal(asAuthor(null),null);assert.equal(asFooter(''),null)
 assert.equal(asFooter('x'.repeat(3000)).text.length,2048)
 assert.equal(asAuthor('x'.repeat(300)).name.length,256)
})
