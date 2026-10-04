const { createCanvas } = require('@napi-rs/canvas')
const names = ['abandon','affect','airpods','america','armor','bed','brazzers','byemom','cancer','changemymind','communism','corporate','cry','dab','delete','disability','door','drake','egg','emergencymeeting','excuseme','facts','failure','fakenews','floor','godwhy','hitler','ipad','jail','keepdistance','note','notstonks','obama','ohno','piccolo','roblox','satan','savehumanity','shit','stonks','stroke','tornado','trash','tweet','violence','walking','wanted','whodidthis','youtube']
function native(name, text, second) {
  const canvas=createCanvas(800,500),ctx=canvas.getContext('2d')
  ctx.fillStyle='#0d0d1a';ctx.fillRect(0,0,800,500)
  ctx.font='bold 34px sans-serif';ctx.fillStyle='#e8e8f4'
  function lines(value,x,y,width){let line='';for(const word of String(value||'').slice(0,800).split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width){ctx.fillText(line,x,y);y+=42;line=word}else line=next}ctx.fillText(line,x,y)}
  if(name==='drake'){
    const [no,yes]=String(text).split('|');ctx.fillStyle='#ed4245';ctx.fillRect(0,0,170,240);ctx.fillStyle='#57f287';ctx.fillRect(0,260,170,240)
    ctx.fillStyle='#fff';ctx.fillText('NO',45,130);ctx.fillText('SÍ',50,390);lines(no,210,100,540);lines(yes||'Sí',210,360,540)
  }else if(name==='tornado'){
    ctx.strokeStyle='#9b59b6';ctx.lineWidth=8;for(let i=0;i<14;i++){ctx.beginPath();ctx.ellipse(400,140+i*20,250-i*16,10,0,0,Math.PI*2);ctx.stroke()}lines(text,40,55,700);lines(second,40,470,700)
  }else{
    const up=name==='stonks';ctx.fillText(up?'STONKS':'NOT STONKS',40,60);ctx.strokeStyle=up?'#57f287':'#ed4245';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(100,up?330:140);ctx.lineTo(250,up?270:220);ctx.lineTo(390,up?300:190);ctx.lineTo(640,up?120:350);ctx.stroke();lines(text,40,420,700)
  }
  return canvas.toBuffer('image/png')
}
async function avatarData(value) {
  if(Buffer.isBuffer(value))return value.toString('base64')
  const url=new URL(value)
  if(url.protocol!=='https:'||!['cdn.discordapp.com','media.discordapp.net','cdn.discord.com'].includes(url.hostname))throw new Error('Usa un avatar válido de Discord.')
  const response=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:'error'})
  if(!response.ok)throw new Error('No se pudo descargar el avatar.')
  if(Number(response.headers.get('content-length'))>5000000)throw new Error('El avatar es demasiado grande.')
  const reader=response.body.getReader(),chunks=[];let size=0
  while(true){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>5000000){await reader.cancel();throw new Error('El avatar es demasiado grande.')}chunks.push(Buffer.from(value))}
  return Buffer.concat(chunks).toString('base64')
}
function createMemeService(baseUrl='http://127.0.0.1:3203') {
  const service={}
  for(const name of names) service[name]=async(...args)=>{
    if(['stonks','notstonks','drake','tornado'].includes(name))return native(name,...args)
    const avatars=[],texts=[]
    for(const arg of args){if(Buffer.isBuffer(arg)||/^https?:\/\//i.test(String(arg)))avatars.push(await avatarData(arg));else texts.push(String(arg||'').slice(0,1500))}
    const body={avatars,text:texts.at(-1)||'',text2:texts[1],usernames:texts.slice(0,2)}
    const endpoint=name==='keepdistance'?'keepurdistance':name
    const response=await fetch(`${baseUrl}/generate/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)})
    if(!response.ok)throw new Error('No se pudo generar la imagen. Revisa los argumentos o inténtalo de nuevo.')
    return Buffer.from(await response.arrayBuffer())
  }
  return service
}
module.exports={createMemeService,names,native,avatarData}
