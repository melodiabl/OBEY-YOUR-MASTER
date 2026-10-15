#!/usr/bin/env node
// Read-only static screening: no command require(), token use or external writes.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto')
const root = path.resolve(__dirname,'..')
const excluded = new Set(['node_modules','.git','backups','.runtime','dist','build','coverage'])
const extensions = new Set(['.js','.cjs','.mjs','.json','.ejs','.html','.css','.yaml','.yml','.ts','.tsx','.jsx'])
const patterns = {
 customEmoji:/<a?:[A-Za-z0-9_]+:\d{17,20}>/g,
 emojiCdn:/cdn\.discordapp\.com\/emojis\//g,
 privateSend:/\b(?:author|user|member|originaluser|warnmember|kickmember)\.send\s*\(/g,
 legacyTranslation:/\bclient\.la\b/g,
 evaluatedText:/\beval\s*\(/g,
 translatedText:/\b(?:t|translate)\s*\(/g,
 uiText:/\.(?:setTitle|setDescription|setLabel|setPlaceholder|reply|send|followUp)\s*\(/g,
 externalBrand:/paypal\.me\/|patreon\.com\/|bero-host\.de|\bTomato6966\b|\bLAVA MUSIC\b/g,
 collector:/createMessageComponentCollector\s*\(/g,
}
const report={scope:'static_screening_not_functional_review',files:[],commands:[],totals:{},limitations:['Regex matches include comments and do not resolve dynamic strings, aliases or call graphs.','Syntax compilation is for CommonJS JavaScript and JSON only; no module is executed.','A screened file is not an implemented or behavior-tested module.']}
function walk(dir) {
 for(const item of fs.readdirSync(dir,{withFileTypes:true})) {
  if(item.name.startsWith('.') || excluded.has(item.name) || item.isSymbolicLink())continue
  const full=path.join(dir,item.name)
  if(item.isDirectory()){if(path.relative(root,full).split(path.sep).join('/') !== 'docs/audit')walk(full);continue}
  const ext=path.extname(item.name);if(!extensions.has(ext))continue
  const source=fs.readFileSync(full,'utf8'),file=path.relative(root,full).split(path.sep).join('/')
  const row={file,sha256:crypto.createHash('sha256').update(source).digest('hex'),status:'static_screened_not_behavior_verified',signals:{}}
  try {
   if(ext==='.json'){JSON.parse(source);row.syntax='json_valid'}
   else if(ext==='.js'||ext==='.cjs'){new vm.Script(require('node:module').wrap(source.replace(/^#![^\n]*/, '')),{filename:file});row.syntax='commonjs_compiles'}
   else row.syntax='not_compiled'
  }catch(error){row.syntax='review_required';row.error=error.name}
  for(const [name,re] of Object.entries(patterns)){
   re.lastIndex=0;const lines=[...source.matchAll(re)].map(m=>source.slice(0,m.index).split('\n').length)
   if(lines.length){row.signals[name]=lines;report.totals[name]=(report.totals[name]||0)+lines.length}
  }
  if(/^(commands|slashCommands)\/[^/]+\/[^/]+\.js$/.test(file))report.commands.push({file,category:file.split('/')[1],kind:file.split('/')[0],syntax:row.syntax,signals:row.signals,reviewStatus:'pending_behavior_review'})
  report.files.push(row)
 }
}
walk(root)
const catalogs={}
function flatten(value, prefix='') {
 const result={}
 if(!value||typeof value!=='object')return result
 for(const [key,item] of Object.entries(value)){
  const location=prefix?prefix+'.'+key:key
  if(typeof item==='string')result[location]=item
  else Object.assign(result,flatten(item,location))
 }
 return result
}
for(const file of fs.readdirSync(path.join(root,'languages')).filter(f=>f.endsWith('.json')))catalogs[file.slice(0,-5)]=flatten(JSON.parse(fs.readFileSync(path.join(root,'languages',file),'utf8')))
const baseline=catalogs.en||catalogs.es
const locales={scope:'legacy_catalog_schema_and_placeholder_screening_not_translation_approval',languages:{},entries:[]}
const placeholders=value=>[...new Set((value.match(/\$?\{[\p{L}_][\p{L}\p{N}_.]*\}/gu)||[]))].sort()
for(const [lang,values] of Object.entries(catalogs))locales.languages[lang]={keys:Object.keys(values).length,templateSyntaxErrors:Object.entries(values).filter(([key,value])=>{if(!value.startsWith('`')||!value.endsWith('`'))return false;try{new vm.Script('('+value+')');return false}catch{return true}}).map(([key])=>key),missing:Object.keys(baseline).filter(k=>!Object.hasOwn(values,k)),extra:Object.keys(values).filter(k=>!Object.hasOwn(baseline,k)),placeholderMismatches:Object.keys(baseline).filter(k=>Object.hasOwn(values,k)&&JSON.stringify(placeholders(values[k]))!==JSON.stringify(placeholders(baseline[k])))}
for(const [key,source] of Object.entries(baseline))locales.entries.push({key,placeholders:placeholders(source),status:'requires_context_review',values:Object.fromEntries(Object.entries(catalogs).map(([lang,data])=>[lang,data[key]??null]))})
const out=path.join(root,'docs/audit');fs.mkdirSync(out,{recursive:true})
fs.writeFileSync(path.join(out,'renovation.json'),JSON.stringify(report,null,2)+'\n')
fs.writeFileSync(path.join(out,'translation-migration.json'),JSON.stringify(locales,null,2)+'\n')
console.log(JSON.stringify({files:report.files.length,commands:report.commands.length,syntaxReview:report.files.filter(f=>f.syntax==='review_required').map(f=>f.file),signals:report.totals,legacyLocales:Object.fromEntries(Object.entries(locales.languages).map(([k,v])=>[k,{keys:v.keys,missing:v.missing.length,placeholderMismatches:v.placeholderMismatches.length}]))},null,2))
