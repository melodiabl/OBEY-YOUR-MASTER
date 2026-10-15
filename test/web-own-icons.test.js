const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const map=require('../assets/obey/web-icon-map.json')
test('every internal web icon class has an existing own asset and CSS rule',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../dashboard/public/css/obey-icons.css'),'utf8')
 const folder=path.join(__dirname,'../dashboard/public/obey-icons'),files=fs.readdirSync(folder)
 for(const [cls,key] of Object.entries(map.classes)){
  assert.ok(css.includes('i.'+cls+'{'),cls)
  assert.ok(files.some(f=>f.startsWith(key.replace('.','_')+'.')),key)
 }
 assert.ok(css.includes('prefers-reduced-motion'))
})
test('internal layouts load own icons while the public landing file remains outside this migration',()=>{
 for(const p of ['views/includes/header.ejs','views/pages/music.ejs'])assert.ok(fs.readFileSync(path.join(__dirname,'../dashboard',p),'utf8').includes('/css/obey-icons.css'))
})
