const { createWarning, requireManualWarningAccess } = require('../application/create-warning')
const { t, localeFor } = require('../../../../handlers/i18n')
const obeyMeta = require("../../../../handlers/presentation/metadata")
const { EmbedBuilder } = require(`discord.js`);
const runPrefixWarn = async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            const hinted = message.mentions.members.filter(member => member.guild.id === message.guild.id).first()
                || message.guild.members.cache.get(args[0] || '');
            const targetId = hinted?.id || message.mentions.users.first()?.id || (/^\d{17,20}$/.test(args[0] || '') ? args[0] : null);
            const warnmember = targetId ? await message.guild.members.fetch({ user: targetId, force: true }).catch(() => null) : null;
            if (!warnmember)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable3"]))
                            .setDescription(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable4"])),
                    ],
                });

            let reason = args.slice(1).join(` `);
            if (!reason) {
                reason = `NO REASON`;
            }
            reason = reason.slice(0, 1000).toWellFormed();

            try {
                const { count, globalCount, escalationCount } = await createWarning(client, {
                    guildId: message.guild.id, userId: warnmember.user.id, moderatorId: message.author.id, reason, origin: 'prefix',
                }, {
                    authorize: () => requireManualWarningAccess(client, message.guild, message.author.id, warnmember.user.id, 'prefix'),
                });
                try { client.stats.push(message.guild.id + message.author.id, new Date().getTime(), 'warn') } catch {}
                const warnings = { length: count ?? '?' };
                warnmember
                    .send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.color)
                                .setThumbnail(
                                    es.thumb
                                        ? es.footericon &&
                                          (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                            ? es.footericon
                                            : client.user.displayAvatarURL()
                                        : null
                                )
                                .setFooter(obeyMeta.asFooter(client.getFooter(
                                        `You have: ${globalCount ?? '?'} Global Warns`,
                                        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/joypixels/275/globe-with-meridians_1f310.png"
                                    ))
                                )

                                .setAuthor(obeyMeta.asAuthor({ name: `You've got warned by: ${message.author.username}`, iconURL: message.author.displayAvatarURL() }))
                                .setDescription(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable6"])),
                        ],
                    })
                    .catch(e => console.log(e.message));

                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.color)
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : null
                            )
                            .setFooter(obeyMeta.asFooter(client.getFooter(
                                    `${count ?? '?'} advertencias en este servidor`,
                                    "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/joypixels/275/globe-with-meridians_1f310.png"
                                ))
                            )

                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable7"]))
                            .setThumbnail(
                                warnmember.user.displayAvatarURL()
                            )
                            .setDescription(
                                `**He now has: ${warnings.length} Warnings in ${message.guild.name}**`.substring(0, 2048)
                            ),
                    ],
                });

                let warnsettings = client.settings.get(message.guild.id, "warnsettings") || {};
                if (warnsettings.kick && warnsettings.kick == escalationCount) {
                    if (!warnmember.kickable)
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable8"])),
                            ],
                        });
                    try {
                        warnmember.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable9"]))
                                    .setDescription(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable10"])),
                            ],
                        });
                    } catch {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable11"]))
                                    .setDescription(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable12"])),
                            ],
                        });
                    }
                    try {
                        warnmember
                            .kick({
                                reason: `Reached ${warnings.length} Warnings`,
                            })
                            .then(() => {
                                message.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(es.color)
                                            .setThumbnail(
                                                es.thumb
                                                    ? es.footericon &&
                                                      (es.footericon.includes("http://") ||
                                                          es.footericon.includes("https://"))
                                                        ? es.footericon
                                                        : client.user.displayAvatarURL()
                                                    : null
                                            )
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable13"]))
                                            .setDescription(
                                                eval(client.la[ls]["cmds"]["administration"]["warn"]["variable14"])
                                            ),
                                    ],
                                });
                            });
                    } catch (e) {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(client.la[ls].common.erroroccur)
                                    .setDescription(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable15"])),
                            ],
                        });
                    }
                }
                if (warnsettings.ban && warnsettings.ban == escalationCount) {
                    if (!warnmember.bannable)
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable16"])),
                            ],
                        });
                    try {
                        warnmember.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable17"])),
                            ],
                        });
                    } catch {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable18"]))
                                    .setDescription(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable19"])),
                            ],
                        });
                    }
                    try {
                        warnmember
                            .ban({
                                reason: `Reached ${warnings.length} Warnings`,
                            })
                            .then(() => {
                                message.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(es.color)
                                            .setThumbnail(
                                                es.thumb
                                                    ? es.footericon &&
                                                      (es.footericon.includes("http://") ||
                                                          es.footericon.includes("https://"))
                                                        ? es.footericon
                                                        : client.user.displayAvatarURL()
                                                    : null
                                            )
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable20"]))
                                            .setDescription(
                                                eval(client.la[ls]["cmds"]["administration"]["warn"]["variable21"])
                                            ),
                                    ],
                                });
                            });
                    } catch (e) {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable22"]))
                                    .setDescription(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable23"])),
                            ],
                        });
                    }
                }
                for (const role of Array.isArray(warnsettings.roles) ? warnsettings.roles : []) {
                    if (Number.isSafeInteger(escalationCount) && role.warncount == escalationCount) {
                        if (!warnmember.roles.cache.has(role.roleid)) {
                            warnmember.roles.add(role.roleid).catch(O => {});
                        }
                    }
                }
                if (client.settings.get(message.guild.id, `adminlog`) != "no") {
                    try {
                        var channel = message.guild.channels.cache.get(client.settings.get(message.guild.id, `adminlog`));
                        if (channel) await channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setAuthor(obeyMeta.asAuthor({ name: `warn | ${message.author.username}`, iconURL: message.author.displayAvatarURL() }))
                                    .setDescription(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable24"]))
                                    .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable15"]) })
                                    .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable16"]) })
                                    .setTimestamp()
                                    .setFooter(obeyMeta.asFooter(client.getFooter(
                                            "ID: " + message.author.id,
                                            message.author.displayAvatarURL()
                                        ))
                                    ),
                            ],
                        });
                    } catch (e) {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                    }
                }
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                return message.reply({
                    content: t(localeFor(client, message.guild.id), 'moderationHistory.writeUnconfirmed'),
                    allowedMentions: { parse: [], repliedUser: false },
                });
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable29"]))
                        .setDescription(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable30"])),
                ],
            });
        }
}
module.exports = { runPrefixWarn }
