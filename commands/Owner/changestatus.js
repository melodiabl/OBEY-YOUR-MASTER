const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder, ButtonBuilder, ActionRowBuilder, MessageMenuOption, StringSelectMenuBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const fs = require("fs");
var { databasing, isValidURL, nFormatter } = require(`${process.cwd()}/handlers/functions`);
const moment = require("moment");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "changestatus",
    category: "Owner",
    type: "bot",
    aliases: ["botstatus", "status"],
    cooldown: 5,
    usage: "changestatus  -->  Follow the Steps",
    description: "Changes the Status of the BOT",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!config.ownerIDS.some(r => r.includes(message.author.id)))
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable1"]), 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable2"]), 4096)),
                ],
            });
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Status 1. Text",
                        description: `Change the first Display Text of the Status`,
                        emoji: obeyUi.component("📝"),
                    },
                    {
                        value: "Status 2. Text",
                        description: `Change the second Display Text of the Status`,
                        emoji: obeyUi.component("📝"),
                    },
                    {
                        value: "Status Type",
                        description: `Change the Status-Type to: Playing/Listening/...`,
                        emoji: obeyUi.component("🔰"),
                    },
                    {
                        value: "Status URL",
                        description: `If Status-State = Streaming, change the Twitch URL`,
                        emoji: obeyUi.component("🔗"),
                    },
                    {
                        value: "Status State",
                        description: `Change the Status-State to: Online/Idle/Dnd/Streaming`,
                        emoji: obeyUi.component("🔖"),
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
                    .setPlaceholder(obeyUi.plain("Click me to change the Status"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Change Status", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/au-kddi/190/purple-heart_1f49c.png", url: "https://github.com/melodiabl" }))
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
                        if (menu?.values[0] == "Cancel")
                            return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"]));
                        menu?.deferUpdate();
                        handle_the_picks(menu?.values[0]);
                    } else
                        menu?.reply({
                            content: `${obeyUi.markup("icon.error")} You are not allowed to do that! Only: <@${cmduser.id}>`,
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

            async function handle_the_picks(optionhandletype) {
                switch (optionhandletype) {
                    case "Status 1. Text":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable7"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`Example: \`${prefix}help | ${client.user.username.split(" ")[0]} | by: github.com/melodiabl\`

              *Enter the text now!*`, 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                        .addFields({ name: "KEYWORDS which get replaced:", value: `\`{guildcount}\` .. Shows all guilds
              \`{prefix}\` .. Shows the default Prefix
              \`{membercount}\` .. Shows all Members
              \`{created}\` .. Shows when the Bot was Created

              \`{createdtime}\` .. Shows when Time when was Created
              \`{name}\` .. Shows Bot Name
              \`{tag}\` ... Shows Bot Name#1234
              \`{commands}\` .. Shows all Commands
              \`{usedcommands}\` .. Shows Amount of Used Commands
              \`{songsplayed}\` .. Shows Amount of Played Songs` }),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id == cmduser.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var msg = collected.first().content;
                                    let status = config;
                                    let newStatusText = msg
                                        .replace("{prefix}", config.prefix)
                                        .replace("{guildcount}", nFormatter(client.guilds.cache.size, 2))
                                        .replace(
                                            "{membercount}",
                                            nFormatter(
                                                client.guilds.cache.reduce((a, b) => a + b?.memberCount, 0),
                                                2
                                            )
                                        )
                                        .replace("{created}", moment(client.user.createdTimestamp).format("DD/MM/YYYY"))
                                        .replace("{createdime}", moment(client.user.createdTimestamp).format("HH:mm:ss"))
                                        .replace("{name}", client.user.username)
                                        .replace("{tag}", client.user.username)
                                        .replace("{commands}", client.commands.size)
                                        .replace(
                                            "{usedcommands}",
                                            nFormatter(
                                                Math.ceil(
                                                    (client.stats.get("global", "commands") *
                                                        [...client.guilds.cache.values()].length) /
                                                        10
                                                ),
                                                2
                                            )
                                        )
                                        .replace(
                                            "{songsplayed}",
                                            nFormatter(
                                                Math.ceil(
                                                    (client.stats.get("global", "songs") *
                                                        [...client.guilds.cache.values()].length) /
                                                        10
                                                ),
                                                2
                                            )
                                        );
                                    newStatusText = String(newStatusText).substring(0, 128);
                                    status.status.text = String(msg).substring(0, 128);
                                    client.user.setActivity(newStatusText, {
                                        type: config.status.type,
                                        url: config.status.url,
                                    });
                                    fs.writeFile(`./botconfig/config.json`, JSON.stringify(status, null, 3), e => {
                                        if (e) {
                                            console.log(e.stack ? String(e.stack).dim : String(e).dim);
                                            return message.channel.send({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                        .setColor(es.wrongcolor)
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable8"]), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable9"]), 4096)
                                                        ),
                                                ],
                                            });
                                        }
                                        return message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setColor(es.color)
                                                    .setTitle(
                                                        obeyUi.limit(`Successfully set the New Status Text to:\n> \`${newStatusText}\``, 256)
                                                    ),
                                            ],
                                        });
                                    });
                                })
                                .catch(e => {
                                    console.log(e);
                                    return message.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable11"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(
                                                    obeyUi.limit(`\`\`\`${String(e.message ? e.message : e).substring(0, 2000)}\`\`\``.substring(
                                                        0,
                                                        2000
                                                    ), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Status 2. Text":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable7"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`Example: \`${prefix}help | ${client.user.username.split(" ")[0]} | by: github.com/melodiabl\`

              *Enter the text now!*`, 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                        .addFields({ name: "KEYWORDS which get replaced:", value: `\`{guildcount}\` .. Shows all guilds
              \`{prefix}\` .. Shows the default Prefix
              \`{membercount}\` .. Shows all Members
              \`{created}\` .. Shows when the Bot was Created

              \`{createdtime}\` .. Shows when Time when was Created
              \`{name}\` .. Shows Bot Name
              \`{tag}\` ... Shows Bot Name#1234
              \`{commands}\` .. Shows all Commands
              \`{usedcommands}\` .. Shows Amount of Used Commands
              \`{songsplayed}\` .. Shows Amount of Played Songs` }),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id == cmduser.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var msg = collected.first().content;
                                    let status = config;
                                    let newStatusText = msg
                                        .replace("{prefix}", config.prefix)
                                        .replace("{guildcount}", nFormatter(client.guilds.cache.size, 2))
                                        .replace(
                                            "{membercount}",
                                            nFormatter(
                                                client.guilds.cache.reduce((a, b) => a + b?.memberCount, 0),
                                                2
                                            )
                                        )
                                        .replace("{created}", moment(client.user.createdTimestamp).format("DD/MM/YYYY"))
                                        .replace("{createdime}", moment(client.user.createdTimestamp).format("HH:mm:ss"))
                                        .replace("{name}", client.user.username)
                                        .replace("{tag}", client.user.username)
                                        .replace("{commands}", client.commands.size)
                                        .replace(
                                            "{usedcommands}",
                                            nFormatter(
                                                Math.ceil(
                                                    (client.stats.get("global", "commands") *
                                                        [...client.guilds.cache.values()].length) /
                                                        10
                                                ),
                                                2
                                            )
                                        )
                                        .replace(
                                            "{songsplayed}",
                                            nFormatter(
                                                Math.ceil(
                                                    (client.stats.get("global", "songs") *
                                                        [...client.guilds.cache.values()].length) /
                                                        10
                                                ),
                                                2
                                            )
                                        );
                                    newStatusText = String(newStatusText).substring(0, 128);
                                    status.status.text2 = String(msg).substring(0, 128);
                                    client.user.setActivity(newStatusText, {
                                        type: config.status.type,
                                        url: config.status.url,
                                    });
                                    fs.writeFile(`./botconfig/config.json`, JSON.stringify(status, null, 3), e => {
                                        if (e) {
                                            console.log(e.stack ? String(e.stack).dim : String(e).dim);
                                            return message.channel.send({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                        .setColor(es.wrongcolor)
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable8"]), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable9"]), 4096)
                                                        ),
                                                ],
                                            });
                                        }
                                        return message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setColor(es.color)
                                                    .setTitle(
                                                        obeyUi.limit(`Successfully set the New Status Text to:\n> \`${newStatusText}\``, 256)
                                                    ),
                                            ],
                                        });
                                    });
                                })
                                .catch(e => {
                                    console.log(e);
                                    return message.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable11"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(
                                                    obeyUi.limit(`\`\`\`${String(e.message ? e.message : e).substring(0, 2000)}\`\`\``.substring(
                                                        0,
                                                        2000
                                                    ), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Status Type":
                        {
                            second_layer();
                            async function second_layer() {
                                let menuoptions = [
                                    {
                                        value: "PLAYING",
                                        description: `e.g: Playing ${config.status.text}`,
                                    },
                                    {
                                        value: "WATCHING",
                                        description: `e.g: Watching ${config.status.text}`,
                                    },
                                    {
                                        value: "STREAMING",
                                        description: `e.g: Streaming ${config.status.text}`,
                                    },
                                    {
                                        value: "LISTENING",
                                        description: `e.g: Listening to ${config.status.text}`,
                                    },
                                    {
                                        value: "COMPETING",
                                        description: `e.g: Competing ${config.status.text}`,
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
                                    .setPlaceholder(obeyUi.plain("Click me to change the Status"))
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
                                    .setAuthor(obeyMeta.asAuthor({ name: "Change Status", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/au-kddi/190/purple-heart_1f49c.png", url: "https://github.com/melodiabl" }))
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
                                        if (menu?.values[0] == "Cancel")
                                            return menu?.reply(
                                                eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"])
                                            );
                                        menu?.deferUpdate();
                                        let temptype = menu?.values[0];
                                        let status = config;
                                        status.status.type = temptype;
                                        client.user.setActivity(config.status.text, {
                                            type: temptype,
                                            url: config.status.url,
                                        });
                                        fs.writeFile(`./botconfig/config.json`, JSON.stringify(status, null, 3), e => {
                                            if (e) {
                                                console.log(e.stack ? String(e.stack).dim : String(e).dim);
                                                return message.channel.send({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                            .setColor(es.wrongcolor)
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["owner"]["changestatus"][
                                                                        "variable14"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setDescription(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["owner"]["changestatus"][
                                                                        "variable15"
                                                                    ]
                                                                ), 4096)
                                                            ),
                                                    ],
                                                });
                                            }
                                            return message.channel.send({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                        .setColor(es.color)
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["owner"]["changestatus"]["variable16"]
                                                            ), 256)
                                                        ),
                                                ],
                                            });
                                        });
                                    } else
                                        menu?.reply({
                                            content: `${obeyUi.markup("icon.error")} You are not allowed to do that! Only: <@${cmduser.id}>`,
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
                        }
                        break;
                    case "Status URL":
                        {
                            tempmsg = await message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable22"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`
            Example: \`https://twitch.tv/#\` --> must be a twitch link

            *Enter the text now!*`, 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id == cmduser.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var msg = collected.first().content;
                                    if (!isValidURL(msg))
                                        return message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setColor(es.wrongcolor)
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable23"]), 256)
                                                    ),
                                            ],
                                        });
                                    if (!msg.includes("twitch"))
                                        return message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setColor(es.wrongcolor)
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable24"]), 256)
                                                    ),
                                            ],
                                        });
                                    let status = config;
                                    status.status.url = msg;
                                    client.user.setActivity(config.status.text, {
                                        type: config.status.type,
                                        url: msg,
                                    });
                                    fs.writeFile(`./botconfig/config.json`, JSON.stringify(status, null, 3), e => {
                                        if (e) {
                                            console.log(e.stack ? String(e.stack).dim : String(e).dim);
                                            return message.channel.send({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                        .setColor(es.wrongcolor)
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["owner"]["changestatus"]["variable25"]
                                                            ), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["owner"]["changestatus"]["variable26"]
                                                            ), 4096)
                                                        ),
                                                ],
                                            });
                                        }
                                        return message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setColor(es.color)
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable27"]), 256)
                                                    ),
                                            ],
                                        });
                                    });
                                })
                                .catch(e => {
                                    console.log(e);
                                    return message.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable28"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(
                                                    obeyUi.limit(`\`\`\`${String(e.message ? e.message : e).substring(0, 2000)}\`\`\``.substring(
                                                        0,
                                                        2000
                                                    ), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Status State":
                        {
                            second_layer();
                            async function second_layer() {
                                let menuoptions = [
                                    {
                                        value: "online",
                                        description: `Showing myself as ONLINE`,
                                        emoji: obeyUi.component("🟢"),
                                    },
                                    {
                                        value: "idle",
                                        description: `Showing myself as IDLE`,
                                        emoji: obeyUi.component("🟡"),
                                    },
                                    {
                                        value: "dnd",
                                        description: `Showing myself as DND`,
                                        emoji: obeyUi.component("🔴"),
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
                                    .setPlaceholder(obeyUi.plain("Click me to change the Status"))
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
                                    .setAuthor(obeyMeta.asAuthor({ name: "Change Status", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/au-kddi/190/purple-heart_1f49c.png", url: "https://github.com/melodiabl" }))
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
                                        if (menu?.values[0] == "Cancel")
                                            return menu?.reply(
                                                eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"])
                                            );
                                        menu?.deferUpdate();
                                        let temptype = menu?.values[0];
                                        client.user.setStatus(temptype);
                                        return message.channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setColor(es.color)
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable20"]), 256)
                                                    ),
                                            ],
                                        });
                                    }
                                    menu?.reply({
                                        content: `${obeyUi.markup("icon.error")} You are not allowed to do that! Only: <@${cmduser.id}>`,
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
                        }
                        break;
                }
            }
        } catch (e) {
            console.log(String(e.stack).dim.bgRed);
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable30"]), 4096)),
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
