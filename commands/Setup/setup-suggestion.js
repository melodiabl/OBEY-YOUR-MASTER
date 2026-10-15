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
    name: "setup-suggestion",
    category: "Setup",
    aliases: [
        "setupsuggestion",
        "suggestionsetup",
        "suggestsetup",
        "suggestion-setup",
        "suggest-setup",
        "setup-suggest",
        "setupsuggest",
    ],
    cooldown: 5,
    usage: "setup-suggestion --> Sigue los Pasos",
    description: "Gestiona el Sistema de Sugerencias, mensajes, emojis y Activar/Desactivar",
    memberpermissions: ['Administrador'],
    type: "system",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Enable Suggestion System",
                        description: `Define the Sugerencia System Canal`,
                        emoji: obeyUi.component(allEmojis.msg.SUCCESS),
                    },
                    {
                        value: "Disable Suggestion System",
                        description: `Disable the Sugerencia System`,
                        emoji: obeyUi.component(allEmojis.msg.ERROR),
                    },
                    {
                        value: "Approve Text",
                        description: `Define the Approve Text`,
                        emoji: obeyUi.component(allEmojis.numberEmojis[1]),
                    },
                    {
                        value: "Deny Text",
                        description: `Define the Deny Text`,
                        emoji: obeyUi.component(allEmojis.numberEmojis[2]),
                    },
                    {
                        value: "Maybe Text",
                        description: `Define the Maybe Text`,
                        emoji: obeyUi.component(allEmojis.numberEmojis[3]),
                    },
                    {
                        value: "Status Text",
                        description: `Define the Status Text`,
                        emoji: obeyUi.component(allEmojis.numberEmojis[4]),
                    },
                    {
                        value: "Soon Text",
                        description: `Define the Soon Text`,
                        emoji: obeyUi.component(allEmojis.numberEmojis[5]),
                    },
                    {
                        value: "Footer Text",
                        description: `Define the Footer Text`,
                        emoji: obeyUi.component(allEmojis.numberEmojis[6]),
                    },
                    {
                        value: "Upvote Emoji",
                        description: `Define the Upvote Emoji`,
                        emoji: obeyUi.component(allEmojis.msg.UPVOTE),
                    },
                    {
                        value: "Downvote Emoji",
                        description: `Define the Downvote Emoji`,
                        emoji: obeyUi.component(allEmojis.msg.DOWNVOTE),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Sugerencia System!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1)
                    .setMinValues(1)
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Suggestion System"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Suggestion System", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/282/light-bulb_1f4a1.png", url: "https://github.com/melodiabl" }))
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
            /*
      client.settings.ensure(message.guild.id, {
        suggest: {
          channel: "",
          approvemsg: `${allEmojis.msg.SUCCESS} Accepted Idea! Expect this soon.`,
          denymsg: `<:no:833101993668771842> Thank you for the feedback, but we are not interested in this idea at this time.`,
          maybemsg: `💡 We are thinking about this idea!`,
          duplicatemsg: `💢 This is a duplicated Suggestion`,
          soonmsg: `👌 Expect this Feature Soon!`,
          statustext: `<a:Loading:833101350623117342> Waiting for Community Feedback, please vote!`,
          footertext: `Want to suggest / Feedback something? Simply type in this channel!`,
          approveemoji: `833101995723194437`,
          denyemoji: `833101993668771842`,
        }
    });
      */
            async function handle_the_picks(optionhandletype, SetupNumber, menuoptiondata) {
                switch (optionhandletype) {
                    case "Enable Suggestion System":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable4"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable5"]), 4096)
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
                                .then(collected => {
                                    var message = collected.first();
                                    var channel =
                                        message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first() ||
                                        message.guild.channels.cache.get(message.content.trim().split(" ")[0]);
                                    if (channel) {
                                        try {
                                            client.settings.set(message.guild.id, channel.id, `suggest.channel`);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable6"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`Start writing in there, to write a Sugerencia, to accept/deny them use the: \`${prefix}suggest <approve/deny/maybe> <MESSAGEID> [REASON]\` command`.substring(
                                                                0,
                                                                2048
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable7"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable8"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("¡no mencionaste un Canal válido!");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable9"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Disable Suggestion System":
                        {
                            client.settings.set(message.guild.id, "", `suggest.channel`);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit("Successfully disabled the Sugerencia System", 256))
                                        .setColor(es.color)
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case "Approve Text":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable10"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable11"]), 4096)
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
                                .then(collected => {
                                    var message = collected.first();
                                    if (message) {
                                        try {
                                            client.settings.set(message.guild.id, message.content, "suggest.approvemsg");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable12"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(obeyUi.limit(`${message.content}`.substring(0, 2048), 4096))
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable13"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable14"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("no enviaste un texto válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable9"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Deny Text":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable16"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable17"]), 4096)
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
                                .then(collected => {
                                    var message = collected.first();
                                    if (message) {
                                        try {
                                            client.settings.set(message.guild.id, message.content, "suggest.denymsg");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable18"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(obeyUi.limit(`${message.content}`.substring(0, 2048), 4096))
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable19"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable20"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("no enviaste un texto válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable9"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Maybe Text":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable22"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable23"]), 4096)
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
                                .then(collected => {
                                    var message = collected.first();
                                    if (message) {
                                        try {
                                            client.settings.set(message.guild.id, message.content, "suggest.maybemsg");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable24"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(obeyUi.limit(`${message.content}`.substring(0, 2048), 4096))
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable25"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable26"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("no enviaste un texto válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable9"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Status Text":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable28"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable29"]), 4096)
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
                                .then(collected => {
                                    var message = collected.first();
                                    if (message) {
                                        try {
                                            client.settings.set(message.guild.id, message.content, "suggest.statustext");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable30"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(obeyUi.limit(`${message.content}`.substring(0, 2048), 4096))
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable31"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable32"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("no enviaste un texto válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable9"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Soon Text":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit("What should be the new SOON Mensaje?", 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit("Por favor send it now!", 4096))
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
                                    if (message) {
                                        try {
                                            client.settings.set(message.guild.id, message.content, "suggest.soonmsg");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(obeyUi.limit("Successfully set the new SOON MESSAGE to:", 256))
                                                        .setColor(es.color)
                                                        .setDescription(obeyUi.limit(`${message.content}`.substring(0, 2048), 4096))
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable37"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable38"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("no enviaste un texto válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable9"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Footer Text":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable34"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable35"]), 4096)
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
                                .then(collected => {
                                    var message = collected.first();
                                    if (message) {
                                        try {
                                            client.settings.set(message.guild.id, message.content, "suggest.footertext");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable36"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(obeyUi.limit(`${message.content}`.substring(0, 2048), 4096))
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable37"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable38"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("no enviaste un texto válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable9"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Upvote Emoji":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable40"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable41"]), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                            await tempmsg
                                .awaitReactions({
                                    filter: (reaction, user) => user.id == message.author.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(collected => {
                                    var reaction = collected.first();
                                    if (reaction) {
                                        try {
                                            if (collected.first().emoji?.id && collected.first().emoji?.id.length > 2) {
                                                client.settings.set(
                                                    message.guild.id,
                                                    collected.first().emoji?.id,
                                                    "suggest.approveemoji"
                                                );
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                        "variable42"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            } else if (collected.first().emoji?.name) {
                                                client.settings.set(
                                                    message.guild.id,
                                                    collected.first().emoji?.name,
                                                    "suggest.approveemoji"
                                                );
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                        "variable44"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            }
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable46"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable48"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable49"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("no reaccionaste con un emoji válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable50"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Downvote Emoji":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable51"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable52"]), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                            await tempmsg
                                .awaitReactions({
                                    filter: (reaction, user) => user.id == message.author.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(collected => {
                                    var reaction = collected.first();
                                    if (reaction) {
                                        try {
                                            if (collected.first().emoji?.id && collected.first().emoji?.id.length > 2) {
                                                client.settings.set(
                                                    message.guild.id,
                                                    collected.first().emoji?.id,
                                                    "suggest.denyemoji"
                                                );
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                        "variable53"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            } else if (collected.first().emoji?.name) {
                                                client.settings.set(
                                                    message.guild.id,
                                                    collected.first().emoji?.name,
                                                    "suggest.denyemoji"
                                                );
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                        "variable55"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            }
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable57"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable59"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-suggestion"][
                                                                    "variable60"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("no reaccionaste con un emoji válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable61"]), 256)
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-suggestion"]["variable63"]), 4096)),
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
