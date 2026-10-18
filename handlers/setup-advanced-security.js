const { z } = require('zod');
const { PermissionFlagsBits: F, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { label, snowflake, ids, field, channel, template } = require('./setup-fields');
const { openFormSetup, checkResources } = require('./setup-form');
const { openSetupChoices } = require('./setup-choices');
const { createSetupSettings } = require('./setup-settings');
const { panelActions } = require('./setup-panels');
const { runSetupOperation } = require('./setup-operations');
const { serialize } = require('./setup-publications');
const { requireSetupAccess } = require('./setup-access');
const sections = { all: label('General y acceso permitido', 'General and allowlist'), antibot: label('Adición de bots', 'Bot additions'), antideleteuser: label('Expulsiones y baneos', 'Kicks and bans'), anticreaterole: label('Creación de roles', 'Role creation'), antideleterole: label('Eliminación de roles', 'Role deletion'), antichannelcreate: label('Creación de canales', 'Channel creation'), antichanneldelete: label('Eliminación de canales', 'Channel deletion') };
const punishments = { removeroles: label('Retirar roles', 'Remove roles'), kick: label('Expulsar', 'Kick'), ban: label('Banear', 'Ban') };
const periods = { neededdaycount: label('día', 'day'), neededweekcount: label('semana', 'week'), neededmonthcount: label('mes', 'month'), noeededalltimecount: label('total', 'all time') };
const counts = { removeroles: [1, 4, 10, 0], kick: [2, 7, 20, 0], ban: [4, 10, 25, 0] };
function antiNukeDefaults() { const d = { all: { enabled: false, logger: 'no', whitelisted: { roles: [], users: [] }, showwhitelistlog: true, quarantine: false } }; for (const section of Object.keys(sections).filter(k => k !== 'all')) {
    d[section] = { enabled: true, whitelisted: { roles: [], users: [] }, punishment: { member: {} } };
    for (const action of Object.keys(punishments))
        d[section].punishment.member[action] = { enabled: true, ...Object.fromEntries(Object.keys(periods).map((period, i) => [period, counts[action][i]])) };
    if (section === 'antibot')
        d[section].punishment.bot = { kick: true, ban: false };
    if (section === 'anticreaterole')
        d[section].punishment.removeaddedrole = true;
    if (section === 'antideleterole')
        d[section].punishment.readdrole = true;
    if (section === 'antichannelcreate')
        d[section].punishment.deletecreatedchannel = true;
} return d; }
function flatten(value, path = 'antinuke', output = {}) { for (const [key, v] of Object.entries(value)) {
    const p = `${path}.${key}`;
    if (v !== null && typeof v === 'object' && !Array.isArray(v))
        flatten(v, p, output);
    else
        output[p] = v;
} return output; }
const defaults = flatten(antiNukeDefaults());
const ownerOnly = async ({ guild, member }) => { if (guild.ownerId !== member.id)
    throw Error('setup_denied'); };
function antiNukeDefinition(section) {
    if (!Object.hasOwn(sections, section))
        throw Error('invalid_setup_definition');
    const pre = `antinuke.${section}`;
    const fields = { enabled: field(`${pre}.enabled`, 'boolean', section !== 'all', z.boolean(), 'Protección activada', 'Protection enabled'), roles: field(`${pre}.whitelisted.roles`, 'roles', [], ids, 'Roles permitidos', 'Allowed roles', { permissionOnly: true }), users: field(`${pre}.whitelisted.users`, 'users', [], ids, 'Miembros permitidos (IDs de usuarios)', 'Allowed members (user IDs)', { hint: label('Selecciona miembros. Los roles se gestionan en su campo.', 'Select members. Manage roles in their own field.') }) };
    if (section === 'all')
        Object.assign(fields, { logger: channel(`${pre}.logger`, 'no', 'Canal de registro', 'Log channel'), whitelistLog: field(`${pre}.showwhitelistlog`, 'boolean', true, z.boolean(), 'Registrar acciones permitidas', 'Log allowed actions'), quarantine: field(`${pre}.quarantine`, 'role', false, z.union([snowflake, z.literal(false)]), 'Rol de cuarentena', 'Quarantine role', { clear: false, noAdmin: true }) });
    else {
        for (const [action, title] of Object.entries(punishments)) {
            fields[`${action}_enabled`] = field(`${pre}.punishment.member.${action}.enabled`, 'boolean', true, z.boolean(), `${title.es}: activado`, `${title.en}: enabled`);
            for (const [i, [period, periodTitle]] of Object.entries(periods).entries())
                fields[`${action}_${period}`] = field(`${pre}.punishment.member.${action}.${period}`, 'number', counts[action][i], z.number().int().min(0).max(1000000), `${title.es} / ${periodTitle.es}`, `${title.en} / ${periodTitle.en}`, { hint: label('0 desactiva este límite. Solo se cambian preferencias; no se sanciona al guardar.', '0 disables this limit. Saving preferences does not punish anyone.') });
        }
        const extras = section === 'antibot' ? { bot_kick: ['bot.kick', true, 'Expulsar bot añadido', 'Kick added bot'], bot_ban: ['bot.ban', false, 'Banear bot añadido', 'Ban added bot'] } : section === 'anticreaterole' ? { restore: ['removeaddedrole', true, 'Retirar rol creado', 'Remove created role'] } : section === 'antideleterole' ? { restore: ['readdrole', true, 'Recrear rol eliminado', 'Recreate deleted role'] } : section === 'antichannelcreate' ? { restore: ['deletecreatedchannel', true, 'Eliminar canal creado', 'Delete created channel'] } : {};
        for (const [id, [path, value, es, en]] of Object.entries(extras))
            fields[id] = field(`${pre}.punishment.${path}`, 'boolean', value, z.boolean(), es, en);
    }
    return { title: sections[section], store: 'settings', fields, defaults, authorize: ownerOnly, description: label('Solo el propietario del servidor. Guarda un borrador de preferencias; los límites 0 están desactivados. La protección global debe estar activada para actuar.', 'Server owner only. Save a draft of preferences; limits set to 0 are disabled. Global protection must be enabled to act.'), async validate(values, access) { if (values.enabled && !access.bot.permissions.has(F.Administrator))
            throw Error('setup_resource'); if (values.users.length) {
            for (const id of values.users) {
                const member = await access.guild.members.fetch({ user: id, force: true });
                if (member?.id !== id || member.guild.id !== access.guild.id)
                    throw Error('setup_resource');
            }
        } } };
}
function recommendedDefinition() { const definitions = Object.keys(sections).map(antiNukeDefinition), fields = {}; for (const [sectionIndex, def] of definitions.entries())
    for (const [id, f] of Object.entries(def.fields))
        fields[`s${sectionIndex}_${id}`] = f; fields.profile = field('antinuke.profile', 'enum', 'custom', z.enum(['custom', 'recommended']), 'Perfil pendiente', 'Pending profile', { options: ['custom', 'recommended'], labels: { custom: label('Personalizado', 'Custom'), recommended: label('Aplicar recomendado al guardar', 'Apply recommended on Save') } }); return { title: label('Perfil recomendado', 'Recommended profile'), store: 'settings', fields, defaults, authorize: ownerOnly, description: label('Elegir recomendado y guardar activa la protección global y restaura límites/acciones sugeridos. Conserva listas permitidas, registro y cuarentena. Revisa antes de guardar.', 'Choosing recommended and saving enables global protection and restores suggested limits/actions. Allowlist, logger and quarantine are preserved. Review before saving.'), prepare(values, patch) { if (patch.profile !== 'recommended')
        return patch; return Object.fromEntries(Object.entries(fields).filter(([id, f]) => id === 'profile' || f.path.endsWith('.enabled') || f.path.includes('.punishment.')).map(([id, f]) => [id, id === 'profile' ? 'custom' : f.path === 'antinuke.all.enabled' ? true : f.default])); }, validate: async (values, access) => { if (!access.bot.permissions.has(F.Administrator))
        throw Error('setup_resource'); } }; }
function syncQuarantine(client, context) { return runSetupOperation(client, () => serialize(client, `${context.guildId}:quarantine`, async () => { const access = await requireSetupAccess(client, context); await ownerOnly(access); const service = createSetupSettings(client.settings, antiNukeDefinition('all').fields), value = await service.read(context.guildId); const role = value.values.quarantine; if (!role)
    throw Error('setup_resource'); await checkResources(access, { type: 'role', noAdmin: true }, role); const channels = await access.guild.channels.fetch(); for (const channel of channels.values()) {
    if (!channel || channel.isThread?.())
        continue;
    const fresh = await requireSetupAccess(client, context);
    await ownerOnly(fresh);
    if (client._shuttingDown || context.isActive && !context.isActive())
        throw Error('setup_unavailable');
    if ((await service.read(context.guildId)).values.quarantine !== role)
        throw Error('setup_conflict');
    if (!channel.permissionsFor(fresh.bot)?.has(F.ManageRoles))
        throw Error('setup_resource');
    const previous = channel.permissionOverwrites.cache.get(role);
    if (previous?.deny.has([F.ViewChannel, F.SendMessages, F.AddReactions, F.Connect, F.Speak]))
        continue;
    await channel.permissionOverwrites.edit(role, { ViewChannel: false, SendMessages: false, AddReactions: false, Connect: false, Speak: false });
} })); }
function openAntiNukeSetup(client, origin) { return openSetupChoices(client, origin, label('Protección antinuke', 'Anti-nuke protection'), [...Object.entries(sections).map(([id, title]) => ({ id, title, open: (c, m) => openFormSetup(c, m, antiNukeDefinition(id)) })), { id: 'recommended', title: label('Revisar perfil recomendado', 'Review recommended profile'), open: (c, m) => openFormSetup(c, m, recommendedDefinition()) }, { id: 'quarantine', title: label('Aplicar cuarentena a canales', 'Apply quarantine to channels'), open: (c, m) => openFormSetup(c, m, { ...antiNukeDefinition('all'), description: label('Publicar aplica al rol guardado una prohibición de ver, escribir y conectar en los canales. No cambia otros permisos. Un fallo puede dejar una aplicación parcial; repetir omite los ya aplicados.', 'Publish denies the saved role permission to view, write and connect in channels. Other permissions are preserved. Failures can leave partial progress; repeating skips completed channels.'), publish: syncQuarantine }) }], { authorize: ownerOnly }); }
function epicVerificationDefinition(client) { const fields = { channel: channel('epicgames.verifychannel', '', 'Canal de verificación', 'Verification channel'), log: channel('epicgames.logChannel', '', 'Canal de registro', 'Log channel'), title: field('epicgames.panelTitle', 'text', 'Epic Games', z.string().min(1).max(256), 'Título del panel', 'Panel title', { maxInput: 256 }), body: template('epicgames.panelText', 'Vincula tu cuenta de Epic Games. / Link your Epic Games account.', 'Texto del panel', 'Panel text') }; const actions = panelActions({ store: 'settings', key: 'epicgames', label: 'Epic Games', fields, paths: { message: 'epicgames.messageId', nonce: 'epicgames.publicationNonce' }, payload(values) { return { embeds: [new EmbedBuilder().setColor(0xFFD36F).setTitle(values.title).setDescription(values.body)], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('epicgamesverify').setLabel('Vincular / Link').setStyle(ButtonStyle.Primary))] }; } }); return { title: label('Epic Games · ajustes', 'Epic Games · settings'), store: 'settings', fields, description: label('El verificador antiguo no está activo en el arranque. Puedes conservar sus ajustes o retirar un panel existente. Publicar queda bloqueado hasta integrar y comprobar el proveedor.', 'The legacy verifier is not active at startup. Keep its settings or unpublish an existing panel. Publishing is blocked until the provider is integrated and verified.'), ...actions, publish: async (c, context) => { if (!c.epicgamesVerificationReady)
        throw Object.assign(Error('setup_provider_unavailable'), { code: 'setup_provider_unavailable' }); return actions.publish(c, context); } }; }
const openEpicVerificationSetup = (client, origin) => openFormSetup(client, origin, epicVerificationDefinition(client));
module.exports = { openAntiNukeSetup, antiNukeDefinition, recommendedDefinition, antiNukeDefaults, ownerOnly, syncQuarantine, openEpicVerificationSetup, epicVerificationDefinition };
