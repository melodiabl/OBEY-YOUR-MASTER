const { z } = require('zod');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits: F } = require('discord.js');
const { label, snowflake, ids, field, channel, template } = require('./setup-fields');
const { openSetupChoices } = require('./setup-choices');
const { openSetupSlots } = require('./setup-slots');
const { openFormSetup, checkResources } = require('./setup-form');
const { openRecordsSetup } = require('./setup-records');
const { panelActions } = require('./setup-panels');
const { createSetupSettings } = require('./setup-settings');
const role = (path, es, en) => field(path, 'role', '0', z.union([snowflake, z.literal('0')]), es, en, { clear: '0', noAdmin: true });
const optionalId = (path, es, en) => field(path, 'text', '', z.union([snowflake, z.literal('')]), es, en, { clear: '', allowEmpty: true, maxInput: 20 });
const bool = (path, value, es, en) => field(path, 'boolean', value, z.boolean(), es, en);
const description = label('Guardar cambia la configuración. Publicar crea o actualiza el panel; Retirar elimina solo su mensaje. Los tickets y solicitudes abiertos se conservan.', 'Save changes configuration. Publish creates or updates the panel; Unpublish deletes only its message. Open tickets and applications are preserved.');
function checkNumber(n) { if (!Number.isInteger(n) || n < 1 || n > 100)
    throw Error('invalid_setup_definition'); }
function ticketDefinition(n) {
    checkNumber(n);
    const pre = `ticketsystem${n}`, fields = {
        channel: channel(`${pre}.channelid`, '', '¿Dónde estará el botón de ayuda?', 'Where should the help button go?', { hint: label('Elige un canal de texto visible para los miembros. Ahí se publicará el botón Abrir ticket.', 'Choose a text channel members can see. The Open ticket button will be published there.') }), parent: channel(`${pre}.parentid`, '', '¿Dónde se crearán los tickets?', 'Where should tickets be created?', { channelTypes: [4], send: false, hint: label('Elige una categoría del servidor para agrupar los tickets nuevos.', 'Choose a server category for new tickets.') }), closedParent: channel(`${pre}.closedParent`, '', 'Categoría de tickets cerrados', 'Closed ticket category', { channelTypes: [4], send: false }),
        name: field(`${pre}.defaultname`, 'text', 'ticket-{count}-{member}', z.string().min(1).max(100), 'Nombre del ticket', 'Ticket name', { maxInput: 100 }),
        message: template(`${pre}.message`, 'Hey {user}, thanks for opening a ticket! Someone will help you soon!', 'Mensaje de bienvenida del ticket', 'Ticket welcome message'),
        roles: field(`${pre}.adminroles`, 'roles', [], ids, '¿Quién atenderá los tickets?', 'Who will handle tickets?', { permissionOnly: true, hint: label('Elige los roles de tu equipo de ayuda. Puedes añadir varios desde el selector.', 'Choose your support team roles. You can add several using the selector.') }),
        log: channel(`${pre}.ticketlogid`, '', 'Canal de registro', 'Log channel'), claim: bool(`${pre}.claim.enabled`, false, 'Asignación a personal', 'Staff claiming'),
        claimOpen: template(`${pre}.claim.messageOpen`, 'Dear {user}! Please wait until a Staff Member claims your Ticket.', 'Mensaje de espera', 'Waiting message'), claimText: template(`${pre}.claim.messageClaim`, '{claimer} has claimed the Ticket for {user}.', 'Mensaje de asignación', 'Claim message'),
        title: field(`${pre}.panelTitle`, 'text', 'Tickets', z.string().min(1).max(256), 'Título del panel', 'Panel title', { maxInput: 256 }), body: template(`${pre}.panelText`, 'Abre un ticket para recibir ayuda. / Open a ticket for help.', 'Texto del panel', 'Panel text'), receipt: optionalId(`${pre}.messageid`, 'ID del mensaje existente', 'Existing message ID'),
    };
    const validate = async (values, access) => { if (!access.bot.permissions.has(F.ManageChannels))
        throw Error('setup_resource'); for (const id of ['parent', 'closedParent', 'channel', 'log'])
        await checkResources(access, fields[id], values[id]); };
    const panel = { store: 'setups', key: pre, label: `Tickets ${n}`, fields, paths: { message: `${pre}.messageid`, nonce: `${pre}.publicationNonce`, enabled: `${pre}.enabled` }, validate, payload(values) { return { embeds: [new EmbedBuilder().setColor(0xFFD36F).setTitle(values.title).setDescription(values.body)], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('create_a_ticket').setLabel('Abrir ticket / Open ticket').setStyle(ButtonStyle.Success))] }; } };
    // guildid is a consumed legacy field and is seeded only on Save; never reset open-ticket records.
    return { title: label(`Tickets de ayuda · ${n}`, `Support tickets · ${n}`), store: 'setups', fields, basicFields: ['channel', 'parent', 'roles', 'title', 'body'], description: label('Publica un botón para que los miembros pidan ayuda. Elige el canal, la categoría y el personal. Los textos ya tienen un ejemplo; puedes cambiarlos si quieres.', 'Publish a button for members to request help. Choose the channel, category and staff. Texts have defaults that you can customize.'), publishLabel: label('Publicar botón de ayuda', 'Publish help button'), unpublishLabel: label('Quitar botón de ayuda', 'Remove help button'), publishHelp: label('Guarda los cambios y pulsa Publicar botón de ayuda. Los tickets abiertos se conservan.', 'Save changes, then press Publish help button. Existing tickets are kept.'), validate, service(client, context) { const seeds = { [`${pre}.guildid`]: context.guildId }; return createSetupSettings(client.setups, fields, () => Boolean(client._shuttingDown), seeds); }, ...panelActions({ ...panel, defaults: {} }),
        // The publisher also needs guildid for a first publication after choosing an existing message.
        publish: async (client, context) => { const service = createSetupSettings(client.setups, { guild: { path: `${pre}.guildid`, default: context.guildId, schema: snowflake } }); const v = await service.read(context.guildId); if (v.values.guild !== context.guildId)
            throw Error('invalid_setup'); return panelActions({ ...panel, defaults: { [`${pre}.guildid`]: context.guildId } }).publish(client, context); },
    };
}
const questionSchema = z.array(z.record(z.string().regex(/^(?:[1-9]|1\d|2[0-5])$/), z.string().min(1).max(2000)).refine(value => Object.keys(value).length === 1)).max(25);
function applicationDefaults(n) { const p = `apply${n}`, values = { channel_id: '', message_id: '', f_channel_id: '', QUESTIONS: [], TEMP_ROLE: '0', accept_role: '0', accept: "You've got accepted!", deny: "You've got denied!", ticket: 'Hey {user}! We have some Questions!', last_verify: false }; for (const [i, k] of ['one', 'two', 'three', 'four', 'five'].entries())
    values[k] = { role: '0', message: `Hey you've got accepted for Team ${i + 1}`, image: { enabled: false, url: '' } }; return Object.fromEntries(Object.entries(values).flatMap(([key, value]) => typeof value === 'object' && !Array.isArray(value) ? [[`${p}.${key}.role`, value.role], [`${p}.${key}.message`, value.message], [`${p}.${key}.image.enabled`, false], [`${p}.${key}.image.url`, '']] : [[`${p}.${key}`, value]])); }
function applicationFields(n, section) {
    checkNumber(n);
    const pre = `apply${n}`;
    if (section === 'general')
        return { channel: channel(`${pre}.channel_id`, '', 'Canal del panel', 'Panel channel'), finished: channel(`${pre}.f_channel_id`, '', 'Canal de solicitudes recibidas', 'Received applications channel'), title: field(`${pre}.panelTitle`, 'text', 'Solicitudes / Applications', z.string().min(1).max(256), 'Título del panel', 'Panel title', { maxInput: 256 }), body: template(`${pre}.panelText`, 'Pulsa el botón para iniciar la solicitud. / Press the button to apply.', 'Texto del panel', 'Panel text'), receipt: optionalId(`${pre}.message_id`, 'ID del mensaje existente', 'Existing message ID'), verify: bool(`${pre}.last_verify`, false, 'Confirmación antes de enviar', 'Confirmation before sending'), temporary: role(`${pre}.TEMP_ROLE`, 'Rol durante la solicitud', 'Role during application'), acceptedRole: role(`${pre}.accept_role`, 'Rol de aceptación', 'Acceptance role'), accept: template(`${pre}.accept`, "You've got accepted!", 'Mensaje de aceptación', 'Acceptance message'), deny: template(`${pre}.deny`, "You've got denied!", 'Mensaje de rechazo', 'Rejection message'), ticket: template(`${pre}.ticket`, 'Hey {user}! We have some Questions!', 'Mensaje de entrevista', 'Interview message') };
    if (!['one', 'two', 'three', 'four', 'five'].includes(section))
        throw Error('invalid_setup_definition');
    return { role: role(`${pre}.${section}.role`, 'Rol de la respuesta', 'Response role'), message: template(`${pre}.${section}.message`, 'Tu solicitud ha sido revisada. / Your application was reviewed.', 'Mensaje de la respuesta', 'Response message'), image: bool(`${pre}.${section}.image.enabled`, false, 'Imagen activada', 'Image enabled'), url: field(`${pre}.${section}.image.url`, 'text', '', z.union([z.literal(''), z.url().refine(value => { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; })]), 'URL de la imagen', 'Image URL', { clear: '', allowEmpty: true, maxInput: 2000 }) };
}
function applicationDefinition(n, section = 'general') {
    const pre = `apply${n}`, fields = applicationFields(n, section), defaults = applicationDefaults(n);
    const definition = { title: label(`Solicitud ${n}${section === 'general' ? '' : ` · ${section}`}`, `Application ${n}${section === 'general' ? '' : ` · ${section}`}`), store: 'apply', fields, defaults, description, ...(section === 'general' ? { basicFields: ['channel', 'finished', 'title', 'body'] } : {}) };
    if (section !== 'general') {
        definition.validate = values => { if (values.image && !values.url)
            throw Error('invalid_image'); };
        return definition;
    }
    return { ...definition, ...panelActions({ store: 'apply', key: pre, label: `Solicitudes ${n}`, fields: { ...fields, questions: { path: `${pre}.QUESTIONS`, default: [], schema: questionSchema } }, defaults, paths: { message: `${pre}.message_id`, nonce: `${pre}.publicationNonce` }, validate: async (values, access) => { if (!values.questions.length)
                throw Error('invalid_questions'); if (!values.finished)
                throw Error('invalid_application'); await checkResources(access, fields.finished, values.finished); }, payload(values) { return { embeds: [new EmbedBuilder().setColor(0xFFD36F).setTitle(values.title).setDescription(values.body)], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('User_Apply').setLabel('Solicitar / Apply').setStyle(ButtonStyle.Success))] }; } }) };
}
function questionsDefinition(n) { checkNumber(n); const path = `apply${n}.QUESTIONS`; return { title: label(`Preguntas · solicitud ${n}`, `Questions · application ${n}`), store: 'apply', path, schema: questionSchema, inputs: [{ id: 'position', label: label('Identificador (1–25)', 'Identifier (1–25)'), max: 2, format: (_, r) => r ? Object.keys(r)[0] : '' }, { id: 'question', label: label('Pregunta', 'Question'), multiline: true, max: 2000, format: (_, r) => r ? Object.values(r).join(' ') : '' }], key: r => Object.keys(r)[0], describe: r => Object.values(r).join(' '), parse: data => ({ [data.position.trim()]: data.question }) }; }
function openSupportSetup(client, origin, kind) {
    if (!['ticket', 'apply'].includes(kind)) throw Error('invalid_setup_definition');
    const ticket = kind === 'ticket';
    return openSetupSlots(client, origin, {
        title: ticket ? label('Recibir tickets de ayuda', 'Support tickets') : label('Recibir solicitudes', 'Applications'),
        store: ticket ? 'setups' : 'apply', prefix: ticket ? 'ticketsystem' : 'apply',
        isUsed: entry => ticket ? Boolean(entry.channelid || entry.messageid || entry.parentid || entry.panelTitle || entry.adminroles?.length)
            : Boolean(entry.channel_id || entry.message_id || entry.f_channel_id || entry.QUESTIONS?.length),
        open: (c, m, n) => ticket ? openFormSetup(c, m, ticketDefinition(n)) : openSetupChoices(c, m, label(`Solicitud ${n}`, `Application ${n}`), [
            { id: 'questions', title: label('1. Preparar las preguntas', '1. Prepare questions'), description: label('Añade al menos una pregunta para los solicitantes.', 'Add at least one question for applicants.'), open: (c, m) => openRecordsSetup(c, m, questionsDefinition(n)) },
            { id: 'general', title: label('2. Canal, mensaje y publicación', '2. Channel, message and publication'), description: label('Elige dónde recibir solicitudes y publicar el botón.', 'Choose where to receive applications and publish the button.'), open: (c, m) => openFormSetup(c, m, applicationDefinition(n)) },
            { id: 'more', title: label('Personalizar respuestas', 'Customize responses'), description: label('Opcional: roles y mensajes de las respuestas del personal.', 'Optional: roles and messages for staff responses.'), open: (c, m) => openSetupChoices(c, m, label('Respuestas del personal', 'Staff responses'), ['one', 'two', 'three', 'four', 'five'].map((section, index) => ({ id: section, title: label(`Respuesta ${index + 1}`, `Response ${index + 1}`), open: (c, m) => openFormSetup(c, m, applicationDefinition(n, section)) }))) },
        ]),
    });
}
module.exports = { openSupportSetup, ticketDefinition, applicationDefinition, applicationFields, questionsDefinition, questionSchema, applicationDefaults };
