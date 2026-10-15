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
    name: "setup-antilink",
    category: "Setup",
    aliases: ["setupantilink", "antilinks-setup", "antilink-setup", "antilinksetup", "setup-antilinks"],
    cooldown: 5,
    usage: "setup-antilink --> Sigue los Pasos",
    description: "Activar/Desactivar sistema anti Enlaces",
    memberpermissions: ['Administrador'],
    type: "security",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            ///////////////////////////////////////
            ///////////////////////////////////////
            ///////////////////////////////////////
            let tempmsg;

            //function to handle true/false
            const d2p = bool => (bool ? obeyUi.owned("`✔️ Enabled`") : obeyUi.owned("`❌ Disabled`"));
            //call the first layer
            first_layer();

            //function to handle the FIRST LAYER of the SELECTION
            async function first_layer() {
                let menuoptions = [
                    {
                        value: `${client.settings.get(message.guild.id, `antilink.enabled`) ? "Disable" : "Enable"} Anti Links`,
                        description: `${client.settings.get(message.guild.id, `antilink.enabled`) ? "Don't delete other Links" : "Delete other Links"}`,
                        emoji: obeyUi.component(`${client.settings.get(message.guild.id, `antilink.enabled`) ? allEmojis.msg.ERROR : allEmojis.msg.SUCCESS}`),
                    },
                    {
                        value: "Settings",
                        description: `Show the current Ajustes of the Anti-Link System`,
                        emoji: obeyUi.component(allEmojis.msg.list),
                    },
                    {
                        value: "Add Whitelist-CHANNEL",
                        description: `Allow Channels where it is allowed`,
                        emoji: obeyUi.component("💯"),
                    },
                    {
                        value: "Remove Whitelist-CHANNEL",
                        description: `Remove allowed Channels`,
                        emoji: obeyUi.component("💢"),
                    },
                    {
                        value: "Add Whitelist-LINK",
                        description: `Allow Links of specific Servidor(s)`,
                        emoji: obeyUi.component("🔗"),
                    },
                    {
                        value: "Remove Whitelist-LINK",
                        description: `Remove allowed Links`,
                        emoji: obeyUi.component("💢"),
                    },
                    {
                        value: "Change Max-Mute Amount",
                        description: `Change the max allow Time to do it before mute!`,
                        emoji: obeyUi.component("🕛"),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Ticket-Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                let Selection = new StringSelectMenuBuilder()
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Anti-Link-Links System!"))
                    .setCustomId("MenuSelection")
                    .setMaxValues(1)
                    .setMinValues(1)
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
                let MenuEmbed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor(obeyMeta.asAuthor({ name: "Anti-Links System Setup", iconURL: obeyUi.image("icon.code"), url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable1"]), 4096));
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
                        let menuoptionindex = menuoptions.findIndex(v => v.value == menu?.values[0]);
                        if (menu?.values[0] == "Cancel")
                            return menu?.reply({
                                content: eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable2"]),
                            });
                        menu?.deferUpdate();
                        used1 = true;
                        handle_the_picks(menuoptionindex, menuoptiondata);
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

            //THE FUNCTION TO HANDLE THE SELECTION PICS
            async function handle_the_picks(menuoptionindex, menuoptiondata) {
                switch (menuoptionindex) {
                    case 0:
                        {
                            client.settings.set(
                                message.guild.id,
                                !client.settings.get(message.guild.id, `antilink.enabled`),
                                `antilink.enabled`
                            );
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable3"]), 256))
                                        .setColor(es.color)
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case 1:
                        {
                            let thesettings = client.settings.get(message.guild.id, `antilink`);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable4"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`**Activado:** ${thesettings.enabled ? allEmojis.msg.SUCCESS : allEmojis.msg.ERROR}\n\n**Witelisted Channels:** ${thesettings.whitelistedchannels && thesettings.whitelistedchannels.length > 0 ? `<#${thesettings.whitelistedchannels.join("> | <#")}>` : "No Channels Whitelisted!"}\n\n**Information:** *Anti Discord are not enabled in Tickets from THIS BOT*`.substring(
                                                0,
                                                2048
                                            ), 4096)
                                        )
                                        .addFields({ name: "**Whitelisted Links**", value: `${thesettings.whitelistedlinks.lenght > 0 ? thesettings.whitelistedlinks.join("\n").substring(0, 1024) : "No Links allowed!"}` })
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case 2:
                        {
                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable5"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable6"]), 4096))
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
                                        let antisettings = client.settings.get(
                                            message.guild.id,
                                            "antilink.whitelistedchannels"
                                        );
                                        if (antisettings.includes(channel.id))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable7"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            client.settings.push(
                                                message.guild.id,
                                                channel.id,
                                                "antilink.whitelistedchannels"
                                            );
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable8"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`Every single Canal:\n> <#${client.settings.get(message.guild.id, "antilink.whitelistedchannels").join(">\n> <#")}>\nis not checked by the Anti Links System`.substring(
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
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable9"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"][
                                                                    "variable10"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        return message.reply("¡no mencionaste un Canal válido!");
                                    }
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable11"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case 3:
                        {
                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable12"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable13"]), 4096))
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
                                        let antisettings = client.settings.get(
                                            message.guild.id,
                                            "antilink.whitelistedchannels"
                                        );
                                        if (!antisettings.includes(channel.id))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"][
                                                                    "variable14"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            client.settings.remove(
                                                message.guild.id,
                                                channel.id,
                                                "antilink.whitelistedchannels"
                                            );
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"][
                                                                    "variable15"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`Every single Canal:\n<#${client.settings.get(message.guild.id, "antilink.whitelistedchannels").join(">\n<#")}>\nis not a checked by the Anti Links System`.substring(
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
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"][
                                                                    "variable16"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"][
                                                                    "variable17"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        return message.reply("¡no mencionaste un Canal válido!");
                                    }
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable18"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case 4:
                        {
                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit("Which Link do you want to enable?", 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`Just send it in!\n**NOTE:**\n> It is suggest to remove the \`https\`, because it just checks, **if the Link contains what you send**\n\n**Example:**\n> If you want to allow \`https://bero-host.de\` then make sure to send: \`bero-host.de\``, 4096)
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
                                    var { content } = message;
                                    if (content) {
                                        let antisettings = client.settings.get(
                                            message.guild.id,
                                            "antilink.whitelistedlinks"
                                        );
                                        if (antisettings.includes(content))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit("This Link is already Allowed! you can remove it if you want!", 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            client.settings.push(message.guild.id, content, "antilink.whitelistedlinks");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(obeyUi.limit(`Añadido the Link ${content} to the allowed links!`, 256))
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`Every single allowed Link:\n> ${client.settings.get(message.guild.id, "antilink.whitelistedlinks").join("\n> ")}\nIs not a checked by the Anti Discord Links System`.substring(
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
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable9"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"][
                                                                    "variable10"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("you didn't send a valid Link");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable11"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case 5:
                        {
                            let antisettings = client.settings.get(message.guild.id, "antilink.whitelistedlinks");
                            if (antisettings.length < 1) return message.reply(`${allEmojis.msg.ERROR} There are no links whitelisted...`);
                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit("Which Link do you want to disable again?\nSend the Link in the Chat", 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(`${antisettings.map(i => `\`${i}\``).join("\n")}`, 4096))
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
                                    var { content } = message;
                                    if (content) {
                                        if (!antisettings.includes(content))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(obeyUi.limit("This Link is already not whitelisted!", 256))
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            client.settings.remove(message.guild.id, content, "antilink.whitelistedlinks");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(obeyUi.limit(`Removido the Link ${content} from the allowed links!`, 256))
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`Every single allowed Link:\n> ${client.settings.get(message.guild.id, "antilink.whitelistedlinks").join("\n> ")}\nIs not a checked by the Anti Discord Links System`.substring(
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
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable9"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-antilink"][
                                                                    "variable10"
                                                                ]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        message.reply("you didn't send a valid Link");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable11"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case 6:
                        {
                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit("How often should someone be allowed to do it within 15 Seconds?", 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`Currently it is at: \`${client.settings.get(message.guild.id, "antilink.mute_amount")}\`\n\nPlease just send the Number! (0 means after the first time he/she will get muted)`, 4096)
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
                                            client.settings.set(message.guild.id, Number(number), "antilink.mute_amount");
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

            ///////////////////////////////////////
            ///////////////////////////////////////
            ///////////////////////////////////////s
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-antilink"]["variable19"]), 4096)),
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
