const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
module.exports = {
    name: "setup-tiktok",
    category: "Setup",
    aliases: ["setuptiktok", "tiktok-setup", "tiktoksetup"],
    cooldown: 5,
    usage: "setup-tiktok  -->  Follow Steps",
    description: "Manage the tiktok logger, addstreamer, editstreamer, removestreamer, etc.",
    memberpermissions: ['Administrador'],
    type: "fun",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            var adminroles = client.settings.get(message.guild.id, "adminroles");

            var timeouterror = false;
            var filter = (reaction, user) => {
                return user.id === message.author.id;
            };
            var temptype = "";
            var tempmsg;
            tempmsg = await message.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable1"]), 256))
                        .setColor(es.color)
                        .setDescription(
                            obeyUi.limit(`${obeyUi.markup("icon.ordinal-1")} **== Set** Discord **Canal** for Posting new Vids
        
${obeyUi.markup("icon.ordinal-2")} **== Add** tiktok Canal
        
${obeyUi.markup("icon.ordinal-3")} **== Remove** tiktok Canal

${obeyUi.markup("icon.ordinal-4")} **== Edit** tiktok Canal



*React with the Right Emoji according to the Right action*`, 4096)
                        )
                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                ],
            });
            try {
                tempmsg.react(obeyUi.reaction("1️⃣"));
                tempmsg.react(obeyUi.reaction("2️⃣"));
                tempmsg.react(obeyUi.reaction("3️⃣"));
                tempmsg.react(obeyUi.reaction("4️⃣"));
            } catch (e) {
                return message.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable2"]), 256))
                            .setColor(es.wrongcolor)
                            .setDescription(
                                obeyUi.limit(`\`\`\` ${e.message ? e.message : e.stack ? String(e.stack).grey.substring(0, 2000) : String(e).grey.substring(0, 2000)}\`\`\``.substring(
                                    0,
                                    2000
                                ), 4096)
                            )
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                });
            }
            await tempmsg
                .awaitReactions({ filter, max: 1, time: 90000, errors: ["time"] })
                .then(collected => {
                    var reaction = collected.first();
                    reaction.users.remove(message.author.id);
                    if (obeyUi.matchesReaction(reaction.emoji, "1️⃣")) temptype = "set";
                    else if (obeyUi.matchesReaction(reaction.emoji, "2️⃣")) temptype = "add";
                    else if (obeyUi.matchesReaction(reaction.emoji, "3️⃣")) temptype = "remove";
                    else if (obeyUi.matchesReaction(reaction.emoji, "4️⃣")) temptype = "edit";
                    else throw "You reacted with a wrong emoji";
                })
                .catch(e => {
                    timeouterror = e;
                });
            if (timeouterror)
                return message.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable3"]), 256))
                            .setColor(es.wrongcolor)
                            .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                });
            if (temptype == "set") {
                tempmsg = await tempmsg.edit({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable4"]), 256))
                            .setColor(es.color)
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable5"]), 4096))
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                });
                await tempmsg.channel
                    .awaitMessages({ filter: m => m.author.id === message.author.id, max: 1, time: 90000, errors: ["time"] })
                    .then(async collected => {
                        var msg = collected.first();
                        if (msg && msg.mentions.channels.filter(ch => ch.guild.id == msg.guild.id).first()) {
                            client.social_log.set(
                                message.guild.id,
                                msg.mentions.channels.filter(ch => ch.guild.id == msg.guild.id).first().id,
                                "tiktok.dc_channel"
                            );
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable6"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable7"]), 4096))
                                        .setColor(es.color)
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        throw {
                            message: "YOU DID NOT PING A VALID CHANNEL",
                        };
                    })
                    .catch(e => {
                        timeouterror = e;
                    });
                if (timeouterror)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable8"]), 256))
                                .setColor(es.wrongcolor)
                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
            } else if (temptype == "add") {
                if (client.social_log.get(message.guild.id, "tiktok.channels").length >= 3)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable9"]), 256))
                                .setColor(es.wrongcolor)
                                .setDescription(obeyUi.limit(`Remove some others first...`.substring(0, 2000), 4096))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                tempmsg = await tempmsg.edit({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable10"]), 256))
                            .setColor(es.color)
                            .setDescription(
                                obeyUi.limit(`Example:
          
https://www.tiktok.com/@melodiadev`, 4096)
                            )
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                });
                await tempmsg.channel
                    .awaitMessages({ filter: m => m.author.id === message.author.id, max: 1, time: 90000, errors: ["time"] })
                    .then(async collected => {
                        var msg = collected.first();
                        if (msg && msg.content) {
                            if (
                                msg.content.length > 0 &&
                                msg.content.length < 50 &&
                                !msg.content.toLowerCase().includes("tiktok") &&
                                !msg.content.toLowerCase().includes("@")
                            )
                                throw {
                                    message: "YOU DID NOT SEND A VALID CHANNEL LINK",
                                };
                            var Channel = msg.content.split("@")[1];
                            if (Channel.includes("video")) Channel = Channel.split("/")[0];
                            if (client.social_log.get(message.guild.id, "tiktok.channels").includes(Channel))
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable11"]), 256))
                                            .setColor(es.wrongcolor)
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                            client.social_log.push(message.guild.id, Channel, "tiktok.channels");

                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable12"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable13"]), 4096))
                                        .setColor(es.color)
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        throw {
                            message: "YOU DID NOT SEND A VALID CHANNEL",
                        };
                    })
                    .catch(e => {
                        timeouterror = e;
                    });
                if (timeouterror)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable14"]), 256))
                                .setColor(es.wrongcolor)
                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
            } else if (temptype == "remove") {
                if (client.social_log.get(message.guild.id, "tiktok.channels").length <= 0)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable15"]), 256))
                                .setColor(es.wrongcolor)
                                .setDescription(obeyUi.limit(`Add some others first...`.substring(0, 2000), 4096))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                var buffer = "";
                var emojis = ["0️⃣", "5️⃣"];
                for (let i = 0; i < client.social_log.get(message.guild.id, "tiktok.channels").length; i++) {
                    buffer += `${emojis[i]} ${client.social_log.get(message.guild.id, "tiktok.channels")[i]}`;
                }
                tempmsg = await tempmsg.edit({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable16"]), 256))
                            .setColor(es.color)
                            .setDescription(
                                obeyUi.limit(buffer + "\n\n\n*React with the emoji regarding to the Canal you wanna remove*", 4096)
                            )
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                });
                for (const emoji of emojis) {
                    tempmsg.react(obeyUi.reaction(emoji)).catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey));
                }
                await tempmsg
                    .awaitReactions({
                        filter: (reaction, user) => user.id == message.author.id && emojis.includes(reaction.emoji?.name),
                        max: 1,
                        time: 90000,
                        errors: ["time"],
                    })
                    .then(async collected => {
                        var channel = client.social_log.get(message.guild.id, "tiktok.channels")[
                            emojis.findIndex(emoji => obeyUi.matchesReaction(collected.first().emoji, emoji))
                        ];

                        client.social_log.remove(message.guild.id, channel, "tiktok.channels");

                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable17"]), 256))
                                    .setColor(es.color)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    })
                    .catch(e => {
                        timeouterror = e;
                    });
                if (timeouterror)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable18"]), 256))
                                .setColor(es.wrongcolor)
                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
            } else if (temptype == "edit") {
                if (client.social_log.get(message.guild.id, "tiktok.channels").length <= 0)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable19"]), 256))
                                .setColor(es.wrongcolor)
                                .setDescription(obeyUi.limit(`Add some others first...`.substring(0, 2000), 4096))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                var buffer = "";
                var emojis = ["0️⃣", "5️⃣"];
                for (let i = 0; i < client.social_log.get(message.guild.id, "tiktok.channels").length; i++) {
                    buffer += `${emojis[i]} ${client.social_log.get(message.guild.id, "tiktok.channels")[i]}`;
                }
                tempmsg = await tempmsg.edit({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable20"]), 256))
                            .setColor(es.color)
                            .setDescription(obeyUi.limit(buffer + "\n\n\n*React with the emoji regarding to the Canal you wanna edit*", 4096))
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                });
                for (const emoji of emojis) {
                    tempmsg.react(obeyUi.reaction(emoji)).catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey));
                }
                await tempmsg
                    .awaitReactions({
                        filter: (reaction, user) => user.id == message.author.id && emojis.includes(reaction.emoji?.name),
                        max: 1,
                        time: 90000,
                        errors: ["time"],
                    })
                    .then(async collected => {
                        var channel = client.social_log.get(message.guild.id, "tiktok.channels")[
                            emojis.findIndex(emoji => obeyUi.matchesReaction(collected.first().emoji, emoji))
                        ];

                        client.tiktok.ensure(channel, {
                            oldvid: "",
                            message: "**{videoAuthorName}** uploaded `{videoTitle}`!\n**Watch it:** {videoURL}",
                        });
                        tempmsg = await message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable21"]), 256))
                                    .setColor(es.color)
                                    .setDescription(
                                        obeyUi.limit(`
**CURRENT MESSAGE:**
> ${client.tiktok.get(channel, "message")}`.substring(0, 2048), 4096)
                                    )
                                    .addFields({ name: "**VARIABLES**", value: `
> \`{url}\` ... will be replaced with the video **LINK**
> \`{author}\` ... will be replaced with the video's **Author**
> \`{title}\` ... will be replaced with the video's **title**` })
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                        await tempmsg.channel
                            .awaitMessages({
                                filter: m => m.author.id === message.author.id,
                                max: 1,
                                time: 90000,
                                errors: ["time"],
                            })
                            .then(async collected => {
                                var msg = collected.first();
                                if (msg && msg.content) {
                                    client.tiktok.set(channel, msg.content, "message");
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable22"]), 256))
                                                .setDescription(obeyUi.limit("New Mensaje:\n" + msg.content, 4096))
                                                .setColor(es.color)
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                }
                                throw {
                                    message: "YOU DID NOT SEND A VALID CHANNEL",
                                };
                            })
                            .catch(e => {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                timeouterror = e;
                            });
                        if (timeouterror)
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable23"]), 256))
                                        .setColor(es.wrongcolor)
                                        .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                    })
                    .catch(e => {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        timeouterror = e;
                    });
                if (timeouterror)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable24"]), 256))
                                .setColor(es.wrongcolor)
                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
            } else {
                return message.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable25"]), 256))
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                });
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-tiktok"]["variable26"]), 4096)),
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
