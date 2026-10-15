const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var fs = require("fs");
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const twitconfig = require("../../social_log/twitter.json");
const Twit = require("twit");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-twitter",
    category: "Setup",
    aliases: ["setuptwitter", "twitter-setup"],
    cooldown: 5,
    usage: "setup-twitter --> Sigue los Pasos",
    description: "Manage the 2x Twitter Systems (set channel, set twitter)",
    memberpermissions: ['Administrador'],
    type: "fun",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            var timeouterror;
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Set Twitter Account",
                        description: `Define which Twitter Account to watch`,
                        emoji: obeyUi.component(allEmojis.msg.twitter),
                    },
                    {
                        value: "Set Poster Channel",
                        description: `Define a Canal to post the messages to!`,
                        emoji: obeyUi.component(allEmojis.msg.channel),
                    },
                    {
                        value: "Set Posting Message",
                        description: `Show Ajustes of the Admin Commands Log`,
                        emoji: obeyUi.component(allEmojis.msg.message),
                    },
                    {
                        value: `${client.social_log.get(message.guild.id, `twitter.REETWET`) ? "Disable Retweets" : "Enable Retweets"}`,
                        description: `Show Ajustes of the Admin Commands Log`,
                        emoji: obeyUi.component(`${client.social_log.get(message.guild.id, `twitter.REETWET`) ? allEmojis.msg.ERROR : allEmojis.msg.SUCCESS}`),
                    },
                    {
                        value: "Manual Setup",
                        description: `Force-Configuración the UName and ID if normal is invalid`,
                        emoji: obeyUi.component(allEmojis.msg.info),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Admin-Comando-Log-Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Admin-Command-Log"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Twitter Setup", iconURL: obeyUi.image("icon.feed"), url: "https://github.com/melodiabl" }))
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
                    case "Set Twitter Account":
                        {
                            var username;
                            var userid;
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable10"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable11"]), 4096))
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
                                    var twitlink = collected.first().content;
                                    if (!String(twitlink).toLowerCase().includes("https")) {
                                        timeouterror = "INVALID LINK";
                                        return message.reply(
                                            eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable12"])
                                        );
                                    }
                                    if (!String(twitlink).toLowerCase().includes("twitter")) {
                                        timeouterror = "INVALID LINK";
                                        return message.reply(
                                            eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable13"])
                                        );
                                    }
                                    username = twitlink.replace("https://twitter", "").split("/")[1];
                                })
                                .catch(e => {
                                    timeouterror = e;
                                });
                            if (timeouterror)
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable14"]), 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });

                            var T = new Twit({
                                consumer_key: twitconfig.consumer_key,
                                consumer_secret: twitconfig.consumer_secret,
                                access_token: twitconfig.access_token,
                                access_token_secret: twitconfig.access_token_secret,
                                timeout_ms: twitconfig.timeout_ms,
                                strictSSL: twitconfig.strictSSL,
                            });
                            await T.get(
                                "users/search",
                                {
                                    q: `${username}`,
                                    count: 1,
                                },
                                function (err, data, response) {
                                    if (err)
                                        return message.reply(
                                            eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable15"])
                                        );
                                    var user = data[0];
                                    if (!user)
                                        return message.reply(
                                            eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable16"])
                                        );
                                    userid = user.id_str;
                                    var TwitterName = user.screen_name;
                                    try {
                                        client.social_log.set(message.guild.id, userid, `twitter.TWITTER_USER_ID`);
                                        client.social_log.set(
                                            message.guild.id,
                                            username,
                                            `twitter.TWITTER_USER_NAME_ONLY_THOSE`
                                        );
                                        //require("../../social_log/twitterfeed").creat_twit(client);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable17"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable18"]), 4096)
                                                    )
                                                    .addFields({ name: eval(
                                                            client.la[ls]["cmds"]["setup"]["setup-twitter"]["variablex_19"]
                                                        ), value: eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable19"]) })
                                                    .setURL(`https://twitter.com/${TwitterName}`)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    } catch (e) {
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable20"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable28"]), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                }
                            );
                        }
                        break;
                    case "Set Poster Channel":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable22"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable23"]), 4096))
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
                                    var channel =
                                        message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first() ||
                                        message.guild.channels.cache.get(message.content.trim().split(" ")[0]);
                                    if (channel) {
                                        try {
                                            client.social_log.set(
                                                message.guild.id,
                                                channel.id,
                                                `twitter.DISCORD_CHANNEL_ID`
                                            );
                                            //require("../../social_log/twitterfeed").creat_twit(client);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable24"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable25"]
                                                            ), 4096)
                                                        )
                                                        .addFields({ name: eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitter"][
                                                                    "variablex_26"
                                                                ]
                                                            ), value: eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable26"]
                                                            ) })
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable27"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable36"]
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
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable29"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Set Posting Message":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable30"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable31"]), 4096))
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
                                    try {
                                        client.social_log.set(
                                            message.guild.id,
                                            collected.first().content,
                                            `twitter.infomsg`
                                        );
                                        //require("../../social_log/twitterfeed").creat_twit(client);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable32"]), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable33"]), 4096)
                                                    )
                                                    .setColor(es.color)
                                                    .addFields({ name: eval(
                                                            client.la[ls]["cmds"]["setup"]["setup-twitter"]["variablex_34"]
                                                        ), value: eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable34"]) })
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    } catch (e) {
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable35"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable49"]), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable37"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case `${client.social_log.get(message.guild.id, `twitter.REETWET`) ? "Disable Retweets" : "Enable Retweets"}`:
                        {
                            client.social_log.set(
                                message.guild.id,
                                !client.social_log.get(message.guild.id, `twitter.REETWET`),
                                `twitter.REETWET`
                            );
                            //require("../../social_log/twitterfeed").creat_twit(client);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable38"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable39"]), 4096))
                                        .setColor(es.color)
                                        .addFields({ name: eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variablex_40"]), value: eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable40"]) })
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case "Manual Setup":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable41"]), 256))
                                        .setColor(es.color)
                                        .setURL("https://tweeterid.com")
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable42"]), 4096))
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
                                    try {
                                        client.social_log.set(
                                            message.guild.id,
                                            collected.first().content,
                                            `twitter.TWITTER_USER_ID`
                                        );
                                        //require("../../social_log/twitterfeed").creat_twit(client);
                                        message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(`${allEmojis.msg.SUCCESS} Set the TWITTER USER ID TO: \`${collected.first().content}\``.substring(
                                                            0,
                                                            256
                                                        ), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable43"]), 4096)
                                                    )
                                                    .setColor(es.color)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });

                                        var tempmsg = await message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable44"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable45"]), 4096)
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
                                                try {
                                                    client.social_log.set(
                                                        message.guild.id,
                                                        collected.first().content,
                                                        `twitter.TWITTER_USER_NAME_ONLY_THOSE`
                                                    );
                                                    //require("../../social_log/twitterfeed").creat_twit(client);
                                                    return message.reply({
                                                        embeds: [
                                                            new Discord.EmbedBuilder()
                                                                .setTitle(
                                                                    obeyUi.limit(`${allEmojis.msg.SUCCESS} Set the TWITTER USER Name TO: \`${collected.first().content}\``.substring(
                                                                        0,
                                                                        256
                                                                    ), 256)
                                                                )
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-twitter"][
                                                                            "variable46"
                                                                        ]
                                                                    ), 4096)
                                                                )
                                                                .setColor(es.color)
                                                                .addFields({ name: eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-twitter"][
                                                                            "variablex_47"
                                                                        ]
                                                                    ), value: eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-twitter"][
                                                                            "variable47"
                                                                        ]
                                                                    ) })
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                        ],
                                                    });
                                                } catch (e) {
                                                    return message.reply({
                                                        embeds: [
                                                            new Discord.EmbedBuilder()
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-twitter"][
                                                                            "variable48"
                                                                        ]
                                                                    ), 256)
                                                                )
                                                                .setColor(es.wrongcolor)
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-twitter"][
                                                                            "variable52"
                                                                        ]
                                                                    ), 4096)
                                                                )
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                        ],
                                                    });
                                                }
                                            })
                                            .catch(e => {
                                                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["setup"]["setup-twitter"][
                                                                        "variable50"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setColor(es.wrongcolor)
                                                            .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            });
                                    } catch (e) {
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable51"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable55"]), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-twitter"]["variable53"]), 256)
                                                )
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
                        .setDescription(obeyUi.limit(`\`\`\`${String(JSON.stringify(e)).substring(0, 2000)}\`\`\``, 4096)),
                ],
            });
        }
    },
};
/**
 * @INFO
 * Bot Coded by Melodia | https://github?.com/melodiaDev/discord-js-lavalink-Music-Bot-erela-js
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 */
