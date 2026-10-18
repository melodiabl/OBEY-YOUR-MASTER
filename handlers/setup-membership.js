const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const { requireSetupAccess } = require('./setup-access')
const { z } = require('zod')
const { label, ids, field, channel, template } = require('./setup-fields')
const { parseColor } = require('./setup-definitions')
const { openFormSetup } = require('./setup-form')
const { openSetupChoices } = require('./setup-choices')
const { membershipDefaults } = require('./membership-settings')
const { renderWelcomeMessage } = require('./welcome-message')
const imageUrl = z.string().max(2048).refine(value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password } catch { return false } })
const color = z.string().max(80).transform((value, context) => { const parsed = parseColor(value); if (parsed === null) { context.addIssue({ code: 'custom', message: 'invalid_color' }); return z.NEVER } return '#' + parsed.toString(16).padStart(6, '0') })
const preview = message => renderWelcomeMessage(message, { username: 'Miembro', toString: () => '@Miembro' }, { name: 'Servidor', memberCount: 42 })
function imageFields(root, dm) {
  const suffix = dm ? 'dm' : '', path = key => `${root}.${key}${suffix}`
  const fields = {
    image: field(path('image'), 'boolean', dm ? root === 'leave' : true, z.boolean(), 'Mostrar imagen', 'Show image'),
    custom: field(path('custom'), 'text', 'no', z.union([z.literal('no'), imageUrl]), 'Imagen personalizada (URL)', 'Custom image (URL)', { clear: 'no', maxInput: 2048, hint: label('URL de la imagen; vaciar vuelve a la tarjeta automática. Activa Mostrar imagen para verla.', 'Image URL; clear restores the automatic card. Enable Show image to display it.') }),
    background: field(path('background'), 'text', 'transparent', z.union([z.literal('transparent'), imageUrl]), 'Fondo de la tarjeta (URL)', 'Card background (URL)', { hint: label('Para usar esta URL, selecciona Usar URL en Fondos guardados.', 'To use this URL, select Use URL in Saved backgrounds.'), clear: 'transparent', maxInput: 2048 }),
    color: field(path('framecolor'), 'text', 'white', color, 'Color del marco', 'Frame color', { maxInput: 80 }),
  }
  for (const [key, es, en] of [['frame', 'Marco', 'Frame'], ['pb', 'Avatar', 'Avatar'], ['discriminator', 'Etiqueta de usuario', 'User tag'], ['membercount', 'Número de miembros', 'Member count'], ['servername', 'Nombre del servidor', 'Server name']]) fields[key] = field(path(key), 'boolean', true, z.boolean(), es, en)
  return fields
}
function primaryDefinition() {
  return { title: label('Dar la bienvenida', 'Welcome new members'), description: label('OBEY enviará este mensaje cuando entre alguien al servidor. Solo necesitas elegir un canal y escribir el saludo.', 'OBEY will send this message when someone joins. Just choose a channel and write a greeting.'), fields: {
    channel: channel('welcome.channel', 'nochannel', '¿Dónde damos la bienvenida?', 'Where should we greet new members?', { channelTypes: [0], hint: label('Elige un canal de texto donde los miembros puedan leer el saludo. Dejarlo sin configurar desactiva este mensaje.', 'Choose a text channel where members can read the greeting. Clearing it disables this message.') }),
    message: field('welcome.msg', 'text', '', z.string().max(500), '¿Qué mensaje enviamos?', 'What message should we send?', { allowEmpty: true, maxInput: 500, clear: '', hint: label('Ejemplo: ¡Hola {user}! Bienvenido a {server}. {user} menciona al miembro y {server} muestra el nombre del servidor. Máximo: 500 caracteres.', 'Example: Hello {user}! Welcome to {server}. {user} mentions the member and {server} shows the server name. Maximum: 500 characters.') }),
  }, preview: values => preview(values.message), service(client, context) {
    const actor = { guildId: context.guildId, actorId: context.actorId }, port = client.welcomeConfiguration
    const snapshot = value => ({ values: { channel: value.channelId || 'nochannel', message: value.message }, revision: value.revision })
    return {
      async read() { return snapshot(await port.readPublished(actor)) },
      async save(_, input, expectedRevision) {
        const patch = { ...(Object.hasOwn(input, 'channel') ? { channelId: input.channel === 'nochannel' ? null : input.channel } : {}), ...(Object.hasOwn(input, 'message') ? { message: input.message } : {}) }
        try { return snapshot(await port.savePublished(actor, { patch, expectedRevision })) }
        catch (error) { if (error.code === 'configuration_conflict') { const conflict = new Error('setup_conflict'); conflict.code = 'setup_conflict'; throw conflict } throw error }
      },
    }
  } }
}
function membershipDefinition(root, section) {
  if (!['welcome', 'leave'].includes(root)) throw new Error('invalid_setup_definition')
  const title = root === 'welcome' ? label('Bienvenida', 'Welcome') : label('Despedida', 'Leave')
  if (section === 'image' || section === 'dmImage') return { title, fields: imageFields(root, section === 'dmImage') }
  if (section === 'dm') return { title, fields: {
    enabled: field(`${root}.dm`, 'boolean', root === 'leave', z.boolean(), 'Mensajes por privado', 'Direct messages'),
    message: template(`${root}.dm_msg`, root === 'welcome' ? '{user} Welcome to this Server' : '{user} left this Server', 'Mensaje por privado', 'Direct message'),
    invite: field(`${root}.invitedm`, 'boolean', true, z.boolean(), 'Información de invitación', 'Invite information'),
  }, preview: values => preview(values.message) }
  if (section === 'general' && root === 'welcome') return { title, fields: {
    invite: field('welcome.invite', 'boolean', true, z.boolean(), 'Información de invitación', 'Invite information'),
    captcha: field('welcome.captcha', 'boolean', false, z.boolean(), 'Verificación captcha', 'Captcha verification'),
    roles: field('welcome.roles', 'roles', [], ids, 'Roles de entrada', 'Join roles', { clear: [], noAdmin: true }),
    secondchannel: channel('welcome.secondchannel', 'nochannel', 'Segundo canal', 'Second channel'),
    secondmsg: template('welcome.secondmsg', ':wave: {user} **Welcome to our Server!** :v:', 'Mensaje del segundo canal', 'Second channel message'),
  } }
  if (section === 'primary' && root === 'welcome') return primaryDefinition()
  if (section === 'primary' && root === 'leave') return { title, fields: {
    channel: channel('leave.channel', 'nochannel', 'Canal', 'Channel'),
    message: template('leave.msg', '{user} left this Server', 'Mensaje', 'Message'),
    invite: field('leave.invite', 'boolean', true, z.boolean(), 'Información de invitación', 'Invite information'),
  }, preview: values => preview(values.message) }
  throw new Error('invalid_setup_definition')
}
function definition(root, section) {
  if (!['welcome', 'leave'].includes(root)) throw new Error('invalid_setup_definition')
  if (section === 'assets' || section === 'dmAssets') return assetDefinition(root, section === 'dmAssets')
  const result = membershipDefinition(root, section), dm = ['dm', 'dmImage'].includes(section)
  if (!(root === 'welcome' && section === 'primary')) result.defaults = Object.fromEntries(Object.entries(membershipDefaults(root)).map(([key, value]) => [`${root}.${key}`, value]))
  result.previewAction = async (client, context, values) => {
    const { member } = await requireSetupAccess(client, context)
    const overrides = new Map(Object.entries(result.fields).map(([id, field]) => [field.path, values[id]]))
    const settings = { get: (guildId, path) => overrides.has(path) ? overrides.get(path) : client.settings.get(guildId, path) }
    const get = key => settings.get(context.guildId, `${root}.${key}${dm ? 'dm' : ''}`)
    const message = (section === 'general' ? values.secondmsg : values.message) ?? settings.get(context.guildId, `${root}.${dm ? 'dm_msg' : 'msg'}`) ?? ''
    const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle('Vista previa / Preview').setDescription(renderWelcomeMessage(message, member.user, member.guild).slice(0, 4096) || '…')
    if (!get('image')) return { embeds: [embed] }
    if (get('custom') && get('custom') !== 'no') return { embeds: [embed.setImage(get('custom'))] }
    const cards = require('./cards'), { cardAssetsFor } = require('./card-assets')
    const render = root === 'welcome' ? cards.renderConfiguredWelcomeCard : cards.renderConfiguredLeaveCard
    const buffer = await render(settings, member, { dm, assets: cardAssetsFor(client.settings) })
    return { embeds: [embed.setImage('attachment://setup-preview.png')], files: [new AttachmentBuilder(buffer, { name: 'setup-preview.png' })] }
  }
  return result
}
function assetDefinition(root, dm) {
  const slot = root + (dm ? 'Dm' : ''), selection = field('selection', 'enum', 'legacy', z.string().max(100), 'Fondo seleccionado', 'Selected background', { options: ['legacy', 'none'], labels: { legacy: label('Usar URL del fondo', 'Use background URL'), none: label('Sin fondo', 'No background') } })
  return { title: label('Fondos guardados', 'Saved backgrounds'), fields: { selection }, service(client, context) {
    const assets = require('./card-assets').cardAssetsFor(client.settings)
    const snapshot = view => {
      selection.options = ['legacy', 'none', ...view.assets.map(asset => asset.id)]
      for (const asset of view.assets) selection.labels[asset.id] = asset.name || 'Fondo / Background'
      return { values: { selection: view.selections[slot] === null ? 'none' : view.selections[slot] || 'legacy' }, revision: view.revision }
    }
    return {
      async read() { return snapshot(await assets.list(context.guildId)) },
      async save(_, input, expectedRevision) {
        if (!selection.options.includes(input.selection)) throw new Error('invalid_setup')
        try { return snapshot(await assets.choose(context.guildId, slot, input.selection === 'none' ? null : input.selection, expectedRevision)) }
        catch (error) { if (error.code === 'asset_conflict') { const conflict = new Error('setup_conflict'); conflict.code = 'setup_conflict'; throw conflict } throw error }
      },
    }
  } }
}
function openMembershipSetup(client, message, root) {
  const title = root === 'welcome' ? label('Dar la bienvenida', 'Welcome new members') : label('Despedir a miembros', 'Farewell messages')
  const sections = { image: label('Personalizar la tarjeta del canal', 'Customize the channel card'), dm: label('Enviar mensajes por privado', 'Send direct messages'), dmImage: label('Personalizar la tarjeta por privado', 'Customize the direct message card'), assets: label('Elegir un fondo guardado del canal', 'Choose a saved channel background'), dmAssets: label('Elegir un fondo guardado por privado', 'Choose a saved direct message background'), ...(root === 'welcome' ? { general: label('Roles, captcha y segundo canal', 'Roles, captcha and second channel') } : {}) }
  return openSetupChoices(client, message, title, [
    { id: 'primary', title: label('Empezar: canal y mensaje', 'Start: channel and message'), description: label('Lo necesario para enviar el saludo. No necesitas copiar IDs.', 'Everything needed to send the greeting. No IDs to copy.'), open: (c, m) => openFormSetup(c, m, definition(root, 'primary')) },
    { id: 'more', title: label('Personalizar más opciones', 'Customize more options'), description: label('Tarjetas, fondos y mensajes privados.', 'Cards, backgrounds and direct messages.'), open: (c, m) => openSetupChoices(c, m, title, Object.entries(sections).map(([id, title]) => ({ id, title, open: (c, m) => openFormSetup(c, m, definition(root, id)) }))) },
  ], { description: root === 'welcome' ? label('Prepara un saludo automático para las personas que entren. Empieza por el canal y el mensaje; el resto es opcional.', 'Prepare an automatic greeting for new members. Start with the channel and message; everything else is optional.') : label('Prepara un aviso cuando alguien salga del servidor. Empieza por el canal y el mensaje; el resto es opcional.', 'Prepare a message when someone leaves. Start with the channel and message; everything else is optional.') })
}
module.exports = { openMembershipSetup, definition }
