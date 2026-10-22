const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {Resvg}=require('@resvg/resvg-js');
const stage=path.resolve(__dirname,'../../../..');
const root=path.resolve(__dirname,'..');const frames=path.join(root,'.frames-extension');
fs.mkdirSync(path.join(root,'new'),{recursive:true});fs.mkdirSync(frames,{recursive:true});
const definitions=[
['previous','Anterior','Previous','music','icon.previous'],['skip','Siguiente pista','Next track','music','icon.skip'],['stop','Detener','Stop','music','icon.stop'],['volume-down','Bajar volumen','Volume down','music','icon.volume-down'],['volume-up','Subir volumen','Volume up','music','icon.volume-up'],['mute','Silenciar','Mute','music','icon.mute'],['queue','Cola','Queue','music','icon.queue'],['lyrics','Letras','Lyrics','music','icon.lyrics'],['search','Buscar','Search','utilities','icon.search'],['album','Álbum','Album','music','icon.album'],['radio','Radio','Radio','music','icon.radio'],['repeat-one','Repetir pista','Repeat track','music','icon.repeat-one'],
['claim','Asignar','Assign','tickets','icon.claim'],['close','Cerrar','Close','tickets','icon.close'],['reopen','Reabrir','Reopen','tickets','icon.reopen'],['transcript','Transcripción','Transcript','tickets','icon.transcript'],['archive','Archivar','Archive','tickets','icon.archive'],['rating','Valorar atención','Rate support','tickets','ticket.icon.valoracion'],['report','Reporte','Report','tickets','ticket.icon.reporte'],['support','Soporte','Support','tickets','ticket.icon.ayuda'],['technical','Ayuda técnica','Technical support','tickets','ticket.icon.tecnico'],['wait','En espera','Waiting','tickets','ticket.icon.espera'],
['error','Error','Error','shared','icon.error'],['warning','Advertencia','Warning','shared','icon.warning'],['info','Información','Information','utilities','icon.info'],['permissions','Permisos','Permissions','security','icon.lock'],['empty','Sin contenido','Empty','shared','scene.empty-symbol'],['expired','Sesión caducada','Session expired','shared','state.expired'],['offline','Sin conexión','Offline','shared','state.offline'],['reconnect','Reconectar','Reconnect','music','icon.connection'],
['welcome','Bienvenida','Welcome','welcome','icon.join'],['farewell','Despedida','Goodbye','welcome','icon.exit'],['roles','Roles','Roles','roles','icon.roles'],['moderation','Moderación','Moderation','moderation','icon.gavel'],['logs','Registros','Logs','logs','icon.document'],['levels','Niveles','Levels','levels','icon.levels'],['profile','Perfil','Profile','profiles','icon.profile'],['coins','Economía','Economy','economy','icon.coins'],['gift','Regalo','Gift','economy','icon.gift'],['games','Juegos','Games','fun','icon.game'],['giveaways','Sorteos','Giveaways','giveaways','icon.medal'],['suggestions','Sugerencias','Suggestions','suggestions','icon.idea'],['reminders','Recordatorios','Reminders','reminders','icon.calendar'],['messages','Mensajes','Messages','messages','icon.conversation'],['automation','Automatización','Automation','automation','icon.automation'],['feeds','Fuentes y avisos','Feeds','feeds','icon.feed'],['analytics','Estadísticas','Analytics','analytics','icon.chart'],['applications','Solicitudes','Applications','applications','icon.document'],['architect','Estructura','Structure','architect','icon.blueprint'],['templates','Plantillas','Templates','templates','icon.template'],['settings','Configuración','Settings','shared','icon.settings'],['edit','Editar','Edit','shared','icon.edit'],['save','Guardar','Save','shared','icon.save'],['delete','Eliminar','Delete','shared','icon.delete'],['voice','Voz','Voice','voice','icon.microphone'],['channel','Canal','Channel','voice','icon.channel'],['members','Miembros','Members','shared','icon.roles'],['notify-off','Avisos desactivados','Notifications off','feeds','icon.notify-off'],['back','Página anterior','Previous page','utilities','icon.page-previous'],['next','Página siguiente','Next page','utilities','icon.page-next'],['language','Idioma','Language','shared','icon.globe'],['upload','Subir archivo','Upload file','shared','icon.export'],['send','Enviar','Send','messages','icon.send'],['image','Imagen','Image','cards','icon.image'],['help','Ayuda','Help','utilities','icon.help']];
const animated=new Set(['search','reopen','transcript','support','technical','wait','reconnect','logs','coins','gift','reminders','automation','feeds','applications','save','upload']);
const gold='#FFD36F',blue='#66A8FF',navy='#101D36';
const P=(d,c=gold,w=7)=>`<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const C=(x,y,r,c=gold,fill='none',w=6)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${c}" stroke-width="${w}"/>`;
const R=(x,y,w,h,rx=8,c=gold,fill='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${c}" stroke-width="6"/>`;
const person=(x=58,y=49)=>C(x,y,13)+P(`M${x-24} ${y+49} V${y+34} Q${x-24} ${y+15} ${x} ${y+15} Q${x+24} ${y+15} ${x+24} ${y+34} V${y+49}`);
const doc=()=>P('M33 21 H77 L97 41 V107 H33 Z')+P('M77 21 V42 H97',blue,5);
function body(slug,t,move){let b='';const a=2*Math.PI*t;
 switch(slug){
 case 'previous':b=P('M34 28 V100')+P('M94 29 L45 64 L94 99 Z');break;
 case 'skip':b=P('M94 28 V100')+P('M34 29 L83 64 L34 99 Z');break;
 case 'stop':b=R(33,33,62,62,10,gold,gold);break;
 case 'volume-down':case 'volume-up':case 'mute':b=P('M25 51 H41 L63 32 V96 L41 77 H25 Z');b+=slug==='mute'?P('M82 51 L104 77 M104 51 L82 77',blue,6):P('M80 49 Q95 64 80 79',blue,6)+(slug==='volume-up'?P('M93 34 Q120 64 93 94',blue,6):'');break;
 case 'queue':b=P('M26 35 H100 M26 55 H86 M26 75 H70')+`<path d="M85 72 L108 87 L85 102 Z" fill="${blue}"/>`;break;
 case 'lyrics':b=P('M22 31 H78 M22 51 H68 M22 71 H51')+P('M82 96 V58 L105 53 V88')+C(74,96,8,blue,blue,2)+C(97,88,8,blue,blue,2);break;
 case 'search':b=C(55,54,28)+P('M77 77 L105 105',blue,9);break;
 case 'album':b=R(24,24,80,80,8)+C(64,64,26,blue,'none',5)+C(64,64,6,gold,gold,3);break;
 case 'radio':b=R(23,46,82,58,10)+P('M34 44 L94 22')+C(46,76,11,blue)+P('M73 67 H91 M73 83 H91',gold,5);break;
 case 'repeat-one':b=P('M28 48 Q28 30 48 30 H99 M85 17 L100 30 L85 44')+P('M100 80 Q100 98 80 98 H29 M43 85 L28 98 L43 111',blue)+P('M57 57 L67 49 V80 M57 80 H77',gold,5);break;
 case 'claim':b=person(47,43)+P('M83 69 L93 80 L111 58',blue,7);break;
 case 'close':b=P('M34 34 L94 94 M94 34 L34 94');break;
 case 'reopen':b=P('M32 46 A36 36 0 1 1 29 82 M27 25 V49 H51')+P('M52 65 H79',blue,5);break;
 case 'transcript':case 'logs':case 'applications':b=doc()+P('M47 58 H81 M47 74 H81 M47 90 H68',blue,5);if(slug==='applications')b+=P('M73 99 L99 73 L108 82 L82 108 Z',gold,5);break;
 case 'archive':b=R(25,37,78,65,7)+R(20,26,88,18,4)+P('M50 64 H78',blue,6);break;
 case 'rating':b=P('M25 29 H103 V88 H63 L43 107 V88 H25 Z')+P('M48 59 L61 72 L84 46',blue);break;
 case 'report':case 'warning':b=P('M64 22 L111 104 H17 Z')+P('M64 50 V73',blue)+C(64,88,3,blue,blue,1);break;
 case 'support':b=P('M24 67 V59 A40 40 0 0 1 104 59 V81 Q104 103 79 103')+R(23,61,15,29,6,blue)+R(90,61,15,29,6,blue)+P('M66 103 H81',gold,7);break;
 case 'technical':b=P('M78 24 Q57 21 51 43 L57 57 L24 91 Q17 101 27 108 Q36 115 45 104 L77 72 L92 78 Q115 70 108 48 L91 62 L77 49 L88 26 Z');break;
 case 'wait':case 'expired':b=C(64,64,41)+P('M64 36 V65 L84 77',blue);if(slug==='expired')b+=C(99,97,17,navy,navy,1)+P('M91 89 L107 105 M107 89 L91 105',blue,5);break;
 case 'error':b=C(64,64,41)+P('M48 48 L80 80 M80 48 L48 80','#F4677C',8);break;
 case 'info':b=C(64,64,41)+P('M64 57 V85',blue)+C(64,41,3,blue,blue,1);break;
 case 'permissions':b=R(29,57,70,48,8)+P('M42 57 V43 A22 22 0 0 1 86 43 V57')+P('M64 76 V87',blue,6);break;
 case 'empty':b=P('M27 36 H101 L112 94 H16 Z')+P('M20 74 H45 L51 86 H77 L83 74 H108',blue,6);break;
 case 'offline':case 'reconnect':b=P('M28 50 Q64 20 100 50 M42 67 Q64 48 86 67',gold,7)+C(64,88,5,blue,blue,1);if(slug==='offline')b+=P('M23 22 L105 105','#F4677C',7);break;
 case 'welcome':case 'farewell':b=person(49,44)+P(slug==='welcome'?'M85 57 H109 M97 45 V69':'M83 57 H110 M100 46 L111 57 L100 68',blue,6);break;
 case 'roles':b=R(28,25,72,80,12)+C(64,52,12,blue)+P('M45 87 Q64 61 83 87',gold,6);break;
 case 'moderation':b=P('M59 26 L89 56 M49 36 L79 66 M47 33 L61 19 L96 54 L82 68 Z')+P('M64 55 L31 90',blue,10)+P('M61 106 H108 M70 95 H100',gold,6);break;
 case 'levels':case 'analytics':b=P('M22 102 H108',blue,5)+R(30,71,14,29,3)+R(57,50,14,50,3)+R(84,27,14,73,3);break;
 case 'profile':b=R(24,20,80,88,12)+C(64,48,14,blue)+P('M41 91 Q64 61 87 91',gold,6);break;
 case 'coins':b=`<ellipse cx="50" cy="51" rx="29" ry="13" fill="none" stroke="${gold}" stroke-width="6"/>`+P('M21 52 V75 Q50 99 79 75 V52')+P('M35 87 V97 Q68 117 102 95 V72',blue,6)+`<ellipse cx="75" cy="72" rx="27" ry="12" fill="none" stroke="${blue}" stroke-width="6"/>`;break;
 case 'gift':b=R(28,56,72,52,5)+R(21,39,86,20,4)+P('M64 40 V107',blue)+P('M64 38 Q21 40 34 21 Q49 8 64 38 Q81 7 95 22 Q108 41 64 38',gold,6);break;
 case 'games':b=P('M43 40 H85 Q105 40 112 91 Q115 109 99 100 L80 82 H48 L29 100 Q13 109 16 91 Q23 40 43 40 Z')+P('M39 51 V72 M29 61 H49',blue,6)+C(85,57,3,blue,blue,1)+C(97,69,3,blue,blue,1);break;
 case 'giveaways':b=P('M42 24 H86 V47 Q86 70 64 76 Q42 70 42 47 Z M42 32 H24 Q24 62 46 62 M86 32 H104 Q104 62 82 62')+P('M64 77 V101 M47 105 H81',blue,7);break;
 case 'suggestions':b=P('M45 87 Q44 76 36 64 A33 33 0 1 1 92 64 Q84 76 83 87 Z')+P('M49 102 H79 M54 114 H74',blue,6);break;
 case 'reminders':b=R(24,31,80,74,10)+P('M42 20 V42 M86 20 V42 M25 53 H103',blue,6)+P('M43 72 H55 M73 72 H85 M43 89 H55',gold,5);break;
 case 'messages':b=P('M22 26 H106 V89 H58 L36 108 V89 H22 Z')+P('M39 47 H89 M39 64 H78',blue,6);break;
 case 'automation':b=P('M37 31 H64 V95 H37 M64 64 H94',gold,6)+C(29,31,10,blue)+C(29,95,10,blue)+C(102,64,10,blue);break;
 case 'feeds':b=P('M29 24 Q104 24 104 99 M29 49 Q79 49 79 99',gold,8)+C(31,97,7,blue,blue,1);break;
 case 'architect':b=R(21,26,31,31,4)+R(76,26,31,31,4)+R(48,82,31,31,4)+P('M36 57 V70 H92 V57 M64 70 V82',blue,5);break;
 case 'templates':b=R(22,20,64,75,8,blue)+R(42,38,64,74,8,gold,navy)+P('M55 59 H93 M55 77 H84 M55 95 H77',blue,5);break;
 case 'settings':b=P('M24 36 H104 M24 64 H104 M24 92 H104',gold,6)+C(49,36,9,blue,navy,5)+C(82,64,9,blue,navy,5)+C(45,92,9,blue,navy,5);break;
 case 'edit':b=P('M26 81 L82 25 L103 46 L47 102 L25 105 Z M72 35 L93 56',gold,7);break;
 case 'save':b=P('M27 22 H86 L104 40 V107 H27 Z')+R(44,22,37,27,2,blue)+R(43,72,45,35,2);break;
 case 'delete':b=P('M25 38 H103 M47 24 H81 M35 39 L40 106 H88 L93 39')+P('M55 57 V90 M73 57 V90',blue,5);break;
 case 'voice':b=R(47,20,34,58,16)+P('M32 57 V64 A32 32 0 0 0 96 64 V57 M64 96 V112 M48 112 H80',blue,6);break;
 case 'channel':b=P('M50 22 L38 106 M89 22 L77 106 M24 49 H110 M20 82 H106');break;
 case 'members':b=person(54,44)+P('M82 31 A13 13 0 0 1 82 57 M88 68 Q108 69 108 93',blue,6);break;
 case 'notify-off':b=P('M36 80 V55 Q36 31 64 31 Q92 31 92 55 V80 L101 92 H27 Z M51 105 H77')+P('M22 21 L106 106',blue,7);break;
 case 'back':case 'next':b=P(slug==='back'?'M96 64 H29 M56 36 L28 64 L56 92':'M32 64 H99 M72 36 L100 64 L72 92');break;
 case 'language':b=C(64,64,42)+`<ellipse cx="64" cy="64" rx="18" ry="42" fill="none" stroke="${blue}" stroke-width="5"/>`+P('M23 64 H105 M31 42 H97 M31 86 H97',gold,4);break;
 case 'upload':b=P('M37 86 H28 Q9 79 22 62 Q27 56 35 56 Q30 24 64 25 Q92 25 94 54 Q118 52 115 76 Q112 87 96 87')+P('M64 108 V60 M48 76 L64 59 L80 76',blue,7);break;
 case 'send':b=P('M18 25 L112 64 L18 104 L34 64 Z M34 64 H93',gold,7);break;
 case 'image':b=R(23,24,82,80,10)+C(47,48,9,blue,blue,1)+P('M24 91 L47 69 L62 83 L80 58 L104 90',gold,6);break;
 case 'help':b=P('M43 43 Q43 18 66 21 Q94 21 90 44 Q88 55 73 63 Q64 69 64 81')+C(64,102,4,blue,blue,1);break;
 default:throw Error(slug);
 }
 if(move){
  if(['reopen','technical','automation'].includes(slug))b=`<g transform="rotate(${slug==='reopen'?360*t:8*Math.sin(a)} 64 64)">${b}</g>`;
  else if(['support','gift'].includes(slug))b=`<g transform="rotate(${5*Math.sin(a)} 64 64)">${b}</g>`;
  else if(['transcript','logs','applications'].includes(slug))b+=P(`M45 ${53+43*t} H86`,blue,4);
  else if(slug==='wait')b=C(64,64,41)+`<g transform="rotate(${360*t} 64 64)">${P('M64 36 V64 L80 74',blue)}</g>`;
  else if(['upload','save'].includes(slug))b=`<g transform="translate(0 ${-4*Math.sin(a)})">${b}</g>`;
  else b+=C(64+48*Math.cos(a),64+48*Math.sin(a),3,blue,blue,1);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${b}</svg>`;
}
const entries=[];
definitions.forEach(([slug,name,en,module,canonical],i)=>{
 const id='B'+String(i+1).padStart(2,'0'),dir=path.join(root,'new',slug);fs.mkdirSync(dir,{recursive:true});const s=body(slug,0,false);fs.writeFileSync(path.join(dir,'icon.svg'),s);
 for(const size of [128,256])fs.writeFileSync(path.join(dir,`icon-${size}.png`),new Resvg(s,{fitTo:{mode:'width',value:size}}).render().asPng());
 if(animated.has(slug)){fs.mkdirSync(path.join(frames,slug),{recursive:true});for(let n=0;n<20;n++)fs.writeFileSync(path.join(frames,slug,`${String(n).padStart(2,'0')}.png`),new Resvg(body(slug,n/20,true)).render().asPng())}
 const result={id,slug,name,nameEn:en,module,canonicalProposal:canonical,approvedByUser:false,status:'new-extension-review-required',runtimeRegistered:false,applicationEmojiId:null,icon:`new/${slug}/icon-128.png`,svg:`new/${slug}/icon.svg`,motion:animated.has(slug)?`new/${slug}/motion.gif`:null,motionRole:['gift'].includes(slug)?'confirmed-celebration':slug==='wait'?'waiting':'pending',resultPolicy:'confirmed-domain-state-and-text; use A11 only for confirmation messages, not as a universal control icon'};entries.push(result);
});
fs.writeFileSync(path.join(root,'extension.json'),JSON.stringify({scope:'staged-materials-not-runtime',entries},null,2));console.log(JSON.stringify({staticFamilies:entries.length,motionFamilies:entries.filter(e=>e.motion).length}));
