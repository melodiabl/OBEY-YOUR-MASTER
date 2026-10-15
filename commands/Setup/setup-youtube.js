const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-youtube",
    category: "Setup",
    aliases: ["setupyoutube", "youtube-setup", "youtubesetup"],
    cooldown: 5,
    usage: "setup-youtube  -->  Follow Steps",
    description: "Manage the youtube logger, addstreamer, editstreamer, removestreamer, etc.",
    memberpermissions: ['Administrador'],
    type: "fun",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let NumberEmojis = emoji.number_emojis;
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Set Discord Channel",
                        description: `Define Poster Canal, where Uploads will be`,
                        emoji: obeyUi.component(allEmojis.msg.channel),
                    },
                    {
                        value: "Add Youtube Channel",
                        description: `Add up to 5 Youtube Accounts`,
                        emoji: obeyUi.component(allEmojis.msg.SUCCESS),
                    },
                    {
                        value: "Remove Youtube Channel",
                        description: `Remove one of the added Youtube Accounts`,
                        emoji: obeyUi.component(allEmojis.msg.ERROR),
                    },
                    {
                        value: "Edit Youtube Channel",
                        description: `Edit one of the added Youtube Accounts`,
                        emoji: obeyUi.component(allEmojis.msg.edit),
                    },
                    {
                        value: "Show Settings",
                        description: `Show Ajustes of the Ai-Chat`,
                        emoji: obeyUi.component(allEmojis.msg.info),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Ai-Chat-Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Youtube System"))
                    .addOptions(
                        menuoptions.map(option => {
                            let Obj = {
                                label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                value: option.value.substring(0, 50),
                                description: option.description.substring(0, 50),
                            };
                            if (option.emoji) Obj.emoji = option.emoji;
                            return Obj;
                        })
                    );

                //define the embed
                let MenuEmbed = new EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor(obeyMeta.asAuthor({ name: "Youtube-Poster", iconURL: obeyUi.image("icon.music"), url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]), 4096));
                //send the menu msg
                let menumsg = await message.reply({
                    embeds: [MenuEmbed],
                    components: [new ActionRowBuilder().addComponents(Selection)],
                });
                //Create the collector
                const collector = menumsg.createMessageComponentCollector({
                    filter: i => i?.isStringSelectMenu() && i?.message.author.id == client.user.id && i?.user,
                    time: 90000,
                });
                //Menu Collections
                collector.on("collect", menu => {
                    if (menu?.user.id === cmduser.id) {
                        collector.stop();
                        let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                        if (menu?.values[0] == "Cancel")
                            return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"]));
                        menu?.deferUpdate();
                        let SetupNumber = menu?.values[0].split(" ")[0];
                        handle_the_picks(menu?.values[0], SetupNumber, menuoptiondata);
                    } else
                        menu?.reply({
                            content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                            ephemeral: true,
                        });
                });
                //Once the Collections ended edit the menu message
                collector.on("end", collected => {
                    menumsg.edit({
                        embeds: [EmbedBuilder.from(menumsg.embeds[0]).setDescription(obeyUi.limit(`~~${menumsg.embeds[0].description}~~`, 4096))],
                        components: [],
                        content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : obeyUi.owned("❌ **NOTHING SELECTED - CANCELLED**")}`,
                    });
                });
            }

            async function handle_the_picks(optionhandletype, SetupNumber, menuoptiondata) {
                switch (optionhandletype) {
                    case "Set Discord Channel":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable4"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable5"]), 4096))
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
                                    if (msg && msg.mentions.channels.filter(ch => ch.guild.id == msg.guild.id).first()) {
                                        client.social_log.set(
                                            message.guild.id,
                                            msg.mentions.channels.filter(ch => ch.guild.id == msg.guild.id).first().id,
                                            "youtube.dc_channel"
                                        );
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable6"]), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable7"]), 4096)
                                                    )
                                                    .setColor(es.color)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    return message.reply("YOU DID NOT PING A VALID CHANNEL");
                                })
                                .catch(e => {
                                    console.log(e);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable8"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Add Youtube Channel":
                        {
                            if (client.social_log.get(message.guild.id, "youtube.channels").length >= 5)
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable9"]), 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`Remove some others first...`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable10"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(`Example:\nhttps://www.youtube.com/channel/UC1AgotpFHNhzolUtAjPgZqQ`, 4096))
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
                                        if (
                                            msg.content.length > 0 &&
                                            msg.content.length < 50 &&
                                            !msg.content.toLowerCase().includes("youtube") &&
                                            (!msg.content.toLowerCase().includes("channel") ||
                                                !msg.content.toLowerCase().includes("c"))
                                        )
                                            return message.reply(
                                                "YOU DID NOT SEND A VALID YOUTUBE CHANNEL\nNote, such links doesn't work: `https://youtube.com/melodiabl` / `https://youtube.com/c/melodiabl`\nIt must be something like this: `https://www.youtube.com/channel/UC1AgotpFHNhzolUtAjPgZqQ`"
                                            );
                                        if (
                                            client.social_log.get(message.guild.id, "youtube.channels").includes(msg.content)
                                        )
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable11"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        client.social_log.push(message.guild.id, msg.content, "youtube.channels");
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable12"]), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable13"]), 4096)
                                                    )
                                                    .setColor(es.color)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    return message.reply("YOU DID NOT SEND A VALID CHANNEL");
                                })
                                .catch(e => {
                                    console.log(e);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable14"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Remove Youtube Channel":
                        {
                            if (client.social_log.get(message.guild.id, "youtube.channels").length <= 0)
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable15"]), 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`Add some others first...`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                            let channels = client.social_log.get(message.guild.id, "youtube.channels");
                            let menuoptions = channels.map((data, index) => {
                                let Obj = {};
                                const emoji = NumberEmojis[index + 1];
                                if (emoji) Obj.emoji = emoji;
                                Obj.value = `${data.split("/")[data.split("/").length - 1]}`.substring(0, 25);
                                Obj.description =
                                    `${data.replace("https://", "").replace("http://", "").replace("www.", "")}`.substring(
                                        0,
                                        50
                                    );
                                return Obj;
                            });
                            //define the selection
                            let Selection = new StringSelectMenuBuilder()
                                .setCustomId("MenuSelection")
                                .setMaxValues(menuoptions.length) //OPTIONAL, this is how many values you can have at each selection
                                .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                .setPlaceholder(obeyUi.plain("Click me to remove an Account"))
                                .addOptions(
                                    menuoptions.map(option => {
                                        let Obj = {
                                            label: option.label
                                                ? option.label.substring(0, 50)
                                                : option.value.substring(0, 50),
                                            value: option.value.substring(0, 50),
                                            description: option.description.substring(0, 50),
                                        };
                                        if (option.emoji) Obj.emoji = option.emoji;
                                        return Obj;
                                    })
                                );

                            //define the embed
                            let MenuEmbed = new EmbedBuilder()
                                .setColor(es.color)
                                .setAuthor(obeyMeta.asAuthor({ name: "Youtube-Poster", iconURL: obeyUi.image("icon.music"), url: "https://github.com/melodiabl" }))
                                .setDescription(obeyUi.limit("Seleccionar all Youtube Channels you want to remove!", 4096));
                            //send the menu msg
                            let menumsg = await message.reply({
                                embeds: [MenuEmbed],
                                components: [new ActionRowBuilder().addComponents(Selection)],
                            });
                            //Create the collector
                            const collector = menumsg.createMessageComponentCollector({
                                filter: i => i?.isStringSelectMenu() && i?.message.author.id == client.user.id && i?.user,
                                time: 90000,
                            });
                            //Menu Collections
                            collector.on("collect", menu => {
                                if (menu?.user.id === cmduser.id) {
                                    collector.stop();
                                    for (const value of menu?.values) {
                                        let menuoptiondataIndex = menuoptions.findIndex(v => v.value == value);
                                        client.social_log.remove(
                                            message.guild.id,
                                            channels[menuoptiondataIndex],
                                            "youtube.channels"
                                        );
                                    }
                                    menu?.reply(`${obeyUi.markup("icon.success")} **Successfully removed ${menu?.values.length} Youtube Accounts!**`);
                                } else
                                    menu?.reply({
                                        content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                        ephemeral: true,
                                    });
                            });
                            //Once the Collections ended edit the menu message
                            collector.on("end", collected => {
                                menumsg.edit({
                                    embeds: [EmbedBuilder.from(menumsg.embeds[0]).setDescription(obeyUi.limit(`~~${menumsg.embeds[0].description}~~`, 4096))],
                                    components: [],
                                    content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : obeyUi.owned("❌ **NOTHING SELECTED - CANCELLED**")}`,
                                });
                            });
                        }
                        break;
                    case "Edit Youtube Channel":
                        {
                            if (client.social_log.get(message.guild.id, "youtube.channels").length <= 0)
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable19"]), 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`Add some others first...`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                            let channels = client.social_log.get(message.guild.id, "youtube.channels");
                            let menuoptions = channels.map((data, index) => {
                                let Obj = {};
                                Obj.emoji = NumberEmojiIds[index + 1];
                                Obj.value = `${data.split("/")[data.split("/").length - 1]}`.substring(0, 25);
                                Obj.description =
                                    `${data.replace("https://", "").replace("http://", "").replace("www.", "")}`.substring(
                                        0,
                                        50
                                    );
                                return Obj;
                            });
                            //define the selection
                            let Selection = new StringSelectMenuBuilder()
                                .setCustomId("MenuSelection")
                                .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                                .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                .setPlaceholder(obeyUi.plain("Click me to remove an Account"))
                                .addOptions(
                                    menuoptions.map(option => {
                                        let Obj = {
                                            label: option.label
                                                ? option.label.substring(0, 50)
                                                : option.value.substring(0, 50),
                                            value: option.value.substring(0, 50),
                                            description: option.description.substring(0, 50),
                                        };
                                        if (option.emoji) Obj.emoji = option.emoji;
                                        return Obj;
                                    })
                                );

                            //define the embed
                            let MenuEmbed = new EmbedBuilder()
                                .setColor(es.color)
                                .setAuthor(obeyMeta.asAuthor({ name: "Youtube-Poster", iconURL: obeyUi.image("icon.music"), url: "https://github.com/melodiabl" }))
                                .setDescription(obeyUi.limit("Seleccionar the Youtube Canal you want to edit!", 4096));
                            //send the menu msg
                            let menumsg = await message.reply({
                                embeds: [MenuEmbed],
                                components: [new ActionRowBuilder().addComponents(Selection)],
                            });
                            //Create the collector
                            const collector = menumsg.createMessageComponentCollector({
                                filter: i => i?.isStringSelectMenu() && i?.message.author.id == client.user.id && i?.user,
                                time: 90000,
                            });
                            //Menu Collections
                            collector.on("collect", async menu => {
                                if (menu?.user.id === cmduser.id) {
                                    collector.stop();
                                    let menuoptiondataIndex = menuoptions.findIndex(v => v.value == menu?.values[0]);
                                    if (menu?.values[0] == "Cancel")
                                        return menu?.reply(
                                            eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"])
                                        );
                                    let channel = channels[menuoptiondataIndex];

                                    client.youtube_log.ensure(channel, {
                                        oldvid: "",
                                        message: "**{videoAuthorName}** uploaded `{videoTitle}`!\n**Watch it:** {videoURL}",
                                    });
                                    tempmsg = await message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable21"]), 256)
                                                )
                                                .setColor(es.color)
                                                .setDescription(
                                                    obeyUi.limit(`**CURRENT MESSAGE:**\n> ${client.youtube_log.get(channel, "message")}`.substring(
                                                        0,
                                                        2048
                                                    ), 4096)
                                                )
                                                .addFields({ name: "**VARIABLES**", value: `> \`{url}\` ... will be replaced with the video **LINK**\n> \`{author}\` ... will be replaced with the video's **Author**\n> \`{title}\` ... will be replaced with the video's **title**\n> \`{date}\` ... will be replaced with the video's **date**` })
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
                                                client.youtube_log.set(channel, msg.content, "message");
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["setup"]["setup-youtube"][
                                                                        "variable22"
                                                                    ]
                                                                ), 256)
                                                            )
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
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable23"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        });
                                } else
                                    menu?.reply({
                                        content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                        ephemeral: true,
                                    });
                            });
                            //Once the Collections ended edit the menu message
                            collector.on("end", collected => {
                                menumsg.edit({
                                    embeds: [EmbedBuilder.from(menumsg.embeds[0]).setDescription(obeyUi.limit(`~~${menumsg.embeds[0].description}~~`, 4096))],
                                    components: [],
                                    content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : obeyUi.owned("❌ **NOTHING SELECTED - CANCELLED**")}`,
                                });
                            });
                        }
                        break;
                    case "Show Settings":
                        {
                            let channels = client.social_log.get(message.guild.id, "youtube.channels");
                            message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(`Ajustes of the Youtube Poster`, 256))
                                        .setColor(es.wrongcolor)
                                        .setDescription(
                                            obeyUi.limit(`**Discord Poster Canal:** <#${client.social_log.get(message.guild.id, "youtube.dc_channel")}>\n**[${channels.length}] Channels:**${channels.length == 0 ? "\n> `NONE`" : channels.map(d => `\n> [${d.split("/")[d.split("/").length - 1]}](${d})`).join("\n")}`.substring(
                                                0,
                                                2000
                                            ), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-youtube"]["variable26"]), 4096)),
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
