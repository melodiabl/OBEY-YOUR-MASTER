const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { duration } = require(`${process.cwd()}/handlers/functions`);
const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { getNumberEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-autodelete",
    category: "Setup",
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
                        emoji: obeyUi.component(NumberEmojis[1]),
                    },
                    {
                        value: "Remove a Channel",
                        description: `Remove a Canal from the Configuración`,
                        emoji: obeyUi.component(NumberEmojis[2]),
                    },
                    {
                        value: "Show all Channels",
                        description: `Show all setup Channels!`,
                        emoji: obeyUi.component("📑"),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Auto Delete System!"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Auto Delete Setup", iconURL: obeyUi.image("icon.delete"), url: "https://github.com/melodiabl" }))
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
                                        .setTitle(obeyUi.limit(`**Which Canal do you wanna add?**`, 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`Por favor Ping the **Canal** now! / Send the **ID** the **Canal/Category/Talk**!\nAnd add the **Duración** in **Seconds** afterwards!\n\n**Example:**\n> \`#Canal 30\``, 4096)
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
                                                                obeyUi.limit(`${obeyUi.markup("icon.error")} This Canal is already Setupped!`, 256)
                                                            )
                                                            .setDescription(
                                                                obeyUi.limit(`Remove it first with \`${prefix}setup-autodelete\` --> Then Pick Remove!`, 4096)
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            var args = message.content.split(" ");
                                            var time = Number(args[1]);
                                            if (!time || isNaN(time))
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(obeyUi.limit(`${obeyUi.markup("icon.error")} No válido Input | Time wrong`, 256))
                                                            .setDescription(
                                                                obeyUi.limit(`You probably forgot / didn't add a Time!\nTry this: \`${channel.id} 30\``, 4096)
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            if (time > 60 * 60 || time < 3)
                                                return message.reply({
                                                    embeds: [
                                                        new Discord.EmbedBuilder()
                                                            .setTitle(obeyUi.limit(`${obeyUi.markup("icon.error")} Time out of Range!`, 256))
                                                            .setDescription(
                                                                obeyUi.limit(`The longest Amount is 1 hour aka 3600 Seconds and the Time must be at least 3 Seconds long!`, 4096)
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                                            obeyUi.limit(`${allEmojis.msg.SUCCESS} I will now delete Messages after \`${time} Seconds\` in **${channel.name}**`, 256)
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
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable10"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable11"
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
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable12"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable13"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable14"]), 4096)
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
                                                                obeyUi.limit(`${obeyUi.markup("icon.error")} This Canal has not been Configuración yet!`, 256)
                                                            )
                                                            .setColor(es.color)
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                    ],
                                                });
                                            client.setups.remove(message.guild.id, d => d.id == channel.id, "autodelete");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(`${allEmojis.msg.SUCCESS} Successfully removed **${channel.name}** out of the Configuración!`, 256)
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
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable18"
                                                                ]
                                                            ), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-autoembed"][
                                                                    "variable19"
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
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable12"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                        .setTitle(obeyUi.limit(`${obeyUi.markup("icon.queue")} Ajustes of the Auto Deletion System`, 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`**Channels where Messages will automatically be deleted:**\n${a.map(d => `<#${d.id}> [After: ${duration(d.delay).join(", ")}]`)}`, 4096)
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-autoembed"]["variable26"]), 4096)),
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
