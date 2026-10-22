const fs=require('fs'),path=require('path');
const {Resvg}=require('@resvg/resvg-js');
const root=path.resolve(__dirname,'..');
const work=path.join(root,'.frames-approved');
const gold='#FFD36F',blue='#66A8FF',green='#42C87B';
const specs=[
 ['ticket','A01','Ticket','Tickets','Abriendo','Abierto'],
 ['favorito','A02','Favorito','Música · Perfil','Guardando','Guardado'],
 ['reproduccion','A03','Reproducción','Música','Reproduciendo','Pausar'],
 ['mezcla','A04','Mezclar','Música','Cambiando','Activado'],
 ['repetir','A05','Repetir','Música','Cambiando','Activado'],
 ['autoplay','A06','Autoplay','Música','Cambiando','Activado'],
 ['escudo','A07','Protección','Seguridad','Revisando','Protegido'],
 ['avisos','A08','Avisos','Notificaciones','Enviando','Enviado'],
 ['exportar','A09','Exportar','Transcripciones','Preparando','Disponible'],
 ['tarjeta','A10','Tarjeta','Bienvenida · Imágenes','Generando','Disponible'],
 ['confirmacion','A11','Confirmación','Compartido','Confirmado','Confirmado'],
 ['sincronizar','A12','Sincronizar','Configuración','Sincronizando','Actualizado']
].map(([slug,id,name,module,pending,result])=>({slug,id,name,module,pending,result,proposed:false,approvedByUser:true,status:'user-approved',animationRole:slug==='reproduccion'?'active':slug==='confirmacion'?'confirmation':'pending'}));
function svg(slug,phase,t=0){
 const a=2*Math.PI*t, anim=phase==='motion',done=phase==='result';
 const st=(c=gold,w=7)=>`stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
 const check=(x=64,y=64,s=1,c=green)=>`<path d="M ${x-17*s} ${y} l ${12*s} ${12*s} l ${25*s} ${-29*s}" ${st(c,7*s)}/>`;
 const orb=(x,y,r=4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${blue}"/>`;
 let b='';
 if(slug==='ticket'){
 b=`<g transform="rotate(-10 64 64)"><path d="M22 39 Q22 33 29 33 H99 Q106 33 106 40 V49 Q93 54 106 65 V87 Q106 94 99 94 H29 Q22 94 22 87 V75 Q35 69 22 60 Z" fill="url(#g)"/><path d="M83 41 V86" stroke="#A8772A" stroke-width="4" stroke-dasharray="3 7" stroke-linecap="round"/><path d="M37 51 H65 M37 65 H57" ${st('#101D36',5)}/>${done?check(57,73,.55,'#101D36'):''}${anim?`<path d="M35 ${43+40*t} H72" ${st(blue,4)}/>`:''}</g>`;
 }else if(slug==='favorito'){
 const z=anim?1+.055*Math.sin(a):1;
 b=`<g transform="translate(64 64) scale(${z}) translate(-64 -64)"><path d="M64 103 C49 91 23 73 23 51 C23 29 50 23 64 42 C78 23 105 29 105 51 C105 73 79 91 64 103 Z" fill="${done?'url(#g)':'none'}" ${st(gold,7)}/></g>`;
 if(anim)b+=orb(64+49*Math.cos(a),64+49*Math.sin(a),3);
 }else if(slug==='reproduccion'){
 if(done)b=`<rect x="40" y="29" width="16" height="70" rx="6" fill="url(#g)"/><rect x="72" y="29" width="16" height="70" rx="6" fill="url(#g)"/>`;
 else if(anim){for(let i=0;i<5;i++){const h=20+49*(.5+.5*Math.sin(a+i*1.3));b+=`<rect x="${25+i*17}" y="${64-h/2}" width="10" height="${h}" rx="5" fill="${i===2?blue:gold}"/>`;}}
 else b=`<path d="M47 28 Q41 25 41 33 V96 Q41 104 48 100 L100 70 Q108 65 100 60 Z" fill="url(#g)"/>`;
 }else if(slug==='mezcla'){
 b=`<path d="M22 35 H35 Q48 35 64 64 T93 94 H106 M89 79 L106 94 L89 107" ${st(gold)}/><path d="M22 94 H34 Q48 94 64 64 T93 35 H106 M89 22 L106 35 L89 49" ${st(blue)}/>`;
 if(anim)b+=orb(25+76*t,35+59*t,5);if(done)b+=`<circle cx="22" cy="112" r="5" fill="${green}"/>`;
 }else if(slug==='repetir'){
 b=`<path d="M28 49 Q28 31 48 31 H98 M84 18 L99 31 L84 45" ${st(gold)}/><path d="M100 79 Q100 97 80 97 H30 M44 84 L29 97 L44 111" ${st(blue)}/>`;
 if(anim)b+=orb(64+35*Math.cos(a),64+33*Math.sin(a),5);if(done)b+=orb(64,64,6);
 }else if(slug==='autoplay'){
 b=`<path d="M24 65 A40 40 0 1 0 42 30 M25 24 L26 46 L47 43" ${st(gold)}/><path d="M58 46 L84 64 L58 82 Z" fill="${blue}"/>`;
 if(anim)b+=orb(64+42*Math.cos(a),64+42*Math.sin(a),5);if(done)b+=`<circle cx="105" cy="103" r="7" fill="${green}"/>`;
 }else if(slug==='escudo'){
 b=`<path d="M64 20 L103 35 V62 Q103 91 64 110 Q25 91 25 62 V35 Z" fill="#101D36" ${st(gold)}/>`;
 if(done)b+=check(64,62,.85);else if(anim)b+=`<path d="M38 ${42+36*(.5+.5*Math.sin(a))} H90" ${st(blue,5)}/>`;else b+=`<path d="M64 43 V65" ${st(blue,6)}/>${orb(64,80,3)}`;
 }else if(slug==='avisos'){
 b=`<g transform="rotate(${anim?12*Math.sin(a):0} 64 31)"><path d="M35 80 V57 Q35 31 64 31 Q93 31 93 57 V80 L101 92 H27 Z" fill="none" ${st(gold)}/><path d="M64 20 V30 M52 105 Q64 114 76 105" ${st(gold,6)}/></g>`;
 if(done)b+=check(100,33,.4);else if(anim)b+=`<path d="M14 51 Q8 65 14 77 M114 51 Q120 65 114 77" ${st(blue,4)}/>`;
 }else if(slug==='exportar'){
 b=`<path d="M33 20 H79 L99 40 V108 H33 Z" fill="#101D36" ${st(gold,6)}/><path d="M79 20 V41 H99" ${st(blue,5)}/>`;
 if(done)b+=check(66,70,.8);else b+=`<g transform="translate(0 ${anim?-7*Math.sin(a):0})"><path d="M65 91 V54 M50 69 L65 53 L80 69" ${st(blue,6)}/></g>`;
 }else if(slug==='tarjeta'){
 b=`<rect x="21" y="30" width="86" height="70" rx="12" fill="#101D36" ${st(gold,6)}/><circle cx="47" cy="55" r="10" fill="${blue}"/><path d="M35 84 Q47 64 59 84 M74 51 H94 M74 65 H91 M74 79 H86" ${st(gold,5)}/>`;
 if(anim)b+=`<path d="M${29+70*t} 39 V91" stroke="${blue}" stroke-width="4" opacity=".8"/>`;if(done)b+=`<circle cx="101" cy="100" r="15" fill="#101D36"/>`+check(101,100,.45);
 }else if(slug==='confirmacion'){
 b=`<circle cx="64" cy="64" r="42" fill="#101D36" ${st(gold,6)}/>`;
 const d=anim?Math.min(1,t*2.2):1;
 b+=`<path d="M43 64 L59 80 L88 48" pathLength="1" stroke-dasharray="${d} 2" ${st(done?green:blue,8)}/>`;
 }else if(slug==='sincronizar'){
 b=`<g transform="rotate(${anim?360*t:0} 64 64)"><path d="M28 50 A38 38 0 0 1 99 47 M85 46 L101 49 L105 32" ${st(gold,7)}/><path d="M100 78 A38 38 0 0 1 29 81 M43 82 L27 79 L23 96" ${st(blue,7)}/></g>`;if(done)b+=check(64,64,.45);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none"><defs><linearGradient id="g" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="#FFE6AB"/><stop offset=".6" stop-color="#FFD36F"/><stop offset="1" stop-color="#E9AD44"/></linearGradient></defs>${b}</svg>`;
}
for(const item of specs){
 const dir=path.join(root,'approved',item.slug);fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.join(work,item.slug),{recursive:true});
 for(const phase of ['idle','result']){
  const source=svg(item.slug,phase);fs.writeFileSync(path.join(dir,phase+'.svg'),source);
  for(const size of [128,256])fs.writeFileSync(path.join(dir,`${phase}-${size}.png`),new Resvg(source,{fitTo:{mode:'width',value:size}}).render().asPng());
 }
 for(let i=0;i<32;i++)fs.writeFileSync(path.join(work,item.slug,`${String(i).padStart(2,'0')}.png`),new Resvg(svg(item.slug,'motion',i/32)).render().asPng());
 item.idle=`approved/${item.slug}/idle-128.png`;item.resultFile=`approved/${item.slug}/result-128.png`;item.motion=`approved/${item.slug}/motion.gif`;
}
fs.writeFileSync(path.join(root,'approved-regenerated.json'),JSON.stringify({status:'user-approved-assets-not-runtime-integrated',palette:{gold,blue,navy:'#101D36'},items:specs},null,2));
console.log('12 propuestas, fuentes SVG, PNG 128/256 y 384 fotogramas renderizados');
