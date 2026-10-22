const fs=require('fs'),path=require('path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
for(const d of ['icons','sources','motion','posters','frames'])fs.mkdirSync(path.join(root,d),{recursive:true});
const gold='#FFD36F',blue='#66A8FF',navy='#101D36';
const stroke=(body,color=gold,width=3.1)=>`<g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
const bubble='<path d="M15 14h28a5 5 0 0 1 5 5v17a5 5 0 0 1-5 5H26l-11 8v-8a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5Z"/><path d="M19 23h20M19 31h13"/>';
const person='<circle cx="28" cy="22" r="8"/><path d="M12 47v-4c0-8 7-13 16-13s16 5 16 13v4"/>';
const voice='<path d="M11 26h9l12-10v32L20 38h-9Z"/><path d="M40 24q8 8 0 16"/>';
const role='<path d="M12 16h24l12 16-12 16H12Z"/><circle cx="21" cy="32" r="3"/>';
const channel='<path d="M25 12 17 49M41 12 33 49M13 25h36M10 39h36"/>';
const file='<path d="M15 10h23l11 12v29H15Z"/><path d="M37 10v13h12M23 33h17M23 42h10"/>';
const shield='<path d="M32 9 51 17v15c0 13-19 23-19 23S13 45 13 32V17Z"/>';
const ticket='<path d="M12 17h40v10a6 6 0 0 0 0 12v10H12V39a6 6 0 0 0 0-12Z"/><path d="M35 18v5m0 5v5m0 5v5"/>';
const badge=(kind)=>{
 const symbol={add:'<path d="M44 49h12M50 43v12"/>',remove:'<path d="M44 49h12"/>',delete:'<path d="m45 44 10 10m0-10-10 10"/>',edit:'<path d="m44 53 2-6 7-7 5 5-7 7Z"/>',join:'<path d="M42 49h15m-5-5 5 5-5 5"/>',leave:'<path d="M58 49H43m5-5-5 5 5 5"/>',move:'<path d="M42 45h15m-4-4 4 4-4 4M58 53H43m4-4-4 4 4 4"/>',check:'<path d="m43 49 5 5 9-11"/>',clock:'<circle cx="50" cy="49" r="7"/><path d="M50 44v6h4"/>',pin:'<path d="m44 44 9-3 3 9-4-1-3 5-2-6Z"/>',lock:'<rect x="43" y="48" width="14" height="10" rx="2"/><path d="M46 48v-4a4 4 0 0 1 8 0v4"/>',restore:'<path d="M44 46a7 7 0 1 1-1 6M44 40v7h7"/>'}[kind];
 return `<circle cx="50" cy="49" r="13" fill="${navy}"/>`+stroke(symbol,blue,2.8);
};
const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${navy}"/>${body}</svg>`;
function motion(kind,t){
 const wave=(Math.sin(t*Math.PI*2)+1)/2;
 if(kind==='log-recording')return stroke(file)+`<circle cx="47" cy="45" r="${8+wave*3}" fill="${blue}" opacity="${.35+wave*.5}"/><circle cx="47" cy="45" r="5" fill="${blue}"/>`;
 if(kind==='sync')return `<g transform="rotate(${t*360} 32 32)">`+stroke('<path d="M14 26a19 19 0 0 1 33-6M47 12v10H37M50 38a19 19 0 0 1-33 6M17 52V42h10"/>',blue)+'</g>';
 if(kind==='security-scan')return stroke(shield)+stroke(`<path d="M21 ${22+wave*19}h22"/>`,blue,3.2);
 if(kind==='upload')return stroke('<path d="M17 45h-1a9 9 0 0 1-1-18 14 14 0 0 1 27-4 11 11 0 0 1 6 21"/>')+`<g transform="translate(0 ${wave*-5})">`+stroke('<path d="M32 48V29m-8 8 8-8 8 8"/>',blue)+'</g>';
 if(kind==='reconnect')return stroke('<path d="M9 20v16c0 5 5 9 10 9h5M55 20v16c0 5-5 9-10 9h-5"/>')+stroke(`<path d="M${20+wave*3} 40v10M${44-wave*3} 40v10M27 45h10"/>`,blue,4);
 if(kind==='attention')return `<g transform="rotate(${Math.sin(t*Math.PI*2)*9} 32 18)">`+stroke('<path d="M16 43h32l-5-7V25c0-7-4-12-11-12s-11 5-11 12v11ZM28 51h8M32 8v5"/>')+'</g>'+`<circle cx="47" cy="18" r="4" fill="${blue}" opacity="${.35+.65*wave}"/>`;
}
(async()=>{
 const names=['log-recording','sync','security-scan','upload','reconnect','attention'];
 for(const name of names){
  const src=svg(motion(name,.1));
  fs.writeFileSync(path.join(root,'sources','motion-'+name+'.svg'),src);
  await sharp(Buffer.from(src)).png().toFile(path.join(root,'posters','motion-'+name+'.png'));
  const dir=path.join(root,'frames',name);fs.mkdirSync(dir,{recursive:true});
  for(let i=0;i<32;i++)await sharp(Buffer.from(svg(motion(name,i/32)))).png().toFile(path.join(dir,String(i).padStart(3,'0')+'.png'));
 }
 console.log('Six motion sequences exported; encode with tools/encode-gif.py, refresh hashes and exclude frames from the release.');
})().catch(e=>{console.error(e.message);process.exit(1)});
