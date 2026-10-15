const obeyMeta = require("./presentation/metadata")
const obeyUi = require("./assets/system")
//import the config.json file
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const ms = require("ms");
var { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const { databasing } = require(`./functions`);
const countermap = new Map();
module.exports = client => {
    client.on("messageCreate", async message => {
        try {
            if (!message.guild || message.guild.available === false || !message.channel || message.author.bot) return;

            if (!client.settings.has(message.guild.id, "language"))
                client.settings.ensure(message.guild.id, { language: "es" });
            let ls = client.settings.get(message.guild.id, "language");
            client.settings.ensure(message.guild.id, {
                adminroles: [],
            });
            var adminroles = client.settings.get(message.guild.id, "adminroles");
            if (
                (adminroles &&
                    adminroles.length > 0 &&
                    [...message.member.roles.cache.values()].length > 0 &&
                    message.member.roles.cache.some(r => adminroles.includes(r ? r.id : r))) ||
                [message.guild.ownerId, config.ownerid].includes(message.author.id) ||
                message.member.permissions.has(PermissionFlagsBits.Administrator)
            )
                return;
            client.blacklist.ensure(message.guild.id, {
                words: [],
                mute_amount: 5,
                whitelistedchannels: [],
            });
            client.settings.ensure(message.guild.id, {
                autowarn: {
                    antispam: false,
                    antiselfbot: false,
                    antimention: false,
                    antilinks: false,
                    antidiscord: false,
                    anticaps: false,
                    blacklist: false,
                    ghost_ping_detector: false,
                },
            });
            let autowarn = client.settings.get(message.guild.id, "autowarn");
            let blacklistwords = client.blacklist.get(message.guild.id, "words");
            if (
                (client.blacklist
                    .get(message.guild.id, "whitelistedchannels") || [])
                    .some(r => message.channel.parentId == r || message.channel.id == r)
            )
                return;
            let mute_amount = client.blacklist.get(message.guild.id, "mute_amount");
            let es = client.settings.get(message.guild.id, "embed");
            try {
                for (const blacklistword of blacklistwords) {
                    if (message.content.toLowerCase().includes(blacklistword)) {
                        if (autowarn.blacklist) {
                            client.userProfiles.ensure(message.author.id, {
                                id: message.author.id,
                                guild: message.guild.id,
                                totalActions: 0,
                                warnings: [],
                                kicks: [],
                            });
                            const newActionId = client.modActions.autonum;
                            client.modActions.set(newActionId, {
                                user: message.author.id,
                                guild: message.guild.id,
                                type: "warning",
                                moderator: message.author.id,
                                reason: "Blacklist Autowarn",
                                when: new Date().toLocaleString(`de`),
                                oldhighesrole: message.member.roles ? message.member.roles.highest : `Had No Roles`,
                                oldthumburl: message.author.displayAvatarURL(),
                            });
                            // Push the action to the user's warnings
                            client.userProfiles.push(message.author.id, newActionId, "warnings");
                            client.userProfiles.inc(message.author.id, "totalActions");
                            client.stats.push(message.guild.id + message.author.id, new Date().getTime(), "warn");
                            const warnIDs = client.userProfiles.get(message.author.id, "warnings");
                            const warnData = warnIDs.map(id => client.modActions.get(id));
                            let warnings = warnData.filter(v => v.guild == message.guild.id);
                            message.channel.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setAuthor(
                                            obeyMeta.asAuthor(client.getAuthor(
                                                message.author.username,
                                                message.member.displayAvatarURL()
                                            ))
                                        )
                                        .setColor("#E67E22")
                                        .setFooter(obeyMeta.asFooter(client.getFooter(
                                                "ID: " + message.author.id,
                                                message.author.displayAvatarURL()
                                            ))
                                        )
                                        .setDescription(
                                            obeyUi.limit(`> <@${message.author.id}> **received an autogenerated Warn - \`blacklist\`**!\n\n> **He now has \`${warnings.length} Warnings\`**`, 4096)
                                        ),
                                ],
                            });
                            let warnsettings = client.settings.get(message.guild.id, "warnsettings");
                            if (warnsettings.kick && warnsettings.kick == warnings.length) {
                                if (!message.member.kickable)
                                    message.channel.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor(es.wrongcolor)
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable8"]), 256)
                                                ),
                                        ],
                                    });
                                else {
                                    try {
                                        message.member.send({
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
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable9"]), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable10"]), 4096)
                                                    ),
                                            ],
                                        });
                                    } catch {
                                        return message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable11"]), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable12"]), 4096)
                                                    ),
                                            ],
                                        });
                                    }
                                    try {
                                        message.member
                                            .kick({
                                                reason: `Reached ${warnings.length} Warnings`,
                                            })
                                            .then(() => {
                                                message.channel.send({
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
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["administration"]["warn"][
                                                                        "variable13"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setDescription(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["administration"]["warn"][
                                                                        "variable14"
                                                                    ]
                                                                ), 4096)
                                                            ),
                                                    ],
                                                });
                                            });
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                        message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable15"]), 4096)
                                                    ),
                                            ],
                                        });
                                    }
                                }
                            }
                            if (warnsettings.ban && warnsettings.ban == warnings.length) {
                                if (!message.member.bannable)
                                    message.channel.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor(es.wrongcolor)
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable16"]), 256)
                                                ),
                                        ],
                                    });
                                else {
                                    try {
                                        message.member.send({
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
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable17"]), 256)
                                                    ),
                                            ],
                                        });
                                    } catch {
                                        message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable18"]), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable19"]), 4096)
                                                    ),
                                            ],
                                        });
                                    }
                                    try {
                                        message.member
                                            .ban({
                                                reason: `Reached ${warnings.length} Warnings`,
                                            })
                                            .then(() => {
                                                message.channel.send({
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
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["administration"]["warn"][
                                                                        "variable20"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setDescription(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["administration"]["warn"][
                                                                        "variable21"
                                                                    ]
                                                                ), 4096)
                                                            ),
                                                    ],
                                                });
                                            });
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                        message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable22"]), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable23"]), 4096)
                                                    ),
                                            ],
                                        });
                                    }
                                }
                            }
                            for (const role of warnsettings.roles) {
                                if (role.warncount == warnings.length) {
                                    if (!message.member.roles.cache.has(role.roleid)) {
                                        message.member.roles.add(role.roleid).catch(O => {});
                                    }
                                }
                            }
                        }
                        await message.delete().catch(e => console.log("PREVENTED A BUG"));

                        if (!countermap.get(message.author.id)) countermap.set(message.author.id, 1);
                        setTimeout(() => {
                            countermap.set(message.author.id, Number(countermap.get(message.author.id)) - 1);
                            if (Number(countermap.get(message.author.id)) < 0) countermap.set(message.author.id, 1);
                        }, 15000);
                        countermap.set(message.author.id, Number(countermap.get(message.author.id)) + 1);

                        if (Number(countermap.get(message.author.id)) > mute_amount) {
                            let member = message.member;
                            let time = 10 * 60 * 1000;
                            let mutetime = time;
                            let reason = "Sending 1 or more Blacklisted Word(s)";

                            member
                                .timeout(mutetime, reason)
                                .then(() => {
                                    message.channel
                                        .send({
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
                                                    .setTitle(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["handlers"]["blacklistjs"]["blacklist"][
                                                                "variable1"
                                                            ]
                                                        ), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["handlers"]["blacklistjs"]["blacklist"][
                                                                "variable2"
                                                            ]
                                                        ), 4096)
                                                    ),
                                            ],
                                        })
                                        .catch(() => {});
                                })
                                .catch(() => {
                                    return message.channel.send(`${obeyUi.markup("icon.error")} **I could not timeout ${member.user.username}**`).then(m => {
                                        setTimeout(() => {
                                            m.delete().catch(() => {});
                                        }, 5000);
                                    });
                                });

                            countermap.set(message.author.id, 1);
                        } else {
                            return message.channel
                                .send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(es.wrongcolor)
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                            .setTitle(
                                                obeyUi.limit(eval(client.la[ls]["handlers"]["blacklistjs"]["blacklist"]["variable5"]), 256)
                                            ),
                                    ],
                                })
                                .then(msg => {
                                    setTimeout(() => {
                                        msg.delete().catch(() => {});
                                    }, 3000);
                                })
                                .catch(() => {});
                        }
                    } else {
                        // Do nothing ;)
                    }
                }
            } catch (e) {
                console.log(String(e.stack).grey.bgRed);
                return message.channel
                    .send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["handlers"]["blacklistjs"]["blacklist"]["variable6"]), 4096)),
                        ],
                    })
                    .catch(() => {});
            }
        } catch (e) {
            console.log(String(e).grey);
        }
    });
};
