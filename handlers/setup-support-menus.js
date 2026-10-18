const { z } = require('zod');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits: F } = require('discord.js');
const { label, snowflake, ids, field, channel, template } = require('./setup-fields');
const { openSetupChoices } = require('./setup-choices');
const { openFormSetup, checkResources } = require('./setup-form');
const { openRecordsSetup } = require('./setup-records');
const { createSetupSettings } = require('./setup-settings');
const { panelActions } = require('./setup-panels');
const kinds = { autosupport: label('Soporte automático', 'Automatic support'), menuapply: label('Menú de solicitudes', 'Application menu'), menuticket: label('Menú de tickets', 'Ticket menu') };
const yesNo = value => /^(yes|sí|si|true)$/i.test(value) ? true : /^(no|false)$/i.test(value) ? false : null;
const emojiSchema = z.union([z.null(), z.string().max(100).refine(value => /^\d{17,20}$|^<a?:\w+:\d{17,20}>$/.test(value) || [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)].length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(value))]);
function menuSchema(kind) {
    return z.array(z.object({ value: z.string().min(1).max(100), description: z.string().max(100), emoji: emojiSchema.optional(),
        ...(kind === 'autosupport' ? { sendEmbed: z.boolean(), replyMsg: z.string().min(1).max(2000) } : kind === 'menuapply' ? { applySystemExecution: z.union([z.number(), z.string()]).refine(v => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 100) } : { category: z.union([snowflake, z.null(), z.literal('')]), defaultname: z.string().min(1).max(100), replyMsg: z.string().min(1).max(2000) }),
    }).passthrough()).max(25).refine(entries => new Set(entries.map(e => e.value)).size === entries.length);
}
function slotFields(kind, n) {
    if (!Object.hasOwn(kinds, kind) || !Number.isInteger(n) || n < 1 || n > 100)
        throw Error('invalid_setup_definition');
    const pre = `${kind}${n}`;
    const fields = { channel: channel(`${pre}.channelId`, '', 'Canal del panel', 'Panel channel'), title: field(`${pre}.panelTitle`, 'text', kinds[kind].es, z.string().min(1).max(256), 'Título del panel', 'Panel title', { maxInput: 256 }), body: template(`${pre}.panelText`, 'Selecciona una opción / Select an option', 'Texto del panel', 'Panel text') };
    if (kind === 'menuticket')
        Object.assign(fields, {
            closedParent: channel(`${pre}.closedParent`, '', 'Categoría de tickets cerrados', 'Closed ticket category', { channelTypes: [4], send: false }),
            access: field(`${pre}.access`, 'principals', [], ids, 'Personal: roles y miembros', 'Staff: roles and members'),
            claim: field(`${pre}.claim.enabled`, 'boolean', false, z.boolean(), 'Asignación a personal', 'Staff claiming'),
            openText: template(`${pre}.claim.messageOpen`, 'Dear {user}! Please wait until a Staff Member claims your Ticket.', 'Mensaje de espera', 'Waiting message'),
            claimText: template(`${pre}.claim.messageClaim`, '{claimer} has claimed the Ticket for {user}.', 'Mensaje de asignación', 'Claim message'),
        });
    return fields;
}
async function validateEntry(kind, entry, access, client) {
    if (kind === 'menuticket') {
        if (!access.bot.permissions.has(F.ManageChannels))
            throw Error('setup_resource');
        if (entry.category)
            await checkResources(access, { type: 'channel', channelTypes: [4], send: false }, entry.category);
    }
    if (kind === 'menuapply') {
        const value = client.apply.get(access.guild.id, `apply${Number(entry.applySystemExecution)}`);
        if (!value?.QUESTIONS?.length || !value.f_channel_id)
            throw Error('invalid_application');
        await checkResources(access, { type: 'channel' }, value.f_channel_id);
    }
}
async function snapshotOpenTicketAccess(client, guildId, number, previous) {
    const store = client.setups;
    const docs = await store.model.find({ 'ticketdata.guild': guildId, 'ticketdata.menutickettype': number, 'ticketdata.menuticketAccess': { $exists: false } }).lean();
    for (const doc of docs) {
        const access = previous[doc.ticketdata.menuticketIndex]?.access || [];
        const service = createSetupSettings(store, { access: { path: 'ticketdata.menuticketAccess', default: [], schema: ids } }, () => Boolean(client._shuttingDown));
        const current = await service.read(doc[store.guildKey]);
        await service.save(doc[store.guildKey], { access }, current.revision);
    }
}
function optionsDefinition(kind, n) {
    slotFields(kind, n);
    const path = `${kind}${n}.data`, schema = menuSchema(kind);
    const defaults = { ...Object.fromEntries(Object.values(slotFields(kind, n)).map(field => [field.path, field.default])), [`${kind}${n}.messageId`]: '' };
    const inputs = [{ id: 'value', label: label('Nombre de la opción', 'Option name'), max: 100 }, { id: 'description', label: label('Descripción', 'Description'), max: 100, required: false }, { id: 'emoji', label: label('Emoji (opcional)', 'Emoji (optional)'), max: 100, required: false }];
    if (kind === 'autosupport')
        inputs.push({ id: 'sendEmbed', label: label('Respuesta con embed: sí / no', 'Embed reply: yes / no'), max: 5, format: v => v === false ? 'no' : 'yes' }, { id: 'replyMsg', label: label('Respuesta privada', 'Private response'), multiline: true, max: 2000 });
    else if (kind === 'menuapply')
        inputs.push({ id: 'applySystemExecution', label: label('Número de solicitud (1–100)', 'Application number (1–100)'), max: 3 });
    else
        inputs.push({ id: 'category', label: label('ID de categoría (opcional)', 'Category ID (optional)'), max: 20, required: false }, { id: 'replyMsg', label: label('Nombre y mensaje del ticket', 'Ticket name and message'), multiline: true, max: 2101, hint: label('Primera línea: nombre. Después: mensaje.', 'First line: name. Then: message.'), format: (_, r) => r ? `${r.defaultname}\n${r.replyMsg}` : '' });
    const definition = { title: kinds[kind], store: kind, path, schema, defaults, inputs, key: e => e.value, describe: e => `${e.value}\n${e.description}`, parse(data, previous) {
            const base = { ...previous, value: data.value.trim(), description: data.description, emoji: data.emoji.trim() || null };
            if (kind === 'autosupport')
                return { ...base, sendEmbed: yesNo(data.sendEmbed.trim()), replyMsg: data.replyMsg };
            if (kind === 'menuapply')
                return { ...base, applySystemExecution: Number(data.applySystemExecution) };
            const [defaultname, ...lines] = data.replyMsg.split(/\r?\n/);
            return { ...base, category: data.category.trim() || null, defaultname, replyMsg: lines.join('\n') };
        }, validate: (entry, access, client) => validateEntry(kind, entry, access, client) };
    if (kind === 'menuticket')
        definition.service = (client, context) => {
            const service = createSetupSettings(client[kind], { records: { path, default: [], schema } }, () => Boolean(client._shuttingDown), defaults);
            return { ...service, async save(id, patch, revision) { const old = await service.read(id); if (old.revision !== revision)
                    throw Object.assign(Error('setup_conflict'), { code: 'setup_conflict' }); await snapshotOpenTicketAccess(client, id, n, old.values.records); return service.save(id, patch, revision); } };
        };
    return definition;
}
function settingsDefinition(kind, n) {
    const fields = slotFields(kind, n), pre = `${kind}${n}`;
    const panel = { store: kind, key: pre, label: kinds[kind].es, fields: { ...fields, data: { path: `${pre}.data`, default: [], schema: menuSchema(kind) } }, paths: { message: `${pre}.messageId`, nonce: `${pre}.publicationNonce` },
        async validate(values, access, client) { if (!menuSchema(kind).safeParse(values.data).success || !values.data.length)
            throw Error('invalid_setup'); for (const entry of values.data)
            await validateEntry(kind, entry, access, client); },
        payload(values) { const select = new StringSelectMenuBuilder().setCustomId('MenuSelection').setPlaceholder('Selecciona una opción / Select an option').addOptions(values.data.map(entry => ({ label: entry.value, value: entry.value, ...(entry.description ? { description: entry.description } : {}), ...(entry.emoji ? { emoji: entry.emoji } : {}) }))); return { embeds: [new EmbedBuilder().setColor(0xFFD36F).setTitle(values.title).setDescription(values.body || 'Selecciona una opción / Select an option')], components: [new ActionRowBuilder().addComponents(select)] }; },
    };
    return { title: kinds[kind], store: kind, fields, description: label('Guarda los cambios y usa Publicar para actualizar el panel. Las opciones se editan en su sección. Retirar elimina solo el mensaje del panel.', 'Save changes, then Publish to update the panel. Edit options in their section. Unpublish deletes only the panel message.'), ...panelActions(panel) };
}
function openSupportMenus(client, origin, kind) { if (!Object.hasOwn(kinds, kind))
    throw Error('invalid_setup_definition'); return openSetupChoices(client, origin, kinds[kind], Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1), title: label(`Sistema ${i + 1}`, `System ${i + 1}`), open: (c, m) => openSetupChoices(c, m, kinds[kind], [{ id: 'settings', title: label('Panel y ajustes', 'Panel and settings'), open: (c, m) => openFormSetup(c, m, settingsDefinition(kind, i + 1)) }, { id: 'options', title: label('Opciones del menú', 'Menu options'), open: (c, m) => openRecordsSetup(c, m, optionsDefinition(kind, i + 1)) }]) }))); }
module.exports = { openSupportMenus, settingsDefinition, optionsDefinition, menuSchema, yesNo, snapshotOpenTicketAccess };
