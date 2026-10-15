const obeyMeta = require("./presentation/metadata")
const obeyUi = require("./assets/system")
//import the config.json file
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const { databasing, delay } = require(`./functions`);
const countermap = new Map();
const ms = require("ms");
module.exports = client => {
    client.on("messageUpdate", (oldMessage, newMessage) => {
        checkAntiCaps(newMessage);
    });
    client.on("messageCreate", message => {
        checkAntiCaps(message);
    });
    async function checkAntiCaps(message) {
        try {
            if (!message.guild || message.guild.available === false || !message.channel || message.author.bot) return;
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
            client.settings.ensure(message.guild.id, {
                anticaps: {
                    enabled: true,
                    whitelistedchannels: [],
                    percent: 75,
                },
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
            let anticaps = client.settings.get(message.guild.id, "anticaps");
            let mute_amount = anticaps.mute_amount;
            if (!anticaps.enabled) return;
            let es = client.settings.get(message.guild.id, "embed");
            if ((anticaps.whitelistedchannels || []).some(r => message.channel.parentId == r || message.channel.id == r)) return;
            let member = message.member;
            if (!message.content) return;
            if (message.content.split(" ").join("").length < 8) return;
            try {
                var uppercaselength = message.content.replace(/[^A-Z]/g, "").length;
                var wholelength = message.content.length;
                var percent = Math.ceil((uppercaselength / wholelength) * 100);
                if (percent >= anticaps.percent) {
                    if (autowarn.anticaps) {
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
                            reason: "AntiCaps Autowarn",
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
                                        obeyUi.limit(`> <@${message.author.id}> **received an autogenerated Warn - \`anticaps\`**!\n\n> **He now has \`${warnings.length} Warnings\`**`, 4096)
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
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable8"]), 256)),
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
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable9"]), 256))
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
                                                                client.la[ls]["cmds"]["administration"]["warn"]["variable13"]
                                                            ), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["administration"]["warn"]["variable14"]
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
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["warn"]["variable16"]), 256)),
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
                                                                client.la[ls]["cmds"]["administration"]["warn"]["variable20"]
                                                            ), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["administration"]["warn"]["variable21"]
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
                    if (message.channel.permissionsFor(message.channel.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
                        message.delete().catch(e => {
                            console.log(e);
                        });
                    } else {
                        message.channel.send(obeyUi.owned("❌ **I am missing the MANAGE_MESSAGES Permission!**")).then(m => {
                            setTimeout(() => {
                                m.delete().catch(() => {});
                            }, 3500);
                        });
                    }

                    if (!countermap.get(message.author.id)) countermap.set(message.author.id, 1);
                    setTimeout(() => {
                        countermap.set(message.author.id, Number(countermap.get(message.author.id)) - 1);
                        if (Number(countermap.get(message.author.id)) < 1) countermap.set(message.author.id, 1);
                    }, 15000);
                    countermap.set(message.author.id, Number(countermap.get(message.author.id)) + 1);

                    if (Number(countermap.get(message.author.id)) > mute_amount) {
                        let mutetime = 10 * 60 * 1000;
                        let reason = "Sending too much CAPS in a Message";

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
                                                    obeyUi.limit(eval(client.la[ls]["handlers"]["anticapsjs"]["anticaps"]["variable1"]), 256)
                                                )
                                                .setDescription(
                                                    obeyUi.limit(eval(client.la[ls]["handlers"]["anticapsjs"]["anticaps"]["variable2"]), 4096)
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
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["anticapsjs"]["anticaps"]["variable5"]), 256))
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["handlers"]["anticapsjs"]["anticaps"]["variable6"]), 4096)
                                        ),
                                ],
                            })
                            .then(msg =>
                                setTimeout(() => {
                                    msg.delete().catch(() => {});
                                }, 3000)
                            )
                            .catch(() => {});
                    }
                } else {
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
                                .setDescription(obeyUi.limit(eval(client.la[ls]["handlers"]["anticapsjs"]["anticaps"]["variable7"]), 4096)),
                        ],
                    })
                    .catch(() => {});
            }
        } catch (e) {
            console.log(String(e).grey);
        }
    }
};
