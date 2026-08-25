var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-boostlog",
    category: "💪 Setup",
    aliases: ["setupboostlog", "boostlogsetup"],
    cooldown: 5,
    usage: "setup-boostlog <#Canal/disable>",
    description: "Registrar los Impulsos del Servidor",
    memberpermissions: ['Administrador'],
    type: "system",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");

        try {
            client.settings.ensure(message.guild.id, {
                boost: {
                    enabled: false,
                    message: "",
                    log: false,
                    stopBoost:
                        "<a:Server_Boosts:867777823468027924> {member} **dejó de impulsarnos..** <:Cat_Sad:867722685949804565>",
                    startBoost:
                        "<a:Server_Boosts:867777823468027924> {member} **nos ha impulsado!** <a:Light_Saber_Dancce:867721861462229013>",
                    againBoost:
                        "<a:Server_Boosts:867777823468027924> {member} **nos ha impulsado de nuevo!** <:Tada_WON:867724032207224833>",
                },
            });

            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Enable Boost-Log",
                        description: `Activar Boost-Log y definir el Canal`,
                        emoji: allEmojis.msg.SUCCESS,
                    },
                    {
                        value: "Disable Boost-Log",
                        description: `Desactivar el Boost-Log`,
                        emoji: allEmojis.msg.cleared,
                    },
                    {
                        value: "Start Boost Message",
                        description: `Definir el Mensaje de Inicio de Impulso`,
                        emoji: "🚀",
                    },
                    {
                        value: "Stop Boost Message",
                        description: `Definir el Mensaje de Impulso Detenido`,
                        emoji: "🚀",
                    },
                    {
                        value: "Again Boost Message",
                        description: `Definir el Mensaje de Otro Impulso`,
                        emoji: "🚀",
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar y detener la Ai-Chat-Configuración`,
                        emoji: allEmojis.msg.cancel,
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder("¡Haz clic para configurar el Boost-Log!")
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
                    .setAuthor({
                        name: "Registro de Impulso",
                        url: "https://github.com/melodiabl",
                        iconURL: "https://cdn.discordapp.com/emojis/833402717950836806.gif?size=128&quality=lossless",
                    })
                    //.setAuthor('Boost-Log', 'https://cdn.discordapp.com/emojis/833402717950836806.gif?size=128&quality=lossless', 'https://github.com/melodiabl')
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
                        content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Seleccionado: \`${collected ? collected.first().values[0] : "Nada"}\`**` : "❌ **NADA SELECCIONADO - CANCELADO**"}`,
                    });
                });
            }

            async function handle_the_picks(optionhandletype, SetupNumber, menuoptiondata) {
                switch (optionhandletype) {
                    case "Enable Boost-Log":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable5"]))
                                        .setColor(es.color)
                                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable6"]))
                                        .setFooter(client.getFooter(es)),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id == message.author.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var message = collected.first();
                                    if (!message) return message.reply("NO SE ENVIÓ NINGÚN MENSAJE");
                                    let channel =
                                        message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first() ||
                                        message.guild.channels.cache.get(message.content.trim().split(" ")[0]);
                                    if (channel) {
                                        client.settings.set(message.guild.id, channel.id, "boost.log");
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle("¡Boost Log Activado!")
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        `Cuando alguien comience/detenga el impulso, enviaré información de registro en: <#${channel.id}>`.substring(
                                                            0,
                                                            2048
                                                        )
                                                    )
                                                    .setFooter(client.getFooter(es)),
                                            ],
                                        });
                                    }
                                    return message.reply("NO SE MENCIONÓ NINGÚN CANAL");
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable8"]))
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Start Boost Message":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle("¿Cuál debería ser el mensaje cuando alguien comienza a Impulsar?")
                                        .setColor(es.color)
                                        .setDescription(
                                            `\`{member}\` será reemplazado con una mención del miembro que impulsa!\n**Mensaje Actual:**\n> ${client.settings.get(message.guild.id, "boost.startBoost")}`.substring(
                                                0,
                                                2048
                                            )
                                        )
                                        .setFooter(client.getFooter(es)),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id == message.author.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var message = collected.first();
                                    if (!message) return message.reply("NO SE ENVIÓ NINGÚN MENSAJE");
                                    client.settings.set(message.guild.id, message, "boost.startBoost");
                                    const log = client.settings.get(message.guild.id, "boost.log");
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle("¡Mensaje de Registro de Inicio de Impulso Cambiado!")
                                                .setColor(es.color)
                                                .setDescription(
                                                    `${log ? `Cuando alguien comience a impulsar, lo enviaré en: <#${log}>` : `Cuando alguien comience a impulsar, lo enviaré tan pronto como habilites este registro!`}`.substring(
                                                        0,
                                                        2048
                                                    )
                                                )
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable8"]))
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Stop Boost Message":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle("¿Cuál debería ser el mensaje cuando alguien deja de Impulsar?")
                                        .setColor(es.color)
                                        .setDescription(
                                            `\`{member}\` será reemplazado con una mención del miembro que impulsa!\n**Mensaje Actual:**\n> ${client.settings.get(message.guild.id, "boost.stopBoost")}`.substring(
                                                0,
                                                2048
                                            )
                                        )
                                        .setFooter(client.getFooter(es)),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id == message.author.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var message = collected.first();
                                    if (!message) return message.reply("NO SE ENVIÓ NINGÚN MENSAJE");
                                    client.settings.set(message.guild.id, message, "boost.stopBoost");
                                    const log = client.settings.get(message.guild.id, "boost.log");
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle("¡Mensaje de Registro de Detención de Impulso Cambiado!")
                                                .setColor(es.color)
                                                .setDescription(
                                                    `${log ? `Cuando alguien deje de impulsar, lo enviaré en: <#${log}>` : `Cuando alguien deje de impulsar, lo enviaré tan pronto como habilites este registro!`}`.substring(
                                                        0,
                                                        2048
                                                    )
                                                )
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable8"]))
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Again Boost Message":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle("¿Cuál debería ser el mensaje cuando alguien impulsa de nuevo?")
                                        .setColor(es.color)
                                        .setDescription(
                                            `\`{member}\` será reemplazado con una mención del miembro que impulsa!\n**Mensaje Actual:**\n> ${client.settings.get(message.guild.id, "boost.againBoost")}`.substring(
                                                0,
                                                2048
                                            )
                                        )
                                        .setFooter(client.getFooter(es)),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id == message.author.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var message = collected.first();
                                    if (!message) return message.reply("NO SE ENVIÓ NINGÚN MENSAJE");
                                    client.settings.set(message.guild.id, message, "boost.againBoost");
                                    const log = client.settings.get(message.guild.id, "boost.log");
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle("¡Mensaje de Registro de Otro Impulso Cambiado!")
                                                .setColor(es.color)
                                                .setDescription(
                                                    `${log ? `Cuando alguien impulse de nuevo, lo enviaré en: <#${log}>` : `Cuando alguien impulse de nuevo, lo enviaré tan pronto como habilites este registro!`}`.substring(
                                                        0,
                                                        2048
                                                    )
                                                )
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable8"]))
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Disable Boost-Log":
                        {
                            client.settings.set(message.guild.id, false, "boost.log");
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle("¡Boost Log Desactivado!")
                                        .setColor(es.color)
                                        .setDescription(`Ya no mostraré el Registro de Impulso`.substring(0, 2048))
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
                        .setDescription(`\`\`\`${String(JSON.stringify(e)).substring(0, 2000)}\`\`\``),
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
