const { createHash } = require('node:crypto');
const { isRestrictedCommand } = require('./command-policy');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const rootKeys = ['type', 'name', 'description', 'options', 'name_localizations', 'description_localizations', 'default_member_permissions', 'default_permission', 'dm_permission', 'nsfw', 'contexts', 'integration_types'];
const optionKeys = ['type', 'name', 'description', 'options', 'choices', 'name_localizations', 'description_localizations', 'required', 'autocomplete', 'channel_types', 'min_value', 'max_value', 'min_length', 'max_length'];
const metaKeys = ['id', 'application_id', 'guild_id', 'version'];
const nameOK = value => typeof value === 'string' && /^[-_\u02BC\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u.test(value) && value === value.toLowerCase();
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function stable(value) { return JSON.stringify(value, (_key, item) => object(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item); }
const digest = value => createHash('sha256').update(stable(value)).digest('hex');
function locales(value) {
    if (value == null)
        return {};
    if (!object(value) || Object.values(value).some(x => x !== null && (typeof x !== 'string' || x.length > 100)))
        fail('slash_catalog');
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null));
}
function entries(value, depth = 0, remote = false, parentType = null) {
    if (!Array.isArray(value) || value.length > (depth ? 25 : 100) || depth > 3 && value.length)
        fail('slash_catalog');
    if (parentType === 2 && !value.length)
        fail('slash_catalog');
    if (depth && value.length) {
        const nested = value.some(n => n?.type === 1 || n?.type === 2);
        if (depth === 1 && nested && value.some(n => n?.type !== 1 && n?.type !== 2) || depth > 1 && (parentType === 2 ? value.some(n => n?.type !== 1) : parentType === 1 ? value.some(n => n?.type < 3) : true))
            fail('slash_catalog');
        let optional = false;
        if (!nested)
            for (const n of value) {
                if (optional && n?.required === true)
                    fail('slash_catalog');
                if (n?.required !== true)
                    optional = true;
            }
    }
    const names = new Set();
    return value.map(node => {
        const keys = depth ? optionKeys : rootKeys;
        if (!object(node) || Object.keys(node).some(k => !keys.includes(k) && !(remote && !depth && metaKeys.includes(k))) || !nameOK(node.name) || names.has(node.name))
            fail('slash_catalog');
        names.add(node.name);
        const type = node.type ?? (depth ? null : 1);
        if (!Number.isInteger(type) || (depth ? type < 1 || type > 11 : type !== 1) || typeof node.description !== 'string' || !node.description.trim().length || node.description.length > 100)
            fail('slash_catalog');
        if (!remote && isRestrictedCommand(node))
            fail('slash_catalog');
        const out = { type, name: node.name, description: node.description.trim(), name_localizations: locales(node.name_localizations), description_localizations: locales(node.description_localizations) };
        out.options = entries(node.options ?? [], depth + 1, remote, type);
        for (const key of depth ? ['required', 'autocomplete'] : ['dm_permission', 'default_permission', 'nsfw']) {
            if (node[key] !== undefined && !(node[key] === null && (key === 'dm_permission' || key === 'default_permission')) && typeof node[key] !== 'boolean')
                fail('slash_catalog');
            out[key] = node[key] ?? (key === 'dm_permission' || key === 'default_permission');
        }
        if (!depth) {
            const permissions = node.default_member_permissions;
            if (permissions != null && (typeof permissions !== 'string' || !/^\d{1,20}$/.test(permissions)))
                fail('slash_catalog');
            out.default_member_permissions = permissions == null ? null : BigInt(permissions).toString();
        }
        for (const key of depth ? ['channel_types'] : ['contexts', 'integration_types']) {
            if (node[key] != null && (!Array.isArray(node[key]) || node[key].some(x => !Number.isInteger(x) || x < 0)))
                fail('slash_catalog');
            out[key] = node[key] == null ? null : [...new Set(node[key])].sort((a, b) => a - b);
        }
        if (depth) {
            for (const [min, max] of [['min_value', 'max_value'], ['min_length', 'max_length']]) {
                if (node[min] !== undefined && node[max] !== undefined && node[min] > node[max])
                    fail('slash_catalog');
            }
            out.choices = (node.choices ?? []).map(choice => {
                if (!object(choice) || Object.keys(choice).some(k => !['name', 'value', 'name_localizations'].includes(k)) || typeof choice.name !== 'string' || !choice.name.length || choice.name.length > 100 || !['string', 'number'].includes(typeof choice.value) || typeof choice.value === 'number' && !Number.isFinite(choice.value))
                    fail('slash_catalog');
                return { name: choice.name, value: choice.value, name_localizations: locales(choice.name_localizations) };
            });
            if (out.choices.length > 25)
                fail('slash_catalog');
            for (const key of ['min_value', 'max_value', 'min_length', 'max_length'])
                if (node[key] !== undefined) {
                    if (typeof node[key] !== 'number' || !Number.isFinite(node[key]))
                        fail('slash_catalog');
                    out[key] = node[key];
                }
        }
        return out;
    });
}
function canonical(body, remote = false) { const result = entries(body, 0, remote); return result.sort((a, b) => a.name.localeCompare(b.name)); }
function snapshotCatalog(client) { try {
    const raw = JSON.stringify(client.allCommands);
    if (!raw || Buffer.byteLength(raw) > 1048576)
        fail('slash_catalog');
    const body = JSON.parse(raw);
    if (!Array.isArray(body) || !body.length)
        fail('slash_catalog');
    return { body, hash: digest(canonical(body)), roots: body.length, invocations: body.reduce((n, c) => n + count(c.options), 0) };
}
catch {
    fail('slash_catalog');
} }
function count(options) { return options?.some(x => x.type === 1 || x.type === 2) ? options.reduce((n, x) => n + (x.type === 2 ? count(x.options) : 1), 0) : 1; }
function remoteCatalog(body, botId, target) { try {
    if (!Array.isArray(body) || body.some(x => !x || !/^\d{17,20}$/.test(x.id || '') || x.application_id !== botId || (target ? x.guild_id !== target : x.guild_id != null)))
        fail('slash_remote');
    return { body, hash: digest(canonical(body, true)) };
}
catch {
    fail('slash_remote');
} }
function outgoing(desired, remote) { return desired.map(c => { const previous = remote.find(x => x.name === c.name); const result = structuredClone(c); for (const key of ['contexts', 'integration_types'])
    if (c[key] === undefined && previous?.[key] != null)
        result[key] = structuredClone(previous[key]); return result; }); }
function equivalent(desired, remote) { const a = canonical(desired), b = canonical(remote, true); if (a.length !== b.length)
    return false; return a.every((c, i) => { const source = desired.find(x => x.name === c.name), other = { ...b[i] }, own = { ...c }; for (const key of ['contexts', 'integration_types'])
    if (source[key] === undefined) {
        delete own[key];
        delete other[key];
    } return stable(own) === stable(other); }); }
function difference(desired, remote) { const after = new Map(desired.map(c => [c.name, c])), before = new Map(remote.map(c => [c.name, c])); return { added: [...after.keys()].filter(n => !before.has(n)).length, removed: [...before.keys()].filter(n => !after.has(n)).length, changed: [...after.keys()].filter(n => before.has(n) && !equivalent([after.get(n)], [before.get(n)])).length }; }
module.exports = { snapshotCatalog, remoteCatalog, outgoing, equivalent, difference };
