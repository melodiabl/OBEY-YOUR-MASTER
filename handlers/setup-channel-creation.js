const { randomBytes } = require('node:crypto');
const { requireSetupAccess } = require('./setup-access');
const { runSetupOperation } = require('./setup-operations');
const { serialize } = require('./setup-publications');
const fail = code => {
    throw Object.assign(new Error(code), {
        code
    });
};
// Channel creation has no Discord nonce API. Unknown outcomes require manual selection.
function createSetupChannel(client, context, port) {
    return runSetupOperation(client, () => serialize(client, `${context.guildId}:${port.key}`, async () => {
        let value = await port.read();
        if (value.channelId)
            return value.channelId;
        if (value.pending)
            fail('publication_uncertain');
        let access = await requireSetupAccess(client, context);
        await port.validate(access, value);
        const options = await port.options(access, value);
        access = await requireSetupAccess(client, context);
        await port.validate(access, value);
        if (client._shuttingDown || context.isActive && !context.isActive())
            fail('setup_unavailable');
        value = await port.save(value, {
            pending: randomBytes(12).toString('hex')
        });
        if (client._shuttingDown || context.isActive && !context.isActive()) {
            await port.save(value, {
                pending: ''
            });
            fail('setup_unavailable');
        }
        let channel;
        try {
            channel = await access.guild.channels.create(options);
        }
        catch (error) {
            if ([400, 401, 403, 404].includes(error.status)) {
                await port.save(value, {
                    pending: ''
                });
                throw error;
            }
            fail('publication_uncertain');
        }
        try {
            await port.save(value, {
                channelId: channel.id, pending: ''
            });
        }
        catch {
            fail('publication_uncertain');
        }
        return channel.id;
    }));
}
module.exports = {
    createSetupChannel
};
