const { z } = require('zod');
const { createSetupSettings } = require('./setup-settings');
const { publishSavedMessage, retireSavedMessage } = require('./setup-publications');
// Domain definitions own the store, paths, payload and validation. Transport owns receipts.
function panelPort(client, context, definition) {
    const { fields, paths } = definition;
    const service = createSetupSettings(client[definition.store], {
        ...fields,
        receipt: { path: paths.message, default: '', schema: z.string().regex(/^(?:\d{17,20})?$/) },
        nonce: { path: paths.nonce, default: '', schema: z.string().max(24) },
        ...(paths.enabled ? { enabled: { path: paths.enabled, default: false, schema: z.boolean() } } : {}),
    }, () => false, definition.defaults);
    const snapshot = value => ({ ...value, channelId: value.values[definition.channelField || 'channel'], messageId: value.values.receipt, nonce: value.values.nonce });
    return { key: definition.key, label: definition.label,
        async read() { return snapshot(await service.read(context.guildId)); },
        async save(value, patch) {
            return snapshot(await service.save(context.guildId, {
                ...(patch.messageId !== undefined ? { receipt: patch.messageId, ...(paths.enabled ? { enabled: Boolean(patch.messageId) } : {}) } : {}),
                ...(patch.nonce !== undefined ? { nonce: patch.nonce } : {}),
            }, value.revision));
        },
        validate: (access, value) => definition.validate?.(value.values, access, client),
        payload: (access, value, existing) => definition.payload(value.values, access, existing),
        after: definition.after,
    };
}
function panelActions(definition) {
    return {
        publish: (client, context) => publishSavedMessage(client, context, panelPort(client, context, definition)),
        unpublish: (client, context) => retireSavedMessage(client, context, panelPort(client, context, definition)),
    };
}
module.exports = { panelPort, panelActions };
