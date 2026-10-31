const { randomUUID } = require('node:crypto');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, escapeMarkdown } = require('discord.js');
const { prepareSlashPublication, confirmSlashPublication } = require('./slash-publication');
const { localeFor, t } = require('./i18n');
async function runSlashPublication(client, message, args = [], options = {}) {
    const context = { guildId: message.guild?.id, channelId: message.channelId || message.channel?.id, actorId: message.author.id };
    let locale = 'es', localeFailure = false;
    try {
        const value = localeFor(client, context.guildId);
        if (typeof value !== 'string' || value.length > 32 || !/^(?:es|en|de|in)(?:[-_][a-z0-9]{2,8})*$/i.test(value))
            localeFailure = true;
        else
            locale = value;
    }
    catch {
        localeFailure = true;
    }
    const notice = (key, vars) => ({ content: t(locale, `slashPublication.${key}`, vars), embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } }), reply = async (p) => { try {
        return await message.reply(p);
    }
    catch {
        return null;
    } };
    const failure = e => notice(({ setup_denied: 'denied', slash_target: 'target', slash_conflict: 'conflict', slash_expired: 'expired', slash_busy: 'busy', slash_timeout: 'timeout', slash_unconfirmed: 'unconfirmed', slash_catalog: 'catalog', slash_remote: 'remote' })[e?.code] || 'unavailable');
    if (localeFailure)
        return reply(notice('unavailable'));
    if (!Array.isArray(args) || args.length > 1 || args.length === 1 && (typeof args[0] !== 'string' || args[0] !== 'global' && !/^\d{17,20}$/.test(args[0])))
        return reply(notice('usage'));
    let prepared;
    try {
        prepared = await prepareSlashPublication(client, context, args.length && args[0] !== 'global' ? args[0] : null, options);
    }
    catch (e) {
        return reply(failure(e));
    }
    const token = randomUUID(), yes = `slash-publish:${token}:yes`, no = `slash-publish:${token}:no`, row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(yes).setLabel(t(locale, 'slashPublication.confirm')).setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId(no).setLabel(t(locale, 'slashPublication.cancel')).setStyle(ButtonStyle.Secondary));
    const prompt = await reply({ ...notice('preview', { target: prepared.target ? `${escapeMarkdown(prepared.name)} (${prepared.target})` : t(locale, 'slashPublication.global'), roots: prepared.roots, invocations: prepared.invocations, added: prepared.added, changed: prepared.changed, removed: prepared.removed }), components: [row] });
    if (!prompt)
        return;
    let collector, finished = false, busy = false;
    try {
        collector = prompt.createMessageComponentCollector({ time: Math.max(1, prepared.expiresAt - Date.now()), filter: b => b.guildId === context.guildId && b.message?.id === prompt.id && [yes, no].includes(b.customId) && b.isButton() });
    }
    catch {
        await prompt.edit(notice('unavailable')).catch(() => { });
        return;
    }
    collector.on('collect', b => {
        ;
        (async () => {
            if (b.user.id !== context.actorId) {
                await b.reply({ ...notice('notYours'), ephemeral: true }).catch(() => { });
                return;
            }
            if (finished || busy) {
                await b.deferUpdate().catch(() => { });
                return;
            }
            busy = true;
            try {
                await b.deferUpdate();
                if (finished)
                    return;
                finished = true;
                collector.stop('claimed');
                if (b.customId === no) {
                    await b.editReply(notice('cancelled'));
                    return;
                }
                let payload;
                try {
                    const result = await confirmSlashPublication(client, context, prepared, { ...options, beforeEffect: () => b.editReply(notice('requesting')) });
                    payload = notice(result.status === 'unchanged' ? 'unchanged' : 'confirmed');
                }
                catch (e) {
                    payload = failure(e);
                }
                try {
                    await b.editReply(payload);
                }
                catch {
                    await prompt.edit(payload).catch(() => { });
                }
            }
            catch {
                finished = true;
                collector.stop('failed');
                await prompt.edit(notice('unavailable')).catch(() => { });
            }
            finally {
                busy = false;
            }
        })().catch(() => { });
    });
    collector.on('end', () => { if (!finished) {
        finished = true;
        prompt.edit(notice('expired')).catch(() => { });
    } });
    return prompt;
}
module.exports = { runSlashPublication };
