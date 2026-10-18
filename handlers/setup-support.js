const { z } = require('zod');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits: F } = require('discord.js');
const { label, snowflake, ids, field, channel, template } = require('./setup-fields');
const { openSetupChoices } = require('./setup-choices');
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
        channel: channel(`${pre}.channelid`, '', 'Canal del panel', 'Panel channel'), parent: channel(`${pre}.parentid`, '', 'Categoría de tickets abiertos', 'Open ticket category', { channelTypes: [4], send: false }), closedParent: channel(`${pre}.closedParent`, '', 'Categoría de tickets cerrados', 'Closed ticket category', { channelTypes: [4], send: false }),
        name: field(`${pre}.defaultname`, 'text', 'ticket-{count}-{member}', z.string().min(1).max(100), 'Nombre del ticket', 'Ticket name', { maxInput: 100 }),
        message: template(`${pre}.message`, 'Hey {user}, thanks for opening a ticket! Someone will help you soon!', 'Mensaje de bienvenida del ticket', 'Ticket welcome message'),
        roles: field(`${pre}.adminroles`, 'roles', [], ids, 'Roles del personal', 'Staff roles', { permissionOnly: true }),
        log: channel(`${pre}.ticketlogid`, '', 'Canal de registro', 'Log channel'), claim: bool(`${pre}.claim.enabled`, false, 'Asignación a personal', 'Staff claiming'),
        claimOpen: template(`${pre}.claim.messageOpen`, 'Dear {user}! Please wait until a Staff Member claims your Ticket.', 'Mensaje de espera', 'Waiting message'), claimText: template(`${pre}.claim.messageClaim`, '{claimer} has claimed the Ticket for {user}.', 'Mensaje de asignación', 'Claim message'),
        title: field(`${pre}.panelTitle`, 'text', 'Tickets', z.string().min(1).max(256), 'Título del panel', 'Panel title', { maxInput: 256 }), body: template(`${pre}.panelText`, 'Abre un ticket para recibir ayuda. / Open a ticket for help.', 'Texto del panel', 'Panel text'), receipt: optionalId(`${pre}.messageid`, 'ID del mensaje existente', 'Existing message ID'),
    };
    const validate = async (values, access) => { if (!access.bot.permissions.has(F.ManageChannels))
        throw Error('setup_resource'); for (const id of ['parent', 'closedParent', 'channel', 'log'])
        await checkResources(access, fields[id], values[id]); };
    const panel = { store: 'setups', key: pre, label: `Tickets ${n}`, fields, paths: { message: `${pre}.messageid`, nonce: `${pre}.publicationNonce`, enabled: `${pre}.enabled` }, validate, payload(values) { return { embeds: [new EmbedBuilder().setColor(0xFFD36F).setTitle(values.title).setDescription(values.body)], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('create_a_ticket').setLabel('Abrir ticket / Open ticket').setStyle(ButtonStyle.Success))] }; } };
    // guildid is a consumed legacy field and is seeded only on Save; never reset open-ticket records.
    return { title: label(`Tickets ${n}`, `Tickets ${n}`), store: 'setups', fields, description, validate, service(client, context) { const seeds = { [`${pre}.guildid`]: context.guildId }; return createSetupSettings(client.setups, fields, () => Boolean(client._shuttingDown), seeds); }, ...panelActions({ ...panel, defaults: {} }),
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
    const definition = { title: label(`Solicitud ${n}${section === 'general' ? '' : ` · ${section}`}`, `Application ${n}${section === 'general' ? '' : ` · ${section}`}`), store: 'apply', fields, defaults, description };
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
function openSupportSetup(client, origin, kind) { if (!['ticket', 'apply'].includes(kind))
    throw Error('invalid_setup_definition'); return openSetupChoices(client, origin, label(kind === 'ticket' ? 'Tickets' : 'Solicitudes', kind === 'ticket' ? 'Tickets' : 'Applications'), Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1), title: label(`Sistema ${i + 1}`, `System ${i + 1}`), open: (c, m) => kind === 'ticket' ? openFormSetup(c, m, ticketDefinition(i + 1)) : openSetupChoices(c, m, label(`Solicitud ${i + 1}`, `Application ${i + 1}`), [{ id: 'general', title: label('Panel y ajustes', 'Panel and settings'), open: (c, m) => openFormSetup(c, m, applicationDefinition(i + 1)) }, { id: 'questions', title: label('Preguntas', 'Questions'), open: (c, m) => openRecordsSetup(c, m, questionsDefinition(i + 1)) }, ...['one', 'two', 'three', 'four', 'five'].map((section, index) => ({ id: section, title: label(`Respuesta ${index + 1}`, `Response ${index + 1}`), open: (c, m) => openFormSetup(c, m, applicationDefinition(i + 1, section)) }))]) }))); }
module.exports = { openSupportSetup, ticketDefinition, applicationDefinition, applicationFields, questionsDefinition, questionSchema, applicationDefaults };
