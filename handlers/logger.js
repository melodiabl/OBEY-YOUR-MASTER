const Discord = require("discord.js");
const { ChannelType } = Discord;
const moment = require("moment");

// Maps each log type to its settings key (matches dashboard logChannels.*)
const LOG_CHANNELS = {
    server:     ['logChannels.server',     'logger.channel'],
    members:    ['logChannels.members',    'logger.channel'],
    moderation: ['logChannels.moderation', 'logger.channel'],
    messages:   ['logChannels.messages',   'logger.channel'],
    voice:      ['logChannels.voice',      'logger.channel'],
};

function getLogChannel(c, guildId, logType) {
    const keys = LOG_CHANNELS[logType] || LOG_CHANNELS.server;
    for (const key of keys) {
        const val = c.settings.get(guildId, key);
        if (val && val !== 'no') return val;
    }
    // Old-format fallback: logger.channel
    const old = c.settings.get(guildId, 'logger');
    if (old?.channel && old.channel !== 'no') return old.channel;
    return null;
}

module.exports = c => {
    // ─── SERVER EVENTS ────────────────────────────────────────────────────────
    c.on("channelCreate", channel => {
        send_log(c, channel.guild, 'server', "#57F287", "Channel CREATED",
            `**Channel:** \`${channel?.name}\`\n**ID:** \`${channel.id}\`\n**Type:** \`${channel.type}\``);
    });
    c.on("channelDelete", channel => {
        send_log(c, channel.guild, 'server', "#ED4245", "Channel DELETED",
            `**Channel:** \`${channel?.name}\`\n**ID:** \`${channel.id}\`\n**Type:** \`${channel.type}\``);
    });
    c.on("channelPinsUpdate", (channel, time) => {
        send_log(c, channel.guild, 'server', "#FEE75C", "Channel PINS UPDATE",
            `**Channel:** \`${channel?.name}\` (\`${channel.id}\`)\n**Pinned at:** \`${time}\``);
    });
    c.on("channelUpdate", (oldCh, newCh) => {
        if (oldCh?.name !== newCh?.name) {
            send_log(c, oldCh.guild, 'server', "#FEE75C", "Channel UPDATED — NAME",
                `**Before:** \`${oldCh?.name}\`\n**After:** \`${newCh?.name}\`\n**ID:** \`${oldCh.id}\``);
        } else if (oldCh.type !== newCh.type) {
            send_log(c, oldCh.guild, 'server', "#FEE75C", "Channel UPDATED — TYPE",
                `**Channel:** \`${oldCh?.name}\` (\`${oldCh.id}\`)`);
        } else if (oldCh.topic !== newCh.topic) {
            send_log(c, oldCh.guild, 'server', "#FEE75C", "Channel UPDATED — TOPIC",
                `**Channel:** \`${oldCh?.name}\` (\`${oldCh.id}\`)\n**Topic:** \`${newCh.topic || '—'}\``);
        }
    });

    c.on("emojiCreate", emoji => {
        send_log(c, emoji?.guild, 'server', "#57F287", "Emoji CREATED",
            `${emoji}  \`${emoji?.name}\`  (ID: \`${emoji?.id}\`)`);
    });
    c.on("emojiDelete", emoji => {
        send_log(c, emoji?.guild, 'server', "#ED4245", "Emoji DELETED",
            `\`${emoji?.name}\`  (ID: \`${emoji?.id}\`)`);
    });
    c.on("emojiUpdate", (oldE, newE) => {
        send_log(c, newE?.guild, 'server', "#E67E22", "Emoji NAME CHANGED",
            `${newE}  **Before:** \`${oldE?.name}\` → **After:** \`${newE?.name}\`  (ID: \`${newE?.id}\`)`);
    });

    c.on("roleCreate", role => {
        send_log(c, role.guild, 'server', "#57F287", "Role CREATED",
            `${role}  \`${role?.name}\`  (ID: \`${role.id}\`)\nColor: \`${role.hexColor}\`  Position: \`${role.position}\``);
    });
    c.on("roleDelete", role => {
        send_log(c, role.guild, 'server', "#ED4245", "Role DELETED",
            `\`${role?.name}\`  (ID: \`${role.id}\`)\nColor: \`${role.hexColor}\`  Position: \`${role.position}\``);
    });
    c.on("roleUpdate", (oldRole, newRole) => {
        if (oldRole?.name !== newRole?.name) {
            send_log(c, oldRole.guild, 'server', "#E67E22", "Role NAME CHANGED",
                `${newRole}  **Before:** \`${oldRole.name}\` → **After:** \`${newRole.name}\`  (ID: \`${newRole.id}\`)`);
        } else if (oldRole.color !== newRole.color) {
            send_log(c, oldRole.guild, 'server', "#E67E22", "Role COLOR CHANGED",
                `${newRole}  **Before:** \`#${oldRole.color.toString(16).padStart(6,'0')}\` → **After:** \`${newRole.hexColor}\`  (ID: \`${newRole.id}\`)`);
        }
    });

    // ─── MEMBER EVENTS ────────────────────────────────────────────────────────
    c.on("guildMemberAdd", member => {
        const u = member.user;
        if (!u.bot) {
            send_log(c, member.guild, 'members', "#57F287", "Member JOINED",
                `${u} (\`${u.id}\`)\n**Username:** \`${u.username}\`\n**Account created:** \`${moment(u.createdTimestamp).format("DD/MM/YYYY HH:mm:ss")}\``,
                u.displayAvatarURL());
        } else {
            send_log(c, member.guild, 'members', "#E67E22", "Bot ADDED",
                `${u} (\`${u.id}\`)\n**Username:** \`${u.username}\`\n**Created:** \`${moment(u.createdTimestamp).format("DD/MM/YYYY")}\``);
        }
    });

    const banMap = new Map();

    c.on("guildMemberRemove", member => {
        setTimeout(() => {
            if (banMap.has(member.id)) { banMap.delete(member.id); return; }
            const u = member.user;
            send_log(c, member.guild, 'members', "#ED4245", "Member LEFT",
                `${u} (\`${u.id}\`)  **\`${u.username}\`**`,
                u.displayAvatarURL());
        }, 500);
    });

    c.on("guildMembersChunk", (members, guild) => {
        const list = [...members.values()].slice(0, 20)
            .map((m, i) => `${i+1}) ${m.user} — \`${m.user.username}\` — \`${m.user.id}\``)
            .join("\n");
        send_log(c, guild, 'members', "#ED4245",
            `⚠️ MEMBER CHUNK / RAID — [${members.size}] Members`,
            list + (members.size > 20 ? `\n… ${members.size - 20} more` : ''));
    });

    c.on("guildMemberUpdate", (oldMember, newMember) => {
        const oldRoles = [...oldMember.roles.cache.keys()];
        const newRoles = [...newMember.roles.cache.keys()];
        const added   = newRoles.filter(x => !oldRoles.includes(x));
        const removed = oldRoles.filter(x => !newRoles.includes(x));
        if (!added.length && !removed.length) return;
        const text = [
            removed.length ? `❌ **Removed:** ${removed.map(r => `<@&${r}>`).join(', ')}` : '',
            added.length   ? `✅ **Added:** ${added.map(r => `<@&${r}>`).join(', ')}`   : '',
        ].filter(Boolean).join('\n');
        send_log(c, oldMember.guild, 'members',
            added.length ? "#57F287" : "#ED4245",
            "Member ROLES Changed",
            `${newMember.user} (\`${newMember.user.username}\`)\n\n${text}`);
    });

    // ─── MODERATION EVENTS ────────────────────────────────────────────────────
    c.on("guildBanAdd", ban => {
        banMap.set(ban.user.id, true);
        send_log(c, ban.guild, 'moderation', "#ED4245", "⚠️ Member BANNED",
            `${ban.user} (\`${ban.user.id}\`)  \`${ban.user.username}\`\n**Reason:** ${ban.reason || 'No reason provided'}`,
            ban.user.displayAvatarURL());
    });
    c.on("guildBanRemove", ban => {
        send_log(c, ban.guild, 'moderation', "#E67E22", "⛔ Member UNBANNED",
            `${ban.user} (\`${ban.user.id}\`)  \`${ban.user.username}\`\n**Reason was:** ${ban.reason || 'No reason provided'}`,
            ban.user.displayAvatarURL());
    });

    // ─── MESSAGE EVENTS ────────────────────────────────────────────────────────
    c.on("messageDelete", message => {
        if (!message.guild) return;
        const attachments = [...(message.attachments?.values() || [])].map(x => x.proxyURL).join("\n");
        const embed = build_embed(c, message.guild, "#E67E22", "Message DELETED",
            `**Author:** <@${message.author?.id}> — \`${message.author?.username || '?'}\`\n**Channel:** <#${message.channel?.id}> — \`${message.channel?.name}\`\n**Date:** ${message.createdAt}\n\n**Content:**\n\`\`\`\n${(message.content || '').replace(/`/g, "'").substring(0, 1800)}\n\`\`\``);
        if (attachments) embed.addFields({ name: 'Attachments', value: attachments.substring(0, 1024) });
        send_embed(c, message.guild, 'messages', embed);
    });
    c.on("messageDeleteBulk", messages => {
        if (!messages.first()?.guild) return;
        send_log(c, messages.first().guild, 'messages', "#ED4245",
            `[${messages.size}] Messages BULK Deleted`,
            `${messages.size} messages deleted in <#${messages.first()?.channel?.id}>`);
    });
    c.on("messageUpdate", (oldMsg, newMsg) => {
        if (oldMsg.author?.bot || newMsg.author?.bot) return;
        if (oldMsg.channel.type !== ChannelType.GuildText) return;
        if (oldMsg.content === newMsg.content) return;
        send_log(c, oldMsg.guild, 'messages', "#FEE75C", "Message EDITED",
            `**Author:** <@${newMsg.author.id}> — \`${newMsg.author.username}\`\n**Channel:** <#${newMsg.channel?.id}> — \`${newMsg.channel?.name}\`\n\n**Before:**\n\`\`\`\n${(oldMsg.content || '?').replace(/`/g, "'").substring(0, 900)}\n\`\`\`\n**After:**\n\`\`\`\n${(newMsg.content || '?').replace(/`/g, "'").substring(0, 900)}\n\`\`\``);
    });

    // ─── VOICE EVENTS ─────────────────────────────────────────────────────────
    c.on("voiceStateUpdate", (oldState, newState) => {
        const isTrivial = s1 => s2 =>
            (s1.streaming !== s2.streaming) || (s1.serverDeaf !== s2.serverDeaf) ||
            (s1.serverMute !== s2.serverMute) || (s1.selfDeaf !== s2.selfDeaf) ||
            (s1.selfMute !== s2.selfMute) || (s1.selfVideo !== s2.selfVideo);
        if (isTrivial(oldState)(newState)) return;
        const u = newState.member?.user;
        if (!u) return;
        if (!oldState.channelId && newState.channelId) {
            send_log(c, newState.guild, 'voice', "#57F287", "Voice JOINED",
                `${u} (\`${u.id}\`)  \`${u.username}\`\n**Channel:** <#${newState.channelId}> \`${newState.channel?.name}\``);
        } else if (oldState.channelId && !newState.channelId) {
            send_log(c, newState.guild, 'voice', "#ED4245", "Voice LEFT",
                `${u} (\`${u.id}\`)  \`${u.username}\`\n**Channel:** <#${oldState.channelId}> \`${oldState.channel?.name}\``);
        } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            send_log(c, newState.guild, 'voice', "#57F287", "Voice SWITCHED",
                `${u} (\`${u.id}\`)  \`${u.username}\`\n**From:** <#${oldState.channelId}>\n**To:** <#${newState.channelId}>`);
        }
    });
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function build_embed(c, guild, color, title, description, thumb) {
    return new Discord.EmbedBuilder()
        .setColor(color || "#23272A")
        .setTitle((title || '').substring(0, 256))
        .setDescription((description || '​').substring(0, 2048))
        .setThumbnail(thumb || guild?.iconURL() || undefined)
        .setFooter({ text: `${guild?.name || ''} • OBEY YOUR MASTER`, iconURL: guild?.iconURL() || undefined })
        .setTimestamp();
}

async function send_embed(c, guild, logType, embed) {
    try {
        if (!guild || guild?.available === false) return;
        const channelId = getLogChannel(c, guild.id, logType);
        if (!channelId) return;
        const ch = await c.channels.fetch(channelId).catch(() => null);
        if (!ch) return;
        await ch.send({ embeds: [embed] }).catch(() => {});
    } catch {}
}

async function send_log(c, guild, logType, color, title, description, thumb, ...fields) {
    const embed = build_embed(c, guild, color, title, description, thumb);
    for (let i = 0; i < fields.length - 1; i += 2) {
        const name = fields[i], value = fields[i + 1];
        if (name && value && value.trim() !== '>>>') {
            embed.addFields({ name: name.substring(0, 256), value: value.substring(0, 1024) });
        }
    }
    await send_embed(c, guild, logType, embed);
}
