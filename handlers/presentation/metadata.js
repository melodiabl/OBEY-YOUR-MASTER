const { strip } = require('../assets/system')
// Normalize legacy string signatures to the discord.js v14 data objects.
function text(value,limit){let result=strip(String(value)).slice(0,limit);if(/[\uD800-\uDBFF]$/.test(result))result=result.slice(0,-1);return result}
function media(value){if(typeof value!=='string')return undefined;if(/^attachment:\/\/[\w.-]+$/.test(value))return value;try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:undefined}catch{return undefined}}
function asFooter(value,iconURL) {
 if(value==null)return null
 const data=typeof value==='object'?value:{text:value,iconURL}
 const content=text(data.text??'',2048);if(!content)return null
 return {text:content,...(media(data.iconURL)?{iconURL:media(data.iconURL)}:{})}
}
function asAuthor(value,iconURL,url) {
 if(value==null)return null
 const data=typeof value==='object'?value:{name:value,iconURL,url}
 const name=text(data.name??'',256);if(!name)return null
 return {name,...(media(data.iconURL)?{iconURL:media(data.iconURL)}:{}),...(media(data.url)?{url:media(data.url)}:{})}
}
module.exports={asFooter,asAuthor}
