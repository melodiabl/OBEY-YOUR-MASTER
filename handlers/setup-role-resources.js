const { openSetupChoices } = require('./setup-choices')
const { openFormSetup } = require('./setup-form')
const { label } = require('./setup-fields')
const { rosterFields, rosterEmbed, publishRoster, retireRoster } = require('./roster-publication')
const { counterFields, renderMemberCount, updateMemberCounter } = require('./member-counter-settings')
function rosterDefinition(number) {
  return { title: label(`Lista de roles ${number}`, `Role list ${number}`), store: 'roster', fields: rosterFields(number),
    description: label('Guardar actualiza la configuración. Publicar actualiza el mensaje ahora; Retirar elimina el mensaje del bot. Vaciar el ID solo desvincula el mensaje.', 'Save updates configuration. Publish updates the message now; Unpublish deletes the bot message. Clearing the ID only unlinks it.'),
    publish: (client, context) => publishRoster(client, context, number), unpublish: (client, context) => retireRoster(client, context, number),
    async previewAction(client, context, values) { return { embeds: [await rosterEmbed(client, client.guilds.cache.get(context.guildId), values)] } },
  }
}
function counterDefinition(number) {
  return { title: label(`Contador de miembros ${number}`, `Member counter ${number}`), store: 'setups', fields: counterFields(number),
    description: label('Selecciona un canal existente y prepara su nombre. Guardar actualiza el contador automático; Publicar actualiza el nombre ahora. Vaciar el canal y guardar desactiva el vínculo.', 'Select an existing channel and prepare its name. Save updates the automatic counter; Publish updates the name now. Clear the channel and save to disable the binding.'),
    publish: (client, context) => updateMemberCounter(client, context, number),
    async previewAction(client, context, values) { const guild = client.guilds.cache.get(context.guildId); await guild.members.fetch(); return { content: renderMemberCount(values.name, guild) } },
  }
}
function openRoleResources(client, message, id) {
  const count = id === 'roster' ? 100 : id === 'membercount' ? 25 : 0
  if (!count) throw new Error('invalid_setup_definition')
  return openSetupChoices(client, message, id === 'roster' ? label('Listas de roles', 'Role lists') : label('Contadores de miembros', 'Member counters'), Array.from({ length: count }, (_, index) => {
    const number = index + 1, definition = id === 'roster' ? rosterDefinition(number) : counterDefinition(number)
    return { id: String(number), title: definition.title, open: (client, message) => openFormSetup(client, message, definition) }
  }))
}
module.exports = { openRoleResources, rosterDefinition, counterDefinition }
