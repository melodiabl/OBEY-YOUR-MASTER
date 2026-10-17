(function(root){
 root.initArchitectWelcome=function({request,state,setBusy}){
  const $=id=>document.getElementById(`architect-welcome-${id}`)
  let revision=null,sequence=0
  function update(){$('fields').disabled=state().busy||!revision}
  function clear(){sequence++;revision=null;$('channel').replaceChildren();$('message').value='';update()}
  function display(config){revision=config.revision;$('channel').value=config.channelId||'';$('message').value=config.message;update()}
  async function refresh(channels){
   const token=++sequence,selected=$('channel').value
   $('channel').replaceChildren(new Option('Desactivado',''),...channels.filter(channel=>channel.type===0&&!channel.id.startsWith('local:')).map(channel=>new Option(`#${channel.name}`,channel.id)))
   if([...$('channel').options].some(option=>option.value===selected))$('channel').value=selected
   $('status').textContent='Leyendo la configuración de bienvenida…'
   try{const body=await request();if(token!==sequence)return;display(body.configuration);$('status').textContent='Configuración actual cargada. Puedes elegir un canal y guardar el mensaje.'}
   catch(error){if(token!==sequence)return;clear();$('status').textContent=error.message}
  }
  $('form').addEventListener('submit',async event=>{
   event.preventDefault();if(!revision||state().busy)return
   setBusy(true);$('status').textContent='Guardando bienvenida…'
   try{const body=await request({channelId:$('channel').value||null,message:$('message').value,revision});display(body.configuration);$('status').textContent='Bienvenida guardada. Web y Discord utilizan esta configuración.'}
   catch(error){$('status').textContent=error.message}
   finally{setBusy(false)}
  })
  $('reload').addEventListener('click',()=>{if(!state().busy)refresh(state().channels||[])})
  return{refresh,update,clear}
 }
})(window)
