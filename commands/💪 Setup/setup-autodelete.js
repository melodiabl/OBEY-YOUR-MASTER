var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { duration } = require(`${process.cwd()}/handlers/functions`);
const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { getNumberEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-autodelete",
    category: "💪 Setup",
    aliases: ["setupautodelete", "autodelete-setup"],
    cooldown: 5,
    usage: "setup-autodelete --> Sigue los Pasos",
    description: "Define un Canal donde cada mensaje se reemplaza con un EMBED o desactiva esta función",
    memberpermissions: ['Administrador'],
    type: "system",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            const NumberEmojis = getNumberEmojis();
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Add a Channel",
                        description: `Add a auto delete Messages-Canal`,
                        emoji: NumberEmojis[1],
                    },
                    {
                        value: "Remove a Channel",
                        description: `Remove a Canal from the Configuración`,
                        emoji: NumberEmojis[2],
                    },
                    {
                        value: "Show all Channels",
                        description: `Show all setup Channels!`,
                        emoji: "📑",
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder("¡Haz clic para configurar the Auto Delete System!")
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
                    .setAuthor({ name: "Auto Delete Setup", iconURL: "https://cdn.discordapp.com/emojis/834052497492410388.gif?size=96", url: "https://github.com/melodiabl" })
                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]));
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
                client.setups.ensure(message.guild.id, {
                    autodelete: [
                        /*{ id: "840330596567089173", delay: 15000 }*/
                    ],
                });
                switch (optionhandletype) {
                    case "Add a Channel":
                        {
                            let tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(`**Which Canal do you wanna add?**`)
                                        .setColor(es.color)
                                        .setDescription(
                                            `Por favor Ping the **Canal** now! / Send the **ID** the **Canal/Category/Talk**!\nAnd add the **Duración** in **Seconds** afterwards!\n\n**Example:**\n> \`#Canal 30\``
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
                                    var channel =
                                        message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first() ||
                                        message.guild.channels.cache.get(message.content.trim().split(" ")[0]);
                                    if (channel) {
                                        try {
                                            var a = client.setups.get(message.guild.id, "autodelete");
                                            //remove invalid ids
                                            for (const id of a) {
                                                if (!message.guild.channels.cache.get(id.id)) {
                                                    client.setups.remove(message.guild.id, d => d.id == id.id, "autodelete");
                                                }
                                            }
                                            a = client.setups.get(message.guild.id, "autodelete");
                                            if (a.map(d => d.id).includes(channel.id))
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(
                                                                `<:no:833101993668771842> This Canal is already Setupped!`
                                                            )
                                                            .setDescription(
                                                                `Remove it first with \`${prefix}setup-autodelete\` --> Then Pick Remove!`
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(client.getFooter(es)),
                                                    ],
                                                });
                                            var args = message.content.split(" ");
                                            var time = Number(args[1]);
                                            if (!time || isNaN(time))
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(`<:no:833101993668771842> No válido Input | Time wrong`)
                                                            .setDescription(
                                                                `You probably forgot / didn't add a Time!\nTry this: \`${channel.id} 30\``
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(client.getFooter(es)),
                                                    ],
                                                });
                                            if (time > 60 * 60 || time < 3)
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(`<:no:833101993668771842> Time out of Range!`)
                                                            .setDescription(
                                                                `The longest Amount is 1 hour aka 3600 Seconds and the Time must be at least 3 Seconds long!`
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(client.getFooter(es)),
                                                    ],
                                                });
                                            client.setups.push(
                                                message.guild.id,
                                                { id: channel.id, delay: time * 1000 },
                                                "autodelete"
                                            );
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            `${allEmojis.msg.SUCCESS} I will now delete Messages after \`${time} Seconds\` in **${channel.name}**`
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
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable10"
                                                                ]
                                                            )
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable11"
                                                                ]
                                                            )
                                                        )
                                                        .setFooter(client.getFooter(es)),
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
                                                .setTitle(
                                                    eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable12"])
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Remove a Channel":
                        {
                            let tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable13"]))
                                        .setColor(es.color)
                                        .setDescription(
                                            eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable14"])
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
                                    var channel =
                                        message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first() ||
                                        message.guild.channels.cache.get(message.content.trim().split(" ")[0]);
                                    if (channel) {
                                        try {
                                            var a = client.setups.get(message.guild.id, "autodelete");
                                            //remove invalid ids
                                            for (const id of a) {
                                                if (!message.guild.channels.cache.get(id.id)) {
                                                    client.setups.remove(message.guild.id, d => d.id == id.id, "autodelete");
                                                }
                                            }
                                            a = client.setups.get(message.guild.id, "autodelete");
                                            if (!a.map(d => d.id).includes(channel.id))
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
                                            client.setups.remove(message.guild.id, d => d.id == channel.id, "autodelete");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            `${allEmojis.msg.SUCCESS} Successfully removed **${channel.name}** out of the Configuración!`
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
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable18"
                                                                ]
                                                            )
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable19"
                                                                ]
                                                            )
                                                        )
                                                        .setFooter(client.getFooter(es)),
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
                                                .setTitle(
                                                    eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable12"])
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Show all Channels":
                        {
                            var a = client.setups.get(message.guild.id, "autodelete");
                            //remove invalid ids
                            for (const id of a) {
                                if (!message.guild.channels.cache.get(id.id)) {
                                    client.setups.remove(message.guild.id, d => d.id == id.id, "autodelete");
                                }
                            }
                            a = client.setups.get(message.guild.id, "autodelete");

                            message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(`📑 Ajustes of the Auto Deletion System`)
                                        .setColor(es.color)
                                        .setDescription(
                                            `**Channels where Messages will automatically be deleted:**\n${a.map(d => `<#${d.id}> [After: ${duration(d.delay).join(", ")}]`)}`
                                        )
                                        .setFooter(client.getFooter(es)),
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
