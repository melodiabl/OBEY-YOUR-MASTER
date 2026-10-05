(function(root){
 root.initArchitectTemplates=function({request,post,state,accept,setBusy}){
  const $=id=>document.getElementById(`architect-template-${id}`)
  let catalog=null,sequence=0
  const selected=()=>[...(catalog?.official||[]),...(catalog?.private||[])].find(item=>item.id===$('choice').value)
  function update(){
   const current=state(),item=selected()
   $('fields').disabled=current.busy||!current.blueprint||!catalog
   $('save-fields').disabled=current.busy||!current.blueprint||!catalog?.storageAvailable
   $('import').disabled=current.busy||!catalog?.storageAvailable
   $('preview').disabled=current.busy||!current.blueprint||!item
   $('export').disabled=current.busy||!item
   $('delete').disabled=current.busy||!item||!catalog?.private.some(record=>record.id===item.id)
   $('description').textContent=item?`${item.description} · ${item.channelCount} canales/categorías · ${item.roleCount} roles · versión ${item.version}`:'Elige una plantilla para revisar su estructura.'
  }
  function render(){
   const previous=$('choice').value,query=$('search').value.toLocaleLowerCase();$('choice').replaceChildren()
   for(const [key,label]of[['official','Oficiales'],['private','Mis plantillas privadas']]){
    const group=document.createElement('optgroup');group.label=label
    for(const item of catalog[key].filter(item=>`${item.name} ${item.description}`.toLocaleLowerCase().includes(query)))group.append(new Option(`${item.name} · v${item.version}`,item.id))
    if(group.children.length)$('choice').append(group)
   }
   if([...$('choice').options].some(option=>option.value===previous))$('choice').value=previous
   update()
  }
  function clear(){sequence++;catalog=null;$('choice').replaceChildren();$('description').textContent='';update()}
  async function refresh(){
   const token=++sequence
   try{const body=await request('/templates');if(token!==sequence)return;catalog=body;render();$('status').textContent=body.storageAvailable?'Tus últimas 50 plantillas privadas y las bases oficiales.':'Las bases oficiales están disponibles; el almacenamiento privado no está disponible.'}
   catch(error){if(token!==sequence)return;clear();$('status').textContent=error.message}
  }
  $('search').addEventListener('input',()=>{if(catalog)render()});$('choice').addEventListener('change',update)
  $('preview').addEventListener('click',async()=>{
   const item=selected(),current=state();if(!item||current.busy||!current.blueprint)return
   setBusy(true);$('status').textContent='Preparando la propuesta de la plantilla…'
   try{const body=await post(`/templates/${encodeURIComponent(item.id)}/preview`,{blueprint:current.blueprint});accept(body);$('status').textContent=`${body.template.addedChannels} canales/categorías y ${body.template.addedRoles} roles añadidos; ${body.template.reused} recursos reutilizados. Revisa los cambios antes de confirmar.`}
   catch(error){$('status').textContent=error.message}finally{setBusy(false)}
  })
  $('save-form').addEventListener('submit',async event=>{
   event.preventDefault();const current=state();if(current.busy||!current.blueprint||!catalog?.storageAvailable)return
   setBusy(true)
   try{await post('/templates',{blueprint:current.blueprint,name:$('name').value.trim(),description:$('note').value.trim(),selection:$('selection').value});await refresh();$('status').textContent='Plantilla privada guardada. Puedes reutilizarla en tus otros servidores.'}
   catch(error){$('status').textContent=error.message}finally{setBusy(false)}
  })
  $('export').addEventListener('click',async()=>{
   const item=selected();if(!item||state().busy)return;setBusy(true)
   try{const body=await request(`/templates/${encodeURIComponent(item.id)}`),blob=new Blob([JSON.stringify(body.template,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`obey-${item.name.replace(/[^a-zA-Z0-9_-]/g,'-')}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Plantilla OBEY exportada.'}
   catch(error){$('status').textContent=error.message}finally{setBusy(false)}
  })
  $('import').addEventListener('change',async()=>{
   const file=$('import').files[0];if(!file||state().busy)return;setBusy(true)
   try{if(file.size>1000000)throw Error('La plantilla supera el tamaño máximo de 1 MB.');const template=JSON.parse(await file.text());await post('/templates/import',{template});await refresh();$('status').textContent='Plantilla OBEY importada como copia privada.'}
   catch(error){$('status').textContent=error instanceof SyntaxError?'El archivo no contiene una plantilla JSON válida.':error.message}finally{$('import').value='';setBusy(false)}
  })
  $('delete').addEventListener('click',async()=>{
   const item=selected();if(!item||state().busy||!catalog?.private.some(record=>record.id===item.id)||!confirm(`¿Eliminar tu plantilla privada «${item.name}»?`))return
   setBusy(true);try{await post(`/templates/${encodeURIComponent(item.id)}/delete`,{});await refresh();$('status').textContent='Plantilla privada eliminada.'}catch(error){$('status').textContent=error.message}finally{setBusy(false)}
  })
  return{refresh,update,clear}
 }
})(window)
