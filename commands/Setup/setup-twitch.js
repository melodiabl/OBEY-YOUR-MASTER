const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { getNumberEmojis, allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-twitch",
    category: "Setup",
    aliases: ["setuptwitch", "twitch-setup", "twitchsetup"],
    cooldown: 5,
    usage: "setup-twitch  -->  Follow Steps",
    description: "Manage the Twitch logger, temp role, ping role, adduser, removeuser, etc.",
    memberpermissions: ['Administrador'],
    type: "fun",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        const NumberEmojis = getNumberEmojis();
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Remove Channel",
                        description: `Remove one of the added Twitch Channels`,
                        emoji: obeyUi.component(allEmojis.msg.twitch),
                    },
                    {
                        value: "New Channel",
                        description: `Add a New Twitch Canal`,
                        emoji: obeyUi.component(allEmojis.msg.UPVOTE),
                    },
                    {
                        value: "Discord Channel",
                        description: `Set a Discord Canal for Posting Messages`,
                        emoji: obeyUi.component(allEmojis.msg.channel),
                    },
                    {
                        value: "Active Live Role",
                        description: `Set a Rol to add for current live Streamers`,
                        emoji: obeyUi.component(allEmojis.msg.roles),
                    },
                    {
                        value: "Ghost Ping Role",
                        description: `Set a Ghost Ping Rol.`,
                        emoji: obeyUi.component("👻"),
                    },
                    {
                        value: "View Twitch-Channels",
                        description: `View / Show all setupped Twitch Channels`,
                        emoji: obeyUi.component(allEmojis.msg.list),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Twitch-Logger-Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Twitch-Logger"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Twitch-Logger", iconURL: obeyUi.image("icon.feed"), url: "https://github.com/melodiabl" }))
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
                    case "View Twitch-Channels":
                        {
                            if (client.social_log.get(message.guild.id, "twitch.channels").length <= 0)
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(obeyUi.limit(`There are no Twitch Channels Setupped yet!`, 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`Add some others first...`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                            let channels = client.social_log.get(message.guild.id, "twitch.channels");
                            let menuoptions = channels.map((data, index) => {
                                let Obj = {};
                                const emoji = NumberEmojis[index + 1];
                                if (emoji) Obj.emoji = emoji;
                                Obj.value = `${data.ChannelName}`.substring(0, 25);
                                Obj.description = `https://twitch.tv/${data.ChannelName}`.substring(0, 50);
                                return Obj;
                            });
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(`All [${channels.length}] Twitch-Channels`, 256))
                                        .setColor(es.wrongcolor)
                                        .setDescription(
                                            obeyUi.limit(`${channels.map((data, index) => `> ${NumberEmojis[index + 1] || index + 1} [${data.ChannelName}](https://twitch.tv/${data.ChannelName})`).join("\n\n")}`.substring(
                                                0,
                                                2000
                                            ), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case "Remove Channel":
                        {
                            if (client.social_log.get(message.guild.id, "twitch.channels").length <= 0)
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(obeyUi.limit(`There are no Twitch Channels Setupped yet!`, 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`Add some others first...`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                            let channels = client.social_log.get(message.guild.id, "twitch.channels");
                            let menuoptions = channels.map((data, index) => {
                                let Obj = {};
                                const emoji = NumberEmojis[index + 1];
                                if (emoji) Obj.emoji = emoji;
                                Obj.value = `${data.ChannelName}`.substring(0, 25);
                                Obj.description = `https://twitch.tv/${data.ChannelName}`.substring(0, 50);
                                return Obj;
                            });
                            //define the selection
                            let Selection = new StringSelectMenuBuilder()
                                .setCustomId("MenuSelection")
                                .setMaxValues(menuoptions.length) //OPTIONAL, this is how many values you can have at each selection
                                .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                .setPlaceholder(obeyUi.plain("Click me to remove Account(s)"))
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
                                .setAuthor(obeyMeta.asAuthor({ name: "Twitch-Poster", iconURL: obeyUi.image("icon.feed"), url: "https://github.com/melodiabl" }))
                                .setDescription(obeyUi.limit("Seleccionar all Twitch Channels you want to remove!", 4096));
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
                                            d => d.ChannelName == channels[menuoptiondataIndex].ChannelName,
                                            "twitch.channels"
                                        );
                                    }
                                    menu?.reply(`${obeyUi.markup("icon.success")} **Successfully removed ${menu?.values.length} Twitch Accounts!**`);
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
                    case "New Channel":
                        {
                            if (client.social_log.get(message.guild.id, "twitch.channels").length > 10)
                                return message.reply(obeyUi.owned("❌ **You can't have more then 10 Twitch Channels**"));
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable5"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable6"]), 4096))
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
                                    var msg = collected.first().content;
                                    if (msg && msg.toLowerCase().includes("https")) {
                                        var channelname = msg.split("/");
                                        channelname = channelname[channelname.length - 1];
                                        tempmsg = await message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable7"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable8"]), 4096)
                                                    )
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
                                                var msg = collected.first().mentions.users.first();
                                                if (msg) {
                                                    var discorduser = msg.id;
                                                    tempmsg = await message.reply({
                                                        embeds: [
                                                            new Discord.EmbedBuilder()
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-twitch"][
                                                                            "variable9"
                                                                        ]
                                                                    ), 256)
                                                                )
                                                                .setColor(es.color)
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-twitch"][
                                                                            "variable10"
                                                                        ]
                                                                    ), 4096)
                                                                )
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
                                                            var msg = collected.first().content;
                                                            if (msg) {
                                                                var themsg = msg;
                                                                client.social_log.push(
                                                                    message.guild.id,
                                                                    {
                                                                        ChannelName: channelname,
                                                                        DISCORD_USER_ID: discorduser,
                                                                        twitch_stream_id: "",
                                                                        message: themsg,
                                                                    },
                                                                    "twitch.channels"
                                                                );

                                                                return message.reply({
                                                                    embeds: [
                                                                        new Discord.EmbedBuilder()
                                                                            .setTitle(
                                                                                obeyUi.limit(eval(
                                                                                    client.la[ls]["cmds"]["setup"][
                                                                                        "setup-twitch"
                                                                                    ]["variable11"]
                                                                                ), 256)
                                                                            )
                                                                            .setDescription(
                                                                                obeyUi.limit(eval(
                                                                                    client.la[ls]["cmds"]["setup"][
                                                                                        "setup-twitch"
                                                                                    ]["variable12"]
                                                                                ), 4096)
                                                                            )
                                                                            .setColor(es.color)
                                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                    ],
                                                                });
                                                            }
                                                            return message.reply("YOU DID NOT SEND A VALID MESSAGE");
                                                        })
                                                        .catch(e => {
                                                            console.log(e);
                                                            return message.reply({
                                                                embeds: [
                                                                    new Discord.EmbedBuilder()
                                                                        .setTitle(
                                                                            obeyUi.limit(eval(
                                                                                client.la[ls]["cmds"]["setup"][
                                                                                    "setup-twitch"
                                                                                ]["variable15"]
                                                                            ), 256)
                                                                        )
                                                                        .setColor(es.wrongcolor)
                                                                        .setDescription(
                                                                            obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096)
                                                                        )
                                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                ],
                                                            });
                                                        });
                                                } else {
                                                    return message.reply("YOU DID PING A VALID MEMBER");
                                                }
                                            })
                                            .catch(e => {
                                                console.log(e);
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["setup"]["setup-twitch"][
                                                                        "variable15"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setColor(es.wrongcolor)
                                                            .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            });
                                    } else {
                                        return message.reply("YOU DID NOT SEND A VALID LINK");
                                    }
                                })
                                .catch(e => {
                                    console.log(e);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable15"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Discord Channel":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable17"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable18"]), 4096))
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
                                .then(collected => {
                                    var message = collected.first();
                                    if (message.content.toLowerCase() == "no") {
                                        client.social_log.set(message.guild.id, "", "twitch.channelId");
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable19"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    var channel =
                                        message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first() ||
                                        message.guild.channels.cache.get(message.content.trim().split(" ")[0]);
                                    if (channel) {
                                        try {
                                            client.social_log.set(message.guild.id, channel.id, "twitch.channelId");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable20"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable21"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable22"]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        throw "you no mencionaste un Channel";
                                    }
                                })
                                .catch(e => {
                                    console.log(e);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable23"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Active Live Role":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable24"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable25"]), 4096))
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
                                .then(collected => {
                                    var message = collected.first();
                                    if (message.content.toLowerCase() == "no") {
                                        client.social_log.set(message.guild.id, "", "twitch.roleID_GIVE");
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable26"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    var channel = message.mentions.roles
                                        .filter(role => role.guild.id == message.guild.id)
                                        .first();
                                    if (channel) {
                                        try {
                                            client.social_log.set(message.guild.id, channel.id, "twitch.roleID_GIVE");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable27"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable28"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable29"]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        throw "you no mencionaste un Channel";
                                    }
                                })
                                .catch(e => {
                                    console.log(e);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable30"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Ghost Ping Role":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable31"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable32"]), 4096))
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
                                .then(collected => {
                                    var message = collected.first();
                                    if (message.content.toLowerCase() == "no") {
                                        client.social_log.set(message.guild.id, "", "twitch.roleID_PING");
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable33"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    var channel = message.mentions.roles
                                        .filter(role => role.guild.id == message.guild.id)
                                        .first();
                                    if (channel) {
                                        try {
                                            client.social_log.set(message.guild.id, channel.id, "twitch.roleID_PING");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable34"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable35"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable36"]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        throw "you no mencionaste un Channel";
                                    }
                                })
                                .catch(e => {
                                    console.log(e);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable37"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitch"]["variable39"]), 4096)),
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
