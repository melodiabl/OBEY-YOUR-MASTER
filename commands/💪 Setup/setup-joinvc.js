var { EmbedBuilder, MessageMentions, ChannelType } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing, edit_msg, send_roster, duration } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-joinvc",
    category: "💪 Setup",
    aliases: ["setupjoinvc", "joinvc-setup"],
    cooldown: 5,
    usage: "setup-joinvc --> Sigue los Pasos",
    description: "Define un Canal donde cada mensaje se reemplaza con un EMBED o desactiva esta función",
    memberpermissions: ['Administrador'],
    type: "system",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            //ensure the database
            client.joinvc.ensure(message.guild.id, {
                vcmessages: [
                    /*
           {
            channelId: "",
            textChannelId: "",
            message: "",
           }
          */
                ],
                vcroles: [
                    /*
            {
              channelId: "",
              roleId: "",
            }
          */
                ],
            });
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Send Message in a Channel",
                        description: `Send a Mensaje on Join, and edit it on leave`,
                        emoji: allEmojis.msg.channel,
                    },
                    {
                        value: "Add / Remove Role",
                        description: `Add a Rol on Join, Remove it on Leave.`,
                        emoji: allEmojis.msg.roles,
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Configuración!`,
                        emoji: allEmojis.msg.cancel,
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder("¡Haz clic para configurar the Join VC System")
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
                    .setAuthor({ name: "Join VC System", iconURL: "https://cdn.discordapp.com/emojis/834052497492410388.gif?size=96", url: "https://github.com/melodiabl" })
                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]))
                    .addFields({ name: "Send Message in a Channel", value: `If a User joins a specific Channel, it will send a define able Message (e.g. Ping for Role(s)) in a defined Channel.\nThis is useful if you have a Waitingroomchannel, and it's needed to check if a user joins it or not with pings!\n*After leaving the Channel, the sent message get's edited and removes the ping*` })
                    .addFields({ name: "Add / Remove Role", value: `If a User joins a VC he/she will get a specific Role, this Role will get removed again, if he/she leaves the vc again!` });
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
                        handle_the_picks(menu?.values[0], menuoptiondata);
                    } else
                        menu?.reply({
                            content: `<:no:833101993668771842> ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                            ephemeral: true,
                        });
                });
                //Once the Collections ended edit the menu message
                collector.on("end", collected => {
                    menumsg.edit({
                        embeds: [EmbedBuilder.from(menumsg.embeds[0]).setDescription(`~~${menumsg.embeds[0].description}~~`)],
                        components: [],
                        content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : "❌ **NOTHING SELECTED - CANCELLED**"}`,
                    });
                });
            }
            async function handle_the_picks(optionhandletype, menuoptiondata) {
                switch (optionhandletype) {
                    case "Send Message in a Channel":
                        {
                            second_layer();
                            async function second_layer() {
                                let menuoptions = [
                                    {
                                        value: "Add a VC",
                                        description: `Add a Vc Canal and Mensaje to send.`,
                                        emoji: allEmojis.msg.SUCCESS,
                                    },
                                    {
                                        value: "Remove a VC",
                                        description: `Remove an already added VC-Canal.`,
                                        emoji: allEmojis.msg.ERROR,
                                    },
                                    {
                                        value: "Show all VCS",
                                        description: `Show all setup Channels!`,
                                        emoji: allEmojis.msg.list,
                                    },
                                    {
                                        value: "Cancel",
                                        description: `Cancelar and stop the Configuración!`,
                                        emoji: allEmojis.msg.cancel,
                                    },
                                ];
                                //define the selection
                                let Selection = new StringSelectMenuBuilder()
                                    .setCustomId("MenuSelection")
                                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                    .setPlaceholder("¡Haz clic para configurar the Join VC System")
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
                                let MenuEmbed = new Discord.EmbedBuilder()
                                    .setColor(es.color)
                                    .setAuthor({ name: "Join VC System", iconURL: "https://cdn.discordapp.com/emojis/834052497492410388.gif?size=96", url: "https://github.com/melodiabl" })
                                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]));
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
                                            return menu?.reply(
                                                eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"])
                                            );
                                        menu?.deferUpdate();
                                        handle_the_picks2(menu?.values[0], menuoptiondata);
                                    } else
                                        menu?.reply({
                                            content: `<:no:833101993668771842> ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                            ephemeral: true,
                                        });
                                });
                                //Once the Collections ended edit the menu message
                                collector.on("end", collected => {
                                    menumsg.edit({
                                        embeds: [EmbedBuilder.from(menumsg.embeds[0]).setDescription(`~~${menumsg.embeds[0].description}~~`)],
                                        components: [],
                                        content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : "❌ **NOTHING SELECTED - CANCELLED**"}`,
                                    });
                                });
                            }
                            async function handle_the_picks2(optionhandletype, menuoptiondata) {
                                switch (optionhandletype) {
                                    case "Add a VC":
                                        {
                                            let tempmsg = await message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(`**Which Canal do you wanna add?**`)
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            `Por favor Ping the **VOICE CHANNEL** now! / Send the **ID** the **Talk**!\nAnd add the **LOG_CHANNEL** in VIA ID / PING afterwards!\nAnd then add the Mensaje at the end!\n\n**Examples:**\n> \`#VoiceChannel #TextChannel @Voice-Support Someone joined the Voice Support, check the Embed!\`\n> \`901905221851156552 901904924709908540 @Voice-Support Someone joined the Voice Support, check the Embed!\``
                                                        )
                                                        .setFooter(client.getFooter(es)),
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
                                                    let ChannelRegex = message.content
                                                        .match(MessageMentions.CHANNELS_PATTERN)
                                                        ?.map(r =>
                                                            message.guild.channels.cache.get(r.replace(/[<@&#>]/giu, ""))
                                                        );
                                                    var Voicechannel =
                                                        ChannelRegex && ChannelRegex.length >= 1
                                                            ? ChannelRegex[0]
                                                            : message.guild.channels.cache.get(
                                                                  message.content.trim().split(" ")[0]
                                                              );
                                                    var Textchannel =
                                                        ChannelRegex && ChannelRegex.length >= 2
                                                            ? ChannelRegex[1]
                                                            : message.guild.channels.cache.get(
                                                                  message.content.trim().split(" ")[1]
                                                              );
                                                    if (
                                                        !Voicechannel ||
                                                        !Textchannel ||
                                                        Voicechannel.type != ChannelType.GuildVoice ||
                                                        Textchannel.type != "GUILD_TEXT"
                                                    )
                                                        return message.reply(
                                                            `${allEmojis.msg.ERROR} **Check the example in the Embed, wrong input type!**`
                                                        );
                                                    try {
                                                        let a = client.joinvc.get(message.guild.id, "vcmessages");
                                                        //remove invalid ids
                                                        for (const vc of a) {
                                                            if (!message.guild.channels.cache.get(vc.channelId)) {
                                                                client.joinvc.remove(
                                                                    message.guild.id,
                                                                    d => d.channelId == vc.channelId,
                                                                    "vcmessages"
                                                                );
                                                            }
                                                            if (!message.guild.channels.cache.get(vc.textChannelId)) {
                                                                client.joinvc.remove(
                                                                    message.guild.id,
                                                                    d => d.textChannelId == vc.textChannelId,
                                                                    "vcmessages"
                                                                );
                                                            }
                                                        }
                                                        a = client.joinvc.get(message.guild.id, "vcmessages");
                                                        if (a.map(d => d.channelId).includes(Voicechannel.id))
                                                            return message.reply({
                                                                embeds: [
                                                                    new Discord.EmbedBuilder()
                                                                        .setTitle(
                                                                            `<:no:833101993668771842> This Canal is already Setupped!`
                                                                        )
                                                                        .setDescription(
                                                                            `Remove it first with \`${prefix}setup-joinvc\` --> Then Pick VC Messages --> Then Pick Remove!`
                                                                        )
                                                                        .setColor(es.color)
                                                                        .setFooter(client.getFooter(es)),
                                                                ],
                                                            });
                                                        var args = message.content.split(" ").slice(2);

                                                        client.joinvc.push(
                                                            message.guild.id,
                                                            {
                                                                channelId: Voicechannel.id,
                                                                textChannelId: Textchannel.id,
                                                                message: args.join(" "),
                                                            },
                                                            "vcmessages"
                                                        );
                                                        return message.reply({
                                                            embeds: [
                                                                new Discord.EmbedBuilder()
                                                                    .setTitle(
                                                                        `${allEmojis.msg.SUCCESS} I will now send Messages after someone joins the VC \`${Voicechannel.name}\` in the TextChannel **${Textchannel.name}**`
                                                                    )
                                                                    .setColor(es.color)
                                                                    .setFooter(client.getFooter(es)),
                                                            ],
                                                        });
                                                    } catch (e) {
                                                        return message.reply({
                                                            embeds: [
                                                                new Discord.EmbedBuilder()
                                                                    .setTitle(
                                                                        eval(
                                                                            client.la[ls]["cmds"]["setup"][
                                                                                "setup-autoembed"
                                                                            ]["variable10"]
                                                                        )
                                                                    )
                                                                    .setColor(es.wrongcolor)
                                                                    .setDescription(
                                                                        eval(
                                                                            client.la[ls]["cmds"]["setup"][
                                                                                "setup-autoembed"
                                                                            ]["variable11"]
                                                                        )
                                                                    )
                                                                    .setFooter(client.getFooter(es)),
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
                                                                    eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                            "variable12"
                                                                        ]
                                                                    )
                                                                )
                                                                .setColor(es.wrongcolor)
                                                                .setDescription(
                                                                    `¡Operación Cancelada!`.substring(0, 2000)
                                                                )
                                                                .setFooter(client.getFooter(es)),
                                                        ],
                                                    });
                                                });
                                        }
                                        break;
                                    case "Remove a VC":
                                        {
                                            let tempmsg = await message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable13"
                                                                ]
                                                            )
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable14"
                                                                ]
                                                            )
                                                        )
                                                        .setFooter(client.getFooter(es)),
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
                                                    var Voicechannel =
                                                        message.mentions.channels
                                                            .filter(
                                                                ch =>
                                                                    ch.guild.id == message.guild.id &&
                                                                    ch.type == ChannelType.GuildVoice
                                                            )
                                                            .first() ||
                                                        message.guild.channels.cache.get(
                                                            message.content.trim().split(" ")[0]
                                                        );
                                                    if (!Voicechannel || Voicechannel.type != ChannelType.GuildVoice)
                                                        return message.reply(
                                                                `${allEmojis.msg.ERROR} **Check the example in the Embed, wrong input type!**`
                                                        );
                                                    try {
                                                        let a = client.joinvc.get(message.guild.id, "vcmessages");
                                                        //remove invalid ids
                                                        for (const vc of a) {
                                                            if (!message.guild.channels.cache.get(vc.channelId)) {
                                                                client.joinvc.remove(
                                                                    message.guild.id,
                                                                    d => d.channelId == vc.channelId,
                                                                    "vcmessages"
                                                                );
                                                            }
                                                            if (!message.guild.channels.cache.get(vc.textChannelId)) {
                                                                client.joinvc.remove(
                                                                    message.guild.id,
                                                                    d => d.textChannelId == vc.textChannelId,
                                                                    "vcmessages"
                                                                );
                                                            }
                                                        }
                                                        a = client.joinvc.get(message.guild.id, "vcmessages");
                                                        if (!a.map(d => d.channelId).includes(Voicechannel.id))
                                                            return message.reply({
                                                                embeds: [
                                                                    new Discord.EmbedBuilder()
                                                                        .setTitle(
                                                                            `<:no:833101993668771842> This Canal has not been Configuración yet!`
                                                                        )
                                                                        .setColor(es.color)
                                                                        .setFooter(client.getFooter(es)),
                                                                ],
                                                            });
                                                        client.joinvc.remove(
                                                            message.guild.id,
                                                            d => d.channelId == Voicechannel.id,
                                                            "vcmessages"
                                                        );
                                                        return message.reply({
                                                            embeds: [
                                                                new Discord.EmbedBuilder()
                                                                    .setTitle(
                                                                        `${allEmojis.msg.SUCCESS} Successfully removed **${Voicechannel.name}** out of the Configuración!`
                                                                    )
                                                                    .setColor(es.color)
                                                                    .setFooter(client.getFooter(es)),
                                                            ],
                                                        });
                                                    } catch (e) {
                                                        return message.reply({
                                                            embeds: [
                                                                new Discord.EmbedBuilder()
                                                                    .setTitle(
                                                                        eval(
                                                                            client.la[ls]["cmds"]["setup"][
                                                                                "setup-autoembed"
                                                                            ]["variable18"]
                                                                        )
                                                                    )
                                                                    .setColor(es.wrongcolor)
                                                                    .setDescription(
                                                                        eval(
                                                                            client.la[ls]["cmds"]["setup"][
                                                                                "setup-autoembed"
                                                                            ]["variable19"]
                                                                        )
                                                                    )
                                                                    .setFooter(client.getFooter(es)),
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
                                                                    eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                            "variable12"
                                                                        ]
                                                                    )
                                                                )
                                                                .setColor(es.wrongcolor)
                                                                .setDescription(
                                                                    `¡Operación Cancelada!`.substring(0, 2000)
                                                                )
                                                                .setFooter(client.getFooter(es)),
                                                        ],
                                                    });
                                                });
                                        }
                                        break;
                                    case "Show all VCS":
                                        {
                                            let a = client.joinvc.get(message.guild.id, "vcmessages");
                                            //remove invalid ids
                                            for (const vc of a) {
                                                if (!message.guild.channels.cache.get(vc.channelId)) {
                                                    client.joinvc.remove(
                                                        message.guild.id,
                                                        d => d.channelId == vc.channelId,
                                                        "vcmessages"
                                                    );
                                                }
                                                if (!message.guild.channels.cache.get(vc.textChannelId)) {
                                                    client.joinvc.remove(
                                                        message.guild.id,
                                                        d => d.textChannelId == vc.textChannelId,
                                                        "vcmessages"
                                                    );
                                                }
                                            }
                                            a = client.joinvc.get(message.guild.id, "vcmessages");

                                            message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(`📑 Ajustes of the Join Vc-Messages System`)
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            `**VCS Where a Mensaje is sent:**\n${a.map(d => `<#${d.channelId}> [Send in: <#${d.textChannelId}>]`).join("\n")}`.substring(
                                                                0,
                                                                2000
                                                            )
                                                        )
                                                        .setFooter(client.getFooter(es)),
                                                ],
                                            });
                                        }
                                        break;
                                }
                            }
                        }
                        break;
                    case "Add / Remove Role":
                        {
                            second_layer();
                            async function second_layer() {
                                let menuoptions = [
                                    {
                                        value: "Add a VC",
                                        description: `Add a Vc Canal and Rol to add/remove.`,
                                        emoji: allEmojis.msg.SUCCESS,
                                    },
                                    {
                                        value: "Remove a VC",
                                        description: `Remove an already added VC-Canal.`,
                                        emoji: allEmojis.msg.ERROR,
                                    },
                                    {
                                        value: "Show all VCS",
                                        description: `Show all setup Channels!`,
                                        emoji: allEmojis.msg.list,
                                    },
                                    {
                                        value: "Cancel",
                                        description: `Cancelar and stop the Configuración!`,
                                        emoji: allEmojis.msg.cancel,
                                    },
                                ];
                                //define the selection
                                let Selection = new StringSelectMenuBuilder()
                                    .setCustomId("MenuSelection")
                                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                    .setPlaceholder("¡Haz clic para configurar the Join VC System")
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
                                let MenuEmbed = new Discord.EmbedBuilder()
                                    .setColor(es.color)
                                    .setAuthor({ name: "Join VC System", iconURL: "https://cdn.discordapp.com/emojis/834052497492410388.gif?size=96", url: "https://github.com/melodiabl" })
                                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]));
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
                                            return menu?.reply(
                                                eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"])
                                            );
                                        menu?.deferUpdate();
                                        handle_the_picks2(menu?.values[0], menuoptiondata);
                                    } else
                                        menu?.reply({
                                            content: `<:no:833101993668771842> ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                            ephemeral: true,
                                        });
                                });
                                //Once the Collections ended edit the menu message
                                collector.on("end", collected => {
                                    menumsg.edit({
                                        embeds: [EmbedBuilder.from(menumsg.embeds[0]).setDescription(`~~${menumsg.embeds[0].description}~~`)],
                                        components: [],
                                        content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : "❌ **NOTHING SELECTED - CANCELLED**"}`,
                                    });
                                });
                            }
                            async function handle_the_picks2(optionhandletype, menuoptiondata) {
                                switch (optionhandletype) {
                                    case "Add a VC":
                                        {
                                            let tempmsg = await message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(`**Which Canal do you wanna add?**`)
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            `Por favor Ping the **VOICE CHANNEL** now! / Send the **ID** the **Talk**!\nAnd add the **RIKE** in VIA ID / PING afterwards!\n\n**Examples:**\n> \`#VoiceChannel @Rol-For-VoiceChannel\``
                                                        )
                                                        .setFooter(client.getFooter(es)),
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
                                                    var Voicechannel =
                                                        message.mentions.channels
                                                            .filter(
                                                                ch =>
                                                                    ch.guild.id == message.guild.id &&
                                                                    ch.type == ChannelType.GuildVoice
                                                            )
                                                            .first() ||
                                                        message.guild.channels.cache.get(
                                                            message.content.trim().split(" ")[0]
                                                        );
                                                    var Role =
                                                        message.mentions.roles
                                                            .filter(ch => ch.guild.id == message.guild.id)
                                                            .first() ||
                                                        message.guild.roles.cache.get(message.content.trim().split(" ")[1]);
                                                    if (!Voicechannel || !Role)
                                                        return message.reply(
                                                                `${allEmojis.msg.ERROR} **Check the example in the Embed, wrong input type!**`
                                                        );

                                                    if (message.guild.members.me.roles.highest.rawPosition <= Role.rawPosition)
                                                        return message.reply({
                                                            embeds: [
                                                                new EmbedBuilder()
                                                                    .setColor(es.wrongcolor)
                                                                    .setFooter(client.getFooter(es))
                                                                    .setTitle(
                                                                        "I can't give/remove this Rol, because it's higher/equal to my highest Rol"
                                                                    ),
                                                            ],
                                                        });
                                                    try {
                                                        let a = client.joinvc.get(message.guild.id, "vcroles");
                                                        //remove invalid ids
                                                        for (const vc of a) {
                                                            if (!message.guild.channels.cache.get(vc.channelId)) {
                                                                client.joinvc.remove(
                                                                    message.guild.id,
                                                                    d => d.channelId == vc.channelId,
                                                                    "vcroles"
                                                                );
                                                            }
                                                            if (!message.guild.roles.cache.get(vc.roleId)) {
                                                                client.joinvc.remove(
                                                                    message.guild.id,
                                                                    d => d.roleId == vc.roleId,
                                                                    "vcroles"
                                                                );
                                                            }
                                                        }
                                                        a = client.joinvc.get(message.guild.id, "vcroles");
                                                        if (a.map(d => d.channelId).includes(Voicechannel.id))
                                                            return message.reply({
                                                                embeds: [
                                                                    new Discord.EmbedBuilder()
                                                                        .setTitle(
                                                                            `<:no:833101993668771842> This Canal is already Setupped!`
                                                                        )
                                                                        .setDescription(
                                                                            `Remove it first with \`${prefix}setup-joinvc\` --> Then Pick VC ROLES --> Then Pick Remove!`
                                                                        )
                                                                        .setColor(es.color)
                                                                        .setFooter(client.getFooter(es)),
                                                                ],
                                                            });
                                                        client.joinvc.push(
                                                            message.guild.id,
                                                            { channelId: Voicechannel.id, roleId: Role.id },
                                                            "vcroles"
                                                        );
                                                        return message.reply({
                                                            embeds: [
                                                                new Discord.EmbedBuilder()
                                                                    .setTitle(
                                                                        `${allEmojis.msg.SUCCESS} I will now Add the Rol \`${Rol.name}\` when someone joins the VC **${Discord.VoiceChannel.name}**`
                                                                    )
                                                                    .setColor(es.color)
                                                                    .setFooter(client.getFooter(es)),
                                                            ],
                                                        });
                                                    } catch (e) {
                                                        return message.reply({
                                                            embeds: [
                                                                new Discord.EmbedBuilder()
                                                                    .setTitle(
                                                                        eval(
                                                                            client.la[ls]["cmds"]["setup"][
                                                                                "setup-autoembed"
                                                                            ]["variable10"]
                                                                        )
                                                                    )
                                                                    .setColor(es.wrongcolor)
                                                                    .setDescription(
                                                                        eval(
                                                                            client.la[ls]["cmds"]["setup"][
                                                                                "setup-autoembed"
                                                                            ]["variable11"]
                                                                        )
                                                                    )
                                                                    .setFooter(client.getFooter(es)),
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
                                                                    eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                            "variable12"
                                                                        ]
                                                                    )
                                                                )
                                                                .setColor(es.wrongcolor)
                                                                .setDescription(
                                                                    `¡Operación Cancelada!`.substring(0, 2000)
                                                                )
                                                                .setFooter(client.getFooter(es)),
                                                        ],
                                                    });
                                                });
                                        }
                                        break;
                                    case "Remove a VC":
                                        {
                                            let tempmsg = await message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable13"
                                                                ]
                                                            )
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable14"
                                                                ]
                                                            )
                                                        )
                                                        .setFooter(client.getFooter(es)),
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
                                                    var Voicechannel =
                                                        message.mentions.channels
                                                            .filter(
                                                                ch =>
                                                                    ch.guild.id == message.guild.id &&
                                                                    ch.type == ChannelType.GuildVoice
                                                            )
                                                            .first() ||
                                                        message.guild.channels.cache.get(
                                                            message.content.trim().split(" ")[0]
                                                        );
                                                    if (!Voicechannel || Voicechannel.type != ChannelType.GuildVoice)
                                                        return message.reply(
                                                            `${allEmojis.msg.ERROR} **Check the example in the Embed, wrong input type!**`
                                                        );
                                                    try {
                                                        let a = client.joinvc.get(message.guild.id, "vcroles");
                                                        //remove invalid ids
                                                        for (const vc of a) {
                                                            if (!message.guild.channels.cache.get(vc.channelId)) {
                                                                client.joinvc.remove(
                                                                    message.guild.id,
                                                                    d => d.channelId == vc.channelId,
                                                                    "vcroles"
                                                                );
                                                            }
                                                            if (!message.guild.roles.cache.get(vc.roleId)) {
                                                                client.joinvc.remove(
                                                                    message.guild.id,
                                                                    d => d.roleId == vc.roleId,
                                                                    "vcroles"
                                                                );
                                                            }
                                                        }
                                                        a = client.joinvc.get(message.guild.id, "vcroles");
                                                        if (!a.map(d => d.channelId).includes(Voicechannel.id))
                                                            return message.reply({
                                                                embeds: [
                                                                    new Discord.EmbedBuilder()
                                                                        .setTitle(
                                                                            `<:no:833101993668771842> This Canal has not been Configuración yet!`
                                                                        )
                                                                        .setColor(es.color)
                                                                        .setFooter(client.getFooter(es)),
                                                                ],
                                                            });
                                                        client.joinvc.remove(
                                                            message.guild.id,
                                                            d => d.channelId == Voicechannel.id,
                                                            "vcroles"
                                                        );
                                                        return message.reply({
                                                            embeds: [
                                                                new Discord.EmbedBuilder()
                                                                    .setTitle(
                                                                        `${allEmojis.msg.SUCCESS} Successfully removed **${Voicechannel.name}** out of the Configuración!`
                                                                    )
                                                                    .setColor(es.color)
                                                                    .setFooter(client.getFooter(es)),
                                                            ],
                                                        });
                                                    } catch (e) {
                                                        return message.reply({
                                                            embeds: [
                                                                new Discord.EmbedBuilder()
                                                                    .setTitle(
                                                                        eval(
                                                                            client.la[ls]["cmds"]["setup"][
                                                                                "setup-autoembed"
                                                                            ]["variable18"]
                                                                        )
                                                                    )
                                                                    .setColor(es.wrongcolor)
                                                                    .setDescription(
                                                                        eval(
                                                                            client.la[ls]["cmds"]["setup"][
                                                                                "setup-autoembed"
                                                                            ]["variable19"]
                                                                        )
                                                                    )
                                                                    .setFooter(client.getFooter(es)),
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
                                                                    eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                            "variable12"
                                                                        ]
                                                                    )
                                                                )
                                                                .setColor(es.wrongcolor)
                                                                .setDescription(
                                                                    `¡Operación Cancelada!`.substring(0, 2000)
                                                                )
                                                                .setFooter(client.getFooter(es)),
                                                        ],
                                                    });
                                                });
                                        }
                                        break;
                                    case "Show all VCS":
                                        {
                                            let a = client.joinvc.get(message.guild.id, "vcroles");
                                            //remove invalid ids
                                            for (const vc of a) {
                                                if (!message.guild.channels.cache.get(vc.channelId)) {
                                                    client.joinvc.remove(
                                                        message.guild.id,
                                                        d => d.channelId == vc.channelId,
                                                        "vcroles"
                                                    );
                                                }
                                                if (!message.guild.roles.cache.get(vc.roleId)) {
                                                    client.joinvc.remove(
                                                        message.guild.id,
                                                        d => d.roleId == vc.roleId,
                                                        "vcroles"
                                                    );
                                                }
                                            }
                                            a = client.joinvc.get(message.guild.id, "vcroles");

                                            message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(`📑 Ajustes of the Join Vc-Rol System`)
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            `**VCS Where I add a Rol:**\n${a.map(d => `<#${d.channelId}> [Rol: <@&${d.roleId}>]`).join("\n")}`.substring(
                                                                0,
                                                                2000
                                                            )
                                                        )
                                                        .setFooter(client.getFooter(es)),
                                                ],
                                            });
                                        }
                                        break;
                                }
                            }
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
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable26"])),
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
