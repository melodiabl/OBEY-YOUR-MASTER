const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { databasing, edit_Roster_msg, send_roster_msg } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { getNumberEmojis, allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-roster",
    category: "Setup",
    aliases: ["setuproster", "roster-setup", "rostersetup"],
    cooldown: 5,
    usage: "setup-roster --> Follow Steps",
    description: "Gestiona 25 Sistemas de Lista diferentes",
    memberpermissions: ['Administrador'],
    type: "system",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        let pre;
        const filter = (reaction, user) => {
            return user.id == cmduser.id;
        };
        try {
            const obj = {};
            for (let i = 1; i <= 100; i++) {
                obj[`roster${i}`] = {
                    rosterchannel: "notvalid",
                    rosteremoji: "➤",
                    rostermessage: "",
                    rostertitle: "Roster",
                    rosterstyle: "1",
                    rosterroles: [],
                    inline: false,
                };
            }
            client.roster.ensure(message.guild.id, obj);

            const NumberEmojis = getNumberEmojis();
            first_layer();
            var thedb = client.roster;
            async function first_layer() {
                let menuoptions = [];
                for (let i = 1; i <= 100; i++) {
                    const emoji = NumberEmojis[i];
                    menuoptions.push({
                        value: `${i} Roster System`,
                        description: `Manage/Edit the ${i}. Servidor Roster System`,
                        ...(emoji ? { emoji } : {}),
                    });
                }

                let row1 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("MenuSelection")
                        .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                        .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                        .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Roster System!"))
                        .addOptions(
                            menuoptions.slice(0, 25).map(option => {
                                let Obj = {
                                    label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                    value: option.value.substring(0, 50),
                                    description: option.description.substring(0, 50),
                                };
                                if (option.emoji) Obj.emoji = option.emoji;
                                return Obj;
                            })
                        )
                );
                let row2 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("MenuSelection2")
                        .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                        .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                        .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Roster System!"))
                        .addOptions(
                            menuoptions.slice(25, 50).map(option => {
                                let Obj = {
                                    label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                    value: option.value.substring(0, 50),
                                    description: option.description.substring(0, 50),
                                };
                                if (option.emoji) Obj.emoji = option.emoji;
                                return Obj;
                            })
                        )
                );
                let row3 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("MenuSelection3")
                        .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                        .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                        .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Roster System!"))
                        .addOptions(
                            menuoptions.slice(50, 75).map(option => {
                                let Obj = {
                                    label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                    value: option.value.substring(0, 50),
                                    description: option.description.substring(0, 50),
                                };
                                if (option.emoji) Obj.emoji = option.emoji;
                                return Obj;
                            })
                        )
                );
                let row4 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("MenuSelection4")
                        .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                        .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                        .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Roster System!"))
                        .addOptions(
                            menuoptions.slice(75, 100).map(option => {
                                let Obj = {
                                    label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                    value: option.value.substring(0, 50),
                                    description: option.description.substring(0, 50),
                                };
                                if (option.emoji) Obj.emoji = option.emoji;
                                return Obj;
                            })
                        )
                );

                //define the embed
                let MenuEmbed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor(obeyMeta.asAuthor(client.getAuthor(
                            "Server Roster Setup",
                            "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/facebook/65/page-with-curl_1f4c3.png",
                            "https://github.com/melodiabl"
                        )))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]), 4096));
                let used1 = false;
                //send the menu msg
                let menumsg = await message.reply({ embeds: [MenuEmbed], components: [row1, row2, row3, row4] });
                //function to handle the menuselection
                function menuselection(menu) {
                    let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                    if (menu?.values[0] == "Cancel")
                        return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"]));
                    menu?.deferUpdate();
                    let SetupNumber = menu?.values[0].split(" ")[0];
                    pre = `roster${SetupNumber}`;
                    used1 = true;
                    second_layer(SetupNumber, menuoptiondata);
                }
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
                        menuselection(menu);
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
            async function second_layer(SetupNumber, menuoptiondata) {
                let menuoptions = [
                    {
                        value: "Define Channel",
                        description: `Define the Canal for this Roster System`,
                        emoji: obeyUi.component(allEmojis.msg.channel),
                    },
                    {
                        value: "Add Roster Role",
                        description: `Add a Roster Rol to the bottom to get displayed`,
                        emoji: obeyUi.component(allEmojis.msg.SUCCESS),
                    },
                    {
                        value: "Remove Roster Role",
                        description: `Removido a displayed Roster Rol of the List`,
                        emoji: obeyUi.component(allEmojis.msg.ERROR),
                    },
                    {
                        value: "Show Roster Roles",
                        description: `Show all Roster Roles of this Roster`,
                        emoji: obeyUi.component(allEmojis.msg.list),
                    },
                    {
                        value: "Edit Roster Style",
                        description: `Adjust the Display Style of this Roster`,
                        emoji: obeyUi.component(allEmojis.msg.setup),
                    },
                    {
                        value: "Edit Emoji",
                        description: `Edit the Emoji/Text infront of the Names`,
                        emoji: obeyUi.component(allEmojis.msg.edit),
                    },
                    {
                        value: "Set Title",
                        description: `Set the Embed Title of that Roster`,
                        emoji: obeyUi.component(allEmojis.msg.title),
                    },
                    {
                        value: `${thedb?.get(message.guild.id, pre + ".inline") ? "Disable Multiple Rows" : "Enable Roster Rows"}`,
                        description: `${thedb?.get(message.guild.id, pre + ".inline") ? "Disable that i inline all Fields" : "Enable that i inline all Fields"}`,
                        emoji: obeyUi.component("📰"),
                    },
                    {
                        value: `${thedb?.get(message.guild.id, pre + ".showallroles") ? "Cut Members off" : "Show all members"}`,
                        description: `${thedb?.get(message.guild.id, pre + ".showallroles") ? "Cut Members off and show the rest amount" : "Don't cut Off, show all of them"}`,
                        emoji: obeyUi.component("📰"),
                    },

                    {
                        value: "Delete & Reset",
                        description: `Delete current setup, which allows you to resetup`,
                        emoji: obeyUi.component("☠️"),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Ticket-Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1)
                    .setMinValues(1)
                    .setPlaceholder(
                        obeyUi.plain(`Click me to manage the ${SetupNumber} Roster System!\n\n**You've picked:**\n> ${menuoptiondata.value}`)
                    )
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
                    .setAuthor(obeyMeta.asAuthor({ name: SetupNumber + " Server Roster Setup", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/facebook/65/page-with-curl_1f4c3.png", url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable4"]), 4096));
                //send the menu msg
                let menumsg = await message.reply({
                    embeds: [MenuEmbed],
                    components: [new ActionRowBuilder().addComponents(Selection)],
                });
                //function to handle the menuselection
                function menuselection(menu) {
                    let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                    if (menu?.values[0] == "Cancel")
                        return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable5"]));
                    menu?.deferUpdate();
                    handle_the_picks(menu?.values[0], SetupNumber);
                }
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
                        menuselection(menu);
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

            async function handle_the_picks(optionhandletype, SetupNumber, ticket) {
                switch (optionhandletype) {
                    case "Define Channel":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable7"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable8"]), 4096))
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
                                            thedb?.set(message.guild.id, channel.id, pre + ".rosterchannel");
                                            send_roster_msg(client, message.guild, thedb, pre);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable9"]), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`To add Roles to the Roster type: \`${prefix}setup-roster\``.substring(
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
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable10"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable20"]
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
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable12"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Add Roster Role":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable13"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable14"]), 4096))
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
                                    var role = message.mentions.roles
                                        .filter(role => role.guild.id == message.guild.id)
                                        .first();
                                    if (role) {
                                        var rosteroles = thedb?.get(message.guild.id, pre + ".rosterroles");
                                        if (rosteroles.includes(role.id))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable15"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable16"]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            thedb?.push(message.guild.id, role.id, pre + ".rosterroles");
                                            edit_Roster_msg(client, message.guild, thedb, pre);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable17"]
                                                            ), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable18"]
                                                            ), 4096)
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
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable19"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable29"]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        return message.reply("¡no mencionaste un Rol válido!");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable21"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Remove Roster Role":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable22"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable23"]), 4096))
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
                                    var role = message.mentions.roles
                                        .filter(role => role.guild.id == message.guild.id)
                                        .first();
                                    if (role) {
                                        var rosteroles = thedb?.get(message.guild.id, pre + ".rosterroles");
                                        if (!rosteroles.includes(role.id))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable24"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable25"]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            thedb?.remove(message.guild.id, role.id, pre + ".rosterroles");
                                            edit_Roster_msg(client, message.guild, thedb, pre);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable26"]
                                                            ), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable27"]
                                                            ), 4096)
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
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable28"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable49"]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        return message.reply("¡no mencionaste un Rol válido!");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable30"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Show Roster Roles":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable31"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable32"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case "Edit Roster Style":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable33"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable34"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                            try {
                                for (const emoji of ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"]) tempmsg.react(obeyUi.reaction(emoji));
                            } catch (e) {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                            }
                            await tempmsg
                                .awaitReactions({
                                    filter,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(collected => {
                                    var reaction = collected.first();
                                    reaction.users.remove(message.author.id);
                                    if (obeyUi.matchesReaction(reaction.emoji, "1️⃣")) {
                                        thedb?.set(message.guild.id, "1", pre + ".rosterstyle");
                                        edit_Roster_msg(client, message.guild, thedb, pre);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable35"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`The Roster will edit soon!\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                            0,
                                                            2000
                                                        ), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    } else if (obeyUi.matchesReaction(reaction.emoji, "2️⃣")) {
                                        thedb?.set(message.guild.id, "2", pre + ".rosterstyle");
                                        edit_Roster_msg(client, message.guild, thedb, pre);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable36"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`The Roster will edit soon!\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                            0,
                                                            2000
                                                        ), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    } else if (obeyUi.matchesReaction(reaction.emoji, "3️⃣")) {
                                        thedb?.set(message.guild.id, "3", pre + ".rosterstyle");
                                        edit_Roster_msg(client, message.guild, thedb, pre);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable37"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`The Roster will edit soon!\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                            0,
                                                            2000
                                                        ), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    } else if (obeyUi.matchesReaction(reaction.emoji, "4️⃣")) {
                                        thedb?.set(message.guild.id, "4", pre + ".rosterstyle");
                                        edit_Roster_msg(client, message.guild, thedb, pre);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable38"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`The Roster will edit soon!\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                            0,
                                                            2000
                                                        ), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    } else if (obeyUi.matchesReaction(reaction.emoji, "5️⃣")) {
                                        thedb?.set(message.guild.id, "5", pre + ".rosterstyle");
                                        edit_Roster_msg(client, message.guild, thedb, pre);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable39"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`The Roster will edit soon!\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                            0,
                                                            2000
                                                        ), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    } else if (obeyUi.matchesReaction(reaction.emoji, "6️⃣")) {
                                        thedb?.set(message.guild.id, "6", pre + ".rosterstyle");
                                        edit_Roster_msg(client, message.guild, thedb, pre);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable40"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`The Roster will edit soon!\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                            0,
                                                            2000
                                                        ), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    } else if (obeyUi.matchesReaction(reaction.emoji, "7️⃣")) {
                                        thedb?.set(message.guild.id, "7", "rosterstyle");
                                        edit_Roster_msg(client, message.guild, thedb, pre);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable41"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`The Roster will edit soon!\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                            0,
                                                            2000
                                                        ), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    return message.reply("Reaccionaste con un emoji incorrecto");
                                })
                                .catch(e => {
                                    timeouterror = e;
                                });
                            if (timeouterror)
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable42"]), 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                        }
                        break;
                    case "Edit Emoji":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable43"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable44"]), 4096))
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
                                    var msg = collected.first().content;

                                    if (msg) {
                                        if (msg.toLowerCase() == "noemoji") {
                                            thedb?.set(message.guild.id, "", pre + ".rosteremoji");
                                            edit_Roster_msg(client, message.guild, thedb, pre);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable45"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`To add Roles to the Roster type: \`${prefix}setup-roster\`\n\nExample: \n<@${message.author.id}> | \`${message.author.username}\`\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                                0,
                                                                2048
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                            return;
                                        }
                                        try {
                                            if (msg.includes(":")) {
                                                thedb?.set(message.guild.id, msg, pre + ".rosteremoji");
                                                edit_Roster_msg(client, message.guild, thedb, pre);
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["setup"]["setup-roster"][
                                                                        "variable46"
                                                                    ]
                                                                ), 256)
                                                            )
                                                            .setColor(es.color)
                                                            .setDescription(
                                                                obeyUi.limit(`To add Roles to the Roster type: \`${prefix}setup-roster\`\n\nExample: \n${msg} <@${message.author.id}> | \`${message.author.username}\`\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                                    0,
                                                                    2048
                                                                ), 4096)
                                                            )
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            }
                                            thedb?.set(message.guild.id, msg.substring(0, 5), pre + ".rosteremoji");
                                            edit_Roster_msg(client, message.guild, thedb, pre);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable47"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`To add Roles to the Roster type: \`${prefix}setup-roster\`\n\nExample: \n${msg.substring(0, 5)} <@${message.author.id}> | \`${message.author.username}\`\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
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
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable48"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable55"]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        return message.reply("no añadiste un mensaje válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable50"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Set Title":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable51"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable52"]), 4096))
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
                                    var msg = collected.first().content;

                                    if (msg) {
                                        try {
                                            thedb?.set(message.guild.id, msg.substring(0, 256), pre + ".rostertitle");
                                            edit_Roster_msg(client, message.guild, thedb, pre);
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable53"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`To add Roles to the Roster type: \`${prefix}setup-roster\`\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
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
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable54"]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-roster"]["variable61"]
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        return message.reply("no añadiste un mensaje válido");
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable56"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case `${thedb?.get(message.guild.id, pre + ".inline") ? "Disable Multiple Rows" : "Enable Roster Rows"}`:
                        {
                            thedb?.set(message.guild.id, !thedb?.get(message.guild.id, pre + ".inline"), "inline");
                            edit_Roster_msg(client, message.guild, thedb, pre);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable57"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`To add Roles to the Roster type: \`${prefix}setup-roster\`\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                0,
                                                2048
                                            ), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case `${thedb?.get(message.guild.id, pre + ".showallroles") ? "Cut Members off" : "Show all members"}`:
                        {
                            thedb?.set(
                                message.guild.id,
                                !thedb?.get(message.guild.id, pre + ".showallroles"),
                                pre + ".showallroles"
                            );
                            edit_Roster_msg(client, message.guild, thedb, pre);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable58"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`To add Roles to the Roster type: \`${prefix}setup-roster\`\n\nIt will update in less then **5 Minutes**, *If it did not update yet*`.substring(
                                                0,
                                                2048
                                            ), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case `Delete & Reset`:
                        {
                            thedb?.set(
                                message.guild.id,
                                {
                                    rosterchannel: "notvalid",
                                    rosteremoji: "➤",
                                    showallroles: false,
                                    rostermessage: "",
                                    rostertitle: "Roster",
                                    rosterstyle: "1",
                                    rosterroles: [],
                                    inline: false,
                                },
                                pre
                            );
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-roster"]["variable59"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(`Re-set-it-up with: \`${prefix}setup-roster\``.substring(0, 2048), 4096))
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
                        .setDescription(obeyUi.limit(`\`\`\`${String(JSON.stringify(e)).substring(0, 2000)}\`\`\``, 4096)),
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
