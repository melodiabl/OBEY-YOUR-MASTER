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
    name: "setup-boostlog",
    category: "Setup",
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
                        obeyUi.owned("<a:Server_Boosts:867777823468027924> {member} **dejó de impulsarnos..** <:Cat_Sad:867722685949804565>"),
                    startBoost:
                        obeyUi.owned("<a:Server_Boosts:867777823468027924> {member} **nos ha impulsado!** <a:Light_Saber_Dancce:867721861462229013>"),
                    againBoost:
                        obeyUi.owned("<a:Server_Boosts:867777823468027924> {member} **nos ha impulsado de nuevo!** <:Tada_WON:867724032207224833>"),
                },
            });

            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Enable Boost-Log",
                        description: `Activar Boost-Log y definir el Canal`,
                        emoji: obeyUi.component(allEmojis.msg.SUCCESS),
                    },
                    {
                        value: "Disable Boost-Log",
                        description: `Desactivar el Boost-Log`,
                        emoji: obeyUi.component(allEmojis.msg.cleared),
                    },
                    {
                        value: "Start Boost Message",
                        description: `Definir el Mensaje de Inicio de Impulso`,
                        emoji: obeyUi.component("🚀"),
                    },
                    {
                        value: "Stop Boost Message",
                        description: `Definir el Mensaje de Impulso Detenido`,
                        emoji: obeyUi.component("🚀"),
                    },
                    {
                        value: "Again Boost Message",
                        description: `Definir el Mensaje de Otro Impulso`,
                        emoji: obeyUi.component("🚀"),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar y detener la Ai-Chat-Configuración`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar el Boost-Log!"))
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
                    .setAuthor(obeyMeta.asAuthor({
                        name: "Registro de Impulso",
                        url: "https://github.com/melodiabl",
                        iconURL: obeyUi.image("icon.boost"),
                    }))
                    //.setAuthor('Boost-Log', 'https://cdn.discordapp.com/emojis/833402717950836806.gif?size=128&quality=lossless', 'https://github.com/melodiabl')
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
                        content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Seleccionado: \`${collected ? collected.first().values[0] : "Nada"}\`**` : obeyUi.owned("❌ **NADA SELECCIONADO - CANCELADO**")}`,
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
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable5"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable6"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                                    .setTitle(obeyUi.limit("¡Boost Log Activado!", 256))
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`Cuando alguien comience/detenga el impulso, enviaré información de registro en: <#${channel.id}>`.substring(
                                                            0,
                                                            2048
                                                        ), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    return message.reply("NO SE MENCIONÓ NINGÚN CANAL");
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable8"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                        .setTitle(obeyUi.limit("¿Cuál debería ser el mensaje cuando alguien comienza a Impulsar?", 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`\`{member}\` será reemplazado con una mención del miembro que impulsa!\n**Mensaje Actual:**\n> ${client.settings.get(message.guild.id, "boost.startBoost")}`.substring(
                                                0,
                                                2048
                                            ), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                                .setTitle(obeyUi.limit("¡Mensaje de Registro de Inicio de Impulso Cambiado!", 256))
                                                .setColor(es.color)
                                                .setDescription(
                                                    obeyUi.limit(`${log ? `Cuando alguien comience a impulsar, lo enviaré en: <#${log}>` : `Cuando alguien comience a impulsar, lo enviaré tan pronto como habilites este registro!`}`.substring(
                                                        0,
                                                        2048
                                                    ), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable8"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                        .setTitle(obeyUi.limit("¿Cuál debería ser el mensaje cuando alguien deja de Impulsar?", 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`\`{member}\` será reemplazado con una mención del miembro que impulsa!\n**Mensaje Actual:**\n> ${client.settings.get(message.guild.id, "boost.stopBoost")}`.substring(
                                                0,
                                                2048
                                            ), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                                .setTitle(obeyUi.limit("¡Mensaje de Registro de Detención de Impulso Cambiado!", 256))
                                                .setColor(es.color)
                                                .setDescription(
                                                    obeyUi.limit(`${log ? `Cuando alguien deje de impulsar, lo enviaré en: <#${log}>` : `Cuando alguien deje de impulsar, lo enviaré tan pronto como habilites este registro!`}`.substring(
                                                        0,
                                                        2048
                                                    ), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable8"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                        .setTitle(obeyUi.limit("¿Cuál debería ser el mensaje cuando alguien impulsa de nuevo?", 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`\`{member}\` será reemplazado con una mención del miembro que impulsa!\n**Mensaje Actual:**\n> ${client.settings.get(message.guild.id, "boost.againBoost")}`.substring(
                                                0,
                                                2048
                                            ), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                                .setTitle(obeyUi.limit("¡Mensaje de Registro de Otro Impulso Cambiado!", 256))
                                                .setColor(es.color)
                                                .setDescription(
                                                    obeyUi.limit(`${log ? `Cuando alguien impulse de nuevo, lo enviaré en: <#${log}>` : `Cuando alguien impulse de nuevo, lo enviaré tan pronto como habilites este registro!`}`.substring(
                                                        0,
                                                        2048
                                                    ), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-aichat"]["variable8"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                        .setTitle(obeyUi.limit("¡Boost Log Desactivado!", 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(`Ya no mostraré el Registro de Impulso`.substring(0, 2048), 4096))
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
