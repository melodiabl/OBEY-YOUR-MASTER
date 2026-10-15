const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, DiscordAPIError, Message, PermissionFlagsBits } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "poll",
    category: "Administration",
    aliases: ["abstimmung", "umfrage", "poll"],
    cooldown: 2,
    usage: "poll --> Follow Steps / poll <TEXT> ... to create it instantly",
    description: "Creates a Poll",
    type: "server",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.poll");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.poll`);
                    }
                }
            }
            if (
                [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(message.author.id) && [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![message.guild.ownerId, config.ownerid].includes(message.author.id) &&
                !message.member.permissions.has([PermissionFlagsBits.Administrator])
            )
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["poll"]["variable1"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["poll"]["variable2"]), 4096)),
                    ],
                });
            if (!args[0]) {
                message
                    .reply({
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
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["poll"]["variable3"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["poll"]["variable4"]), 4096)),
                        ],
                    })
                    .then(msg => {
                        msg.channel
                            .awaitMessages({
                                filter: m => m.author.id === cmduser.id,
                                max: 1,
                                time: 30000,
                                errors: ["time"],
                            })
                            .then(collected => {
                                let channel = collected
                                    .first()
                                    .mentions.channels.filter(ch => ch.guild.id == message.guild.id)
                                    .first();
                                if (!channel)
                                    return message.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor(es.wrongcolor)
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["poll"]["variable5"]), 256)
                                                ),
                                        ],
                                    });

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
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["poll"]["variable6"]), 256))
                                                .setDescription(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["poll"]["variable7"]), 4096)
                                                ),
                                        ],
                                    })
                                    .then(msg => {
                                        msg.react(obeyUi.reaction("1️⃣"));
                                        msg.react(obeyUi.reaction("2️⃣"));
                                        msg.react(obeyUi.reaction("3️⃣"));
                                        msg.awaitReactions({
                                            filter: (reaction, user) => user.id === message.author.id,
                                            max: 1,
                                            time: 30000,
                                            errors: ["time"],
                                        }).then(collected => {
                                            let reaction = collected.first();
                                            if (obeyUi.matchesReaction(reaction.emoji, "1️⃣")) {
                                                message
                                                    .reply({
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
                                                                        client.la[ls]["cmds"]["administration"]["poll"][
                                                                            "variable8"
                                                                        ]
                                                                    ), 256)
                                                                )
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["administration"]["poll"][
                                                                            "variable9"
                                                                        ]
                                                                    ), 4096)
                                                                ),
                                                        ],
                                                    })
                                                    .then(msg => {
                                                        msg.channel
                                                            .awaitMessages({
                                                                filter: m => m.author.id === cmduser.id,
                                                                max: 1,
                                                                time: 30000,
                                                                errors: ["time"],
                                                            })
                                                            .then(collected => {
                                                                channel
                                                                    .send({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setColor(es.color)
                                                                                .setThumbnail(
                                                                                    es.thumb
                                                                                        ? es.footericon &&
                                                                                          (es.footericon.includes(
                                                                                              "http://"
                                                                                          ) ||
                                                                                              es.footericon.includes(
                                                                                                  "https://"
                                                                                              ))
                                                                                            ? es.footericon
                                                                                            : client.user.displayAvatarURL()
                                                                                        : null
                                                                                )
                                                                                .setAuthor(obeyMeta.asAuthor({ name: `${message.guild.name} | POLL`, iconURL: "https://images-ext-2.discordapp.net/external/QlX0Eh3_sIiPWIz9Xg_dgN4cwpvne8_ipgDGS43jDGc/https/emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/281/clipboard_1f4cb?.png", url: "https://discord.gg/fA8VGa4V" }))
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(
                                                                                        `by: ${message.author.username}`,
                                                                                        message.author.displayAvatarURL()
                                                                                    ))
                                                                                )
                                                                                .setDescription(obeyUi.limit(collected.first().content, 4096)),
                                                                        ],
                                                                    })
                                                                    .then(msg => {
                                                                        msg.react(obeyUi.reaction("✅"));
                                                                        msg.react(obeyUi.reaction("❌"));
                                                                    });
                                                            });
                                                    });
                                            } else if (obeyUi.matchesReaction(reaction.emoji, "2️⃣")) {
                                                message
                                                    .reply({
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
                                                                        client.la[ls]["cmds"]["administration"]["poll"][
                                                                            "variable10"
                                                                        ]
                                                                    ), 256)
                                                                )
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["administration"]["poll"][
                                                                            "variable11"
                                                                        ]
                                                                    ), 4096)
                                                                ),
                                                        ],
                                                    })
                                                    .then(msg => {
                                                        msg.channel
                                                            .awaitMessages({
                                                                filter: m => m.author.id === cmduser.id,
                                                                max: 1,
                                                                time: 30000,
                                                                errors: ["time"],
                                                            })
                                                            .then(collected => {
                                                                channel
                                                                    .send({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setColor(es.color)
                                                                                .setThumbnail(
                                                                                    es.thumb
                                                                                        ? es.footericon &&
                                                                                          (es.footericon.includes(
                                                                                              "http://"
                                                                                          ) ||
                                                                                              es.footericon.includes(
                                                                                                  "https://"
                                                                                              ))
                                                                                            ? es.footericon
                                                                                            : client.user.displayAvatarURL()
                                                                                        : null
                                                                                )
                                                                                .setAuthor(obeyMeta.asAuthor({ name: `${message.guild.name} | POLL`, iconURL: "https://images-ext-2.discordapp.net/external/QlX0Eh3_sIiPWIz9Xg_dgN4cwpvne8_ipgDGS43jDGc/https/emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/281/clipboard_1f4cb?.png", url: "https://discord.gg/fA8VGa4V" }))
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(
                                                                                        `by: ${message.author.username}`,
                                                                                        message.author.displayAvatarURL()
                                                                                    ))
                                                                                )
                                                                                .setDescription(obeyUi.limit(collected.first().content, 4096)),
                                                                        ],
                                                                    })
                                                                    .then(msg => {
                                                                        msg.react(obeyUi.reaction("👍"));
                                                                        msg.react(obeyUi.reaction("👎"));
                                                                    });
                                                            });
                                                    });
                                            } else if (obeyUi.matchesReaction(reaction.emoji, "3️⃣")) {
                                                var emojicounter = 0;
                                                var emojicontent = [];
                                                const emojis = [
                                                    "0️⃣",
                                                    "1️⃣",
                                                    "2️⃣",
                                                    "3️⃣",
                                                    "4️⃣",
                                                    "5️⃣",
                                                    "6️⃣",
                                                    "7️⃣",
                                                    "8️⃣",
                                                    "9️⃣",
                                                    "🔟",
                                                ];
                                                ask_emoji();
                                                function ask_emoji() {
                                                    if (emojicounter == 11) send_poll();
                                                    message
                                                        .reply({
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
                                                                            client.la[ls]["cmds"]["administration"]["poll"][
                                                                                "variable12"
                                                                            ]
                                                                        ), 256)
                                                                    )
                                                                    .setDescription(
                                                                        obeyUi.limit(eval(
                                                                            client.la[ls]["cmds"]["administration"]["poll"][
                                                                                "variable13"
                                                                            ]
                                                                        ), 4096)
                                                                    ),
                                                            ],
                                                        })
                                                        .then(msg => {
                                                            msg.channel
                                                                .awaitMessages({
                                                                    filter: m => m.author.id === cmduser.id,
                                                                    max: 1,
                                                                    time: 30000,
                                                                    errors: ["time"],
                                                                })
                                                                .then(collected => {
                                                                    if (
                                                                        String(collected.first().content).toLowerCase() ==
                                                                        "finish"
                                                                    )
                                                                        send_poll();
                                                                    else {
                                                                        emojicounter++;
                                                                        emojicontent.push(
                                                                            String(collected.first().content).substring(
                                                                                0,
                                                                                1024
                                                                            )
                                                                        );
                                                                        ask_emoji();
                                                                    }
                                                                });
                                                        })
                                                        .catch(e => {
                                                            send_poll();
                                                        });
                                                }
                                                function send_poll() {
                                                    message
                                                        .reply({
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
                                                                            client.la[ls]["cmds"]["administration"]["poll"][
                                                                                "variable14"
                                                                            ]
                                                                        ), 256)
                                                                    )
                                                                    .setDescription(
                                                                        obeyUi.limit(eval(
                                                                            client.la[ls]["cmds"]["administration"]["poll"][
                                                                                "variable15"
                                                                            ]
                                                                        ), 4096)
                                                                    ),
                                                            ],
                                                        })
                                                        .then(msg => {
                                                            msg.channel
                                                                .awaitMessages({
                                                                    filter: m => m.author.id === cmduser.id,
                                                                    max: 1,
                                                                    time: 30000,
                                                                    errors: ["time"],
                                                                })
                                                                .then(collected => {
                                                                    const embed = new EmbedBuilder()
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
                                                                        .setAuthor(obeyMeta.asAuthor({ name: `${message.guild.name} | POLL`, iconURL: "https://images-ext-2.discordapp.net/external/QlX0Eh3_sIiPWIz9Xg_dgN4cwpvne8_ipgDGS43jDGc/https/emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/281/clipboard_1f4cb?.png", url: "https://discord.gg/fA8VGa4V" }))
                                                                        .setFooter(obeyMeta.asFooter(client.getFooter(
                                                                                `by: ${message.author.username}`,
                                                                                message.author.displayAvatarURL()
                                                                            ))
                                                                        );
                                                                    if (collected.first().content.toLowerCase() != "no")
                                                                        embed.setDescription(obeyUi.limit(collected.first().content, 4096));

                                                                    for (let i = 0; i < emojicontent.length; i++) {
                                                                        embed.addFields({ name: emojis[i] + " :", value: emojicontent[i] });
                                                                    }
                                                                    channel.send({ embeds: [embed] }).then(msg => {
                                                                        for (let i = 0; i < emojicounter; i++) {
                                                                            msg.react(obeyUi.reaction(emojis[i]));
                                                                        }
                                                                    });
                                                                });
                                                        })
                                                        .catch(e => {
                                                            const embed = new EmbedBuilder()
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
                                                                .setAuthor(obeyMeta.asAuthor({ name: `${message.guild.name} | POLL`, iconURL: "https://images-ext-2.discordapp.net/external/QlX0Eh3_sIiPWIz9Xg_dgN4cwpvne8_ipgDGS43jDGc/https/emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/281/clipboard_1f4cb?.png", url: "https://discord.gg/fA8VGa4V" }))
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(
                                                                        `by: ${message.author.username}`,
                                                                        message.author.displayAvatarURL()
                                                                    ))
                                                                );
                                                            for (let i = 0; i < emojicontent.length; i++) {
                                                                embed.addFields({ name: emojis[i] + " :", value: emojicontent[i] });
                                                            }
                                                            channel.send({ embeds: [embed] }).then(msg => {
                                                                for (let i = 0; i < emojicounter; i++) {
                                                                    msg.react(obeyUi.reaction(emojis[i]));
                                                                }
                                                            });
                                                        });
                                                }
                                            } else {
                                                return message.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor(es.wrongcolor)
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["administration"]["poll"][
                                                                        "variable16"
                                                                    ]
                                                                ), 256)
                                                            ),
                                                    ],
                                                });
                                            }
                                        });
                                    });
                            });
                    });
            } else {
                message.delete().catch(e => console.log("Couldn't delete msg, this is a catch to prevent crash"));
                message.channel
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
                                .setAuthor(obeyMeta.asAuthor({ name: `${message.guild.name} | POLL`, iconURL: "https://images-ext-2.discordapp.net/external/QlX0Eh3_sIiPWIz9Xg_dgN4cwpvne8_ipgDGS43jDGc/https/emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/281/clipboard_1f4cb?.png", url: "https://discord.gg/fA8VGa4V" }))
                                .setFooter(obeyMeta.asFooter(client.getFooter(
                                        `by: ${message.author.username}`,
                                        message.author.displayAvatarURL()
                                    ))
                                )
                                .setDescription(obeyUi.limit(args.join(" "), 4096)),
                        ],
                    })
                    .then(msg => {
                        msg.react(obeyUi.reaction("👍"));
                        msg.react(obeyUi.reaction("👎"));
                    });
            }

            if (client.settings.get(message.guild.id, `adminlog`) != "no") {
                try {
                    var channel = message.guild.channels.cache.get(client.settings.get(message.guild.id, `adminlog`));
                    if (!channel) return client.settings.set(message.guild.id, "no", `adminlog`);
                    channel.send({
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
                                .setAuthor(obeyMeta.asAuthor({ name: `${require("path").parse(__filename).name} | ${message.author.username}`, iconURL: message.author.displayAvatarURL() }))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["poll"]["variable17"]), 4096))
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
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["poll"]["variable20"]), 4096)),
                ],
            });
        }
    },
};
/**
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 */
