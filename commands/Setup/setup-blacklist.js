const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { databasing, swap_pages, swap_pages2 } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-blacklist",
    category: "Setup",
    aliases: ["setupblacklist", "blacklist-setup", "blacklistsetup"],
    cooldown: 5,
    usage: "setup-blacklist --> Sigue los Pasos",
    description: "Bloquear palabras específicas en tu Servidor",
    memberpermissions: ['Administrador'],
    type: "security",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Add Blacklisted-Word",
                        description: `Add a Word to the Blacklisted Words`,
                        emoji: obeyUi.component(allEmojis.msg.SUCCESS),
                    },
                    {
                        value: "Remove Blacklisted-Word",
                        description: `Remove a Word from the Blacklisted Words`,
                        emoji: obeyUi.component(allEmojis.msg.cleared),
                    },
                    {
                        value: "Show Settings",
                        description: `Show all Blacklisted Words Ajustes`,
                        emoji: obeyUi.component(allEmojis.msg.list),
                    },
                    {
                        value: "Reset Blacklist",
                        description: `Delete/Reset all Blacklisted Words`,
                        emoji: obeyUi.component(allEmojis.msg.cleared),
                    },
                    {
                        value: "Add Whitelist-CHANNEL",
                        description: `Allow Channels where it is allowed`,
                        emoji: obeyUi.component(allEmojis.msg.song_by),
                    },
                    {
                        value: "Remove Whitelist-CHANNEL",
                        description: `Remove allowed Channels`,
                        emoji: obeyUi.component(allEmojis.msg.cleared),
                    },
                    {
                        value: "Change Max-Mute Amount",
                        description: `Change the max allow Time to do it before mute!`,
                        emoji: obeyUi.component(allEmojis.msg.time),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Auto-Meme-Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Automated Meme System!"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Setup Blacklist", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/joypixels/291/stop-sign_1f6d1.png", url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]), 4096));
                let used1 = false;
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
                        used1 = true;
                        handle_the_picks(menu?.values[0], menuoptiondata);
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
            async function handle_the_picks(optionhandletype, menuoptiondata) {
                switch (optionhandletype) {
                    case "Add Blacklisted-Word":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-blacklist"]["variable5"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-blacklist"]["variable6"]), 4096))
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

                                    if (message.content) {
                                        try {
                                            var blacklistedwords = message.content
                                                .split(",")
                                                .filter(Boolean)
                                                .map(item => item.trim().toLowerCase());
                                            var notadded = [];
                                            for (const blacklistword of blacklistedwords) {
                                                if (
                                                    client.blacklist.get(message.guild.id, "words").includes(blacklistword)
                                                ) {
                                                    notadded.push(blacklistword);
                                                } else {
                                                    client.blacklist.push(message.guild.id, blacklistword, "words");
                                                }
                                            }
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-blacklist"][
                                                                    "variable7"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-blacklist"][
                                                                    "variable8"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setColor(es.color)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-blacklist"][
                                                                    "variable9"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-blacklist"][
                                                                    "variable10"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("¡no mencionaste un Rol válido!");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-blacklist"]["variable11"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Remove Blacklisted-Word":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-blacklist"]["variable12"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-blacklist"]["variable13"]), 4096)
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

                                    if (message.content) {
                                        try {
                                            var blacklistedwords = message.content
                                                .split(",")
                                                .filter(Boolean)
                                                .map(item => item.trim().toLowerCase());
                                            var notremoved = [];
                                            for (const blacklistword of blacklistedwords) {
                                                if (
                                                    !client.blacklist.get(message.guild.id, "words").includes(blacklistword)
                                                ) {
                                                    notremoved.push(blacklistword);
                                                } else {
                                                    client.blacklist.remove(message.guild.id, blacklistword, "words");
                                                }
                                            }
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-blacklist"][
                                                                    "variable14"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-blacklist"][
                                                                    "variable15"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setColor(es.color)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-blacklist"][
                                                                    "variable16"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-blacklist"][
                                                                    "variable17"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("¡no mencionaste un Rol válido!");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-blacklist"]["variable18"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Show Settings":
                        {
                            return swap_pages(
                                client,
                                message,
                                `${client.blacklist
                                    .get(message.guild.id, "words")
                                    .map(word => `\`${word}\``)
                                    .join(", ")
                                    .split("`")
                                    .join("`")}`,
                                `${message.guild.name} | Blacklisted Words`
                            );
                        }
                        break;
                    case "Reset Blacklist":
                        {
                            client.blacklist.set(message.guild.id, [], "words");
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-blacklist"]["variable19"]), 256))
                                        .setColor(es.color)
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case "Add Whitelist-CHANNEL":
                        {
                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antidiscord"]["variable5"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antidiscord"]["variable6"]), 4096)
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
                                        let antisettings = client.blacklist.get(message.guild.id, "whitelistedchannels");
                                        if (antisettings.includes(channel.id))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antidiscord"][
                                                                    "variable7"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            client.blacklist.push(message.guild.id, channel.id, "whitelistedchannels");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(`The Canal \`${channel.name}\` is now got added to the Whitelisted Channels of this System`, 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`Every single Canal:\n<#${client.blacklist.get(message.guild.id, "whitelistedchannels").join(">\n<#")}>\nis not checked by the System`.substring(
                                                                0,
                                                                2048
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antidiscord"][
                                                                    "variable9"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antidiscord"][
                                                                    "variable10"
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
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antidiscord"]["variable11"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Remove Whitelist-CHANNEL":
                        {
                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antidiscord"]["variable12"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antidiscord"]["variable13"]), 4096)
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
                                        let antisettings = client.blacklist.get(message.guild.id, "whitelistedchannels");
                                        if (!antisettings.includes(channel.id))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antidiscord"][
                                                                    "variable14"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            client.blacklist.remove(message.guild.id, channel.id, "whitelistedchannels");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(`The Canal \`${channel.name}\` is now removed out of the Whitelisted Channels of this System`, 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`Every single Canal:\n> <#${client.blacklist.get(message.guild.id, "whitelistedchannels").join(">\n> <#")}>\nis not checked by the System`.substring(
                                                                0,
                                                                2048
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antidiscord"][
                                                                    "variable16"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antidiscord"][
                                                                    "variable17"
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
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antidiscord"]["variable18"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Change Max-Mute Amount":
                        {
                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit("How often should someone be allowed to do it within 15 Seconds?", 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`Currently it is at: \`${client.blacklist.get(message.guild.id, "mute_amount")}\`\n\nPlease just send the Number! (0 means after the first time he/she will get muted)`, 4096)
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
                                    if (message.content) {
                                        let number = message.content;
                                        if (isNaN(number)) return message.reply(`${allEmojis.msg.ERROR} **Not a valid Number**`);
                                        if (Number(number) < 0 || Number(number) > 15)
                                            return message.reply(`${allEmojis.msg.ERROR} **The Number must be between \`0\` and \`15\`**`);

                                        try {
                                            client.blacklist.set(message.guild.id, Number(number), "mute_amount");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit("Successfully set the New Maximum Allowed Amounts to " +
                                                                number +
                                                                " Times", 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`**If someone does it over __${number} times__ he/she/they will get muted for 10 Minutes!**`.substring(
                                                                0,
                                                                2048
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antidiscord"][
                                                                    "variable16"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antidiscord"][
                                                                    "variable17"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("You didn't add a valid message content");
                                    }
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antidiscord"]["variable18"]), 256)
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-blacklist"]["variable21"]), 4096)),
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
