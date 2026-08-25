var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-ghost-ping-detector",
    category: "💪 Setup",
    aliases: [
        "setupghost-ping-detector",
        "ghost-ping-detector-setup",
        "ghost-ping-detectorsetup",
        "setup-ghost-ping",
        "setup-ghostping",
    ],
    cooldown: 5,
    usage: "setup-ghost-ping-detector  -->  Follow Steps",
    description: "Activar/Desactivar el detector de ghost-ping / Ghost-Ping-Detector - Registro",
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
                        value: "Enable Detector-Log",
                        description: `Define the Ghost-Ping-Detector-Log Canal`,
                        emoji: allEmojis.msg.SUCCESS,
                    },
                    {
                        value: "Disable Detector-Log",
                        description: `Disable the Ghost-Ping-Detector-Log`,
                        emoji: allEmojis.msg.ERROR,
                    },
                    {
                        value: "Show Settings",
                        description: `Show Ajustes of the Ghost-Ping-Detector-Log`,
                        emoji: allEmojis.msg.list,
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Detector-Log-Configuración!`,
                        emoji: allEmojis.msg.cancel,
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder("¡Haz clic para configurar the Detector-Command-Log")
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
                    .setAuthor({ name: "Ghost-Ping-Detector Setup", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/bookmark_1f516.png", url: "https://github.com/melodiabl" })
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
                            return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"]));
                        menu?.deferUpdate();
                        let SetupNumber = menu?.values[0].split(" ")[0];
                        handle_the_picks(menu?.values[0], SetupNumber, menuoptiondata);
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

            async function handle_the_picks(optionhandletype, SetupNumber, menuoptiondata) {
                switch (optionhandletype) {
                    case "Enable Detector-Log":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-logger"]["variable5"]))
                                        .setColor(es.color)
                                        .setDescription(
                                            eval(client.la[ls]["cmds"]["setup"]["setup-logger"]["variable6"]) +
                                                `\n\nIf you want to change the maxmimum Time, until a Ping is detected as a ghost ping, then do something like this: \`#channel 30\` ... send logs in #channel, detect ghost-pings of deletions in under 30 Seconds`
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
                                            client.settings.set(message.guild.id, channel.id, "ghost_ping_detector");
                                            let maxtime = message.content.split(">")[1];
                                            let isnan = false;
                                            if (maxtime && maxtime.length > 0) {
                                                maxtime = maxtime.trim();
                                                if (isNaN(maxtime)) {
                                                    isnan = true;
                                                    maxtime = 10000;
                                                } else {
                                                    maxtime = Number(maxtime) * 1000;
                                                }
                                            } else {
                                                maxtime = 10000;
                                            }
                                            client.settings.set(message.guild.id, maxtime, "ghost_ping_detector_max_time");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            `${allEmojis.msg.SUCCESS} I will now send all detected Ghost Pings in \`${channel.name}\``
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            `${!isnan ? `And set the Ghost-Ping-Detected-Deletion Mensaje Maximum Time to \`${maxtime / 1000} Seconds\`` : "You added an invalid time, so i set the Ghost-Ping-Detection Maximum Time to `10 Seconds`"}`
                                                        )
                                                        .setFooter(client.getFooter(es)),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            eval(client.la[ls]["cmds"]["setup"]["setup-logger"]["variable8"])
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            eval(client.la[ls]["cmds"]["setup"]["setup-logger"]["variable9"])
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
                                                    eval(client.la[ls]["cmds"]["setup"]["setup-admincmdlog"]["variable7"])
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Disable Detector-Log":
                        {
                            client.settings.set(message.guild.id, false, "ghost_ping_detector");
                            client.settings.set(message.guild.id, 10000, "ghost_ping_detector_max_time");
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(`Successfully disabled the Ghost-Ping-Detector System & Log`)
                                        .setColor(es.color)
                                        .setFooter(client.getFooter(es)),
                                ],
                            });
                        }
                        break;
                    case "Show Settings":
                        {
                            let ghost_ping_detector = client.settings.get(message.guild.id, `ghost_ping_detector`);
                            let ghost_ping_detector_max_time = client.settings.get(
                                message.guild.id,
                                `ghost_ping_detector_max_time`
                            );
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle("Ajustes of the Ghost-Ping-Detector-Log")
                                        .setColor(es.color)
                                        .setDescription(
                                            `**Canal:** ${ghost_ping_detector == false ? "Not Setupped" : `<#${ghost_ping_detector}> | \`${ghost_ping_detector}\``}\n\n**Max-Time-For-Detection:** \`${Math.floor(ghost_ping_detector_max_time / 1000)} Seconds\``.substring(
                                                0,
                                                2048
                                            )
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
                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-logger"]["variable15"])),
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
