const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { databasing, duration } = require(`${process.cwd()}/handlers/functions`);
const ms = require("ms");
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-antinewaccount",
    category: "Setup",
    aliases: [
        "setupnewaccount",
        "newaccount-setup",
        "newaccountsetup",
        "setupantinewaccount",
        "antinewaccount-setup",
        "antinewaccountsetup",
        "setup-newaccount",
    ],
    cooldown: 5,
    usage: "setup-antinewaccount --> Sigue los Pasos",
    description: "Configura un sistema que bloquea cuentas demasiado nuevas!",
    memberpermissions: ['Administrador'],
    type: "security",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            client.settings.ensure(message.guild.id, {
                antinewaccount: {
                    enabled: false,
                    delay: ms("2 days"),
                    action: "kick", // kick / ban
                    extra_message: "Please do not join back, unless you meet the requirements!",
                },
            });

            const settings = client.settings.get(message.guild.id, "antinewaccount");
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: !settings.enabled ? "Enable Anti New Account" : "Disable Anti New Account",
                        description: !settings.enabled
                            ? "Detect New Accounts and kick / Ban them"
                            : "Don't Detect New Accounts",
                        emoji: obeyUi.component(!settings.enabled ? allEmojis.msg.SUCCESS : allEmojis.msg.ERROR),
                    },
                    {
                        value: "Set Extra Message",
                        description: `Define an extra Mensaje, sent to their DM`,
                        emoji: obeyUi.component("💬"),
                    },
                    {
                        value: "Select the Action",
                        description: `Seleccionar the right Action kick/ban`,
                        emoji: obeyUi.component("🔨"),
                    },
                    {
                        value: "Set the Duration",
                        description: `Define the Minimum Account Age`,
                        emoji: obeyUi.component("🕒"),
                    },
                    {
                        value: "Show Settings",
                        description: `Show Ajustes of the Anti-New-Account`,
                        emoji: obeyUi.component(allEmojis.msg.list),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Anti-New-Account-Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Anti-New-Account"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Anti-New-Account", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/310/hammer_1f528.png", url: "https://github.com/melodiabl" }))
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

            async function handle_the_picks(optionhandletype, SetupNumber, menuoptiondata) {
                switch (optionhandletype) {
                    case !settings.enabled ? "Enable Anti New Account" : "Disable Anti New Account":
                        {
                            client.settings.set(message.guild.id, !settings.enabled, `antinewaccount.enabled`);
                            let thesettings = client.settings.get(message.guild.id, `antinewaccount`);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(
                                            obeyUi.limit(`${thesettings ? `Activado New Account Detection` : `Desactivado New Account Detection`}`, 256)
                                        )
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`${
                                                thesettings
                                                    ? `I will now kick New Accounts if they were created before ${duration(
                                                          thesettings.delay
                                                      )
                                                          .map(i => `\`${i}\``)
                                                          .join(", ")} ago!`
                                                    : `I will now no longer kick new Accounts!`
                                            }`.substring(0, 2048), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;
                    case "Set Extra Message":
                        {
                            let extramessage = settings.extra_message;
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(`What should be the new Extra Mensaje?`, 256))
                                        .setColor(es.color)
                                        .addFields({ name: `**Current Extra-Message:**`, value: `${extramessage && extramessage.length > 1 ? extramessage : "No Extra Message provided"}`.substring(
                                                0,
                                                1024
                                            ) })
                                        .setDescription(obeyUi.limit(`Send it now!`, 4096))
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
                                    if (message.content) {
                                        extramessage = message.content.slice(0, 1024);
                                        client.settings.set(message.guild.id, extramessage, `antinewaccount.extra_message`);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(obeyUi.limit(`Defined the New Extra Mensaje!`, 256))
                                                    .setColor(es.color)
                                                    .addFields({ name: `**New Extra-Message:**`, value: `${extramessage && extramessage.length > 1 ? extramessage : "No Extra Message provided"}`.substring(
                                                            0,
                                                            1024
                                                        ) })
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    return message.reply("No Mensaje Content Añadido");
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(`Something went wrong`, 256))
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
                            let thesettings = client.settings.get(message.guild.id, `antinewaccount`);
                            const extramessage = thesettings.extra_message;
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(`Ajustes of the New Account Detection Configuración`, 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`**Activado:**\n> ${thesettings.enabled ? obeyUi.owned("✅") : obeyUi.owned("❌")}\n\n**Minimum Account Age:**\n> ${duration(
                                                thesettings.delay
                                            )
                                                .map(i => `\`${i}\``)
                                                .join(", ")}\n\n**Action:**\n> ${thesettings.action}`.substring(0, 2048), 4096)
                                        )
                                        .addFields({ name: `**Current Extra-Message:**`, value: `${extramessage && extramessage.length > 1 ? extramessage : "No Extra Message provided"}`.substring(
                                                0,
                                                1024
                                            ) })
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                        break;

                    case "Select the Action":
                        {
                            let menuoptions = [
                                {
                                    value: "Kick",
                                    description: `Kick new Members`,
                                    emoji: obeyUi.component(allEmojis.msg.SUCCESS),
                                },
                                {
                                    value: "Ban",
                                    description: `Ban new Members`,
                                    emoji: obeyUi.component("🔨"),
                                },
                                {
                                    value: "Cancel",
                                    description: `Cancelar and stop the Anti-New-Account-Configuración!`,
                                    emoji: obeyUi.component(allEmojis.msg.cancel),
                                },
                            ];
                            //define the selection
                            let Selection = new StringSelectMenuBuilder()
                                .setCustomId("MenuSelection")
                                .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                                .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                .setPlaceholder(obeyUi.plain("Click me to select the Action Type"))
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
                            let MenuEmbed = new EmbedBuilder()
                                .setColor(es.color)
                                .setAuthor(obeyMeta.asAuthor({ name: "Anti-New-Account", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/310/hammer_1f528.png", url: "https://github.com/melodiabl" }))
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
                                        return menu?.reply(
                                            eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"])
                                        );
                                    menu?.deferUpdate();
                                    client.settings.set(message.guild.id, menu?.values[0], `antinewaccount.action`);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(`Successfully set the new Action to: ${menu?.values[0]}`, 256))
                                                .setColor(es.color)
                                                .setDescription(
                                                    obeyUi.limit(`I will now ${menu?.values[0]} new Members, which Account are too young!`.substring(
                                                        0,
                                                        2048
                                                    ), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                }
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
                        break;
                    case "Set the Duration": {
                        let extramessage = settings.extra_message;
                        var tempmsg = await message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(obeyUi.limit(`What should be the new Minimum Account Age?`, 256))
                                    .setColor(es.color)
                                    .addFields({ name: `**Current Minimum Account Age:**`, value: `${duration(settings.delay)
                                            .map(i => `\`${i}\``)
                                            .join(", ")}`.substring(0, 1024) })
                                    .setDescription(obeyUi.limit(`Send it now!\nExample: \`2 Days\`, \`6 hours + 2 Days\``, 4096))
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
                                if (message.content) {
                                    let gargs = message.content.split("+");
                                    let time = 0;
                                    for (const a of gargs) {
                                        time += ms(a.split(" ").join(""));
                                    }
                                    if (!time || isNaN(time)) return message.reply("You added a not valid Time!");

                                    client.settings.set(message.guild.id, time, `antinewaccount.delay`);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(`Defined the New Minimum Account Duración!`, 256))
                                                .setColor(es.color)
                                                .addFields({ name: `**New Minimum Account Age:**`, value: `${duration(time)
                                                        .map(i => `\`${i}\``)
                                                        .join(", ")}`.substring(0, 1024) })
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                }
                                return message.reply("No Mensaje Content and so no Time Añadido");
                            })
                            .catch(e => {
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(obeyUi.limit(`Something went wrong`, 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                            });
                    }
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
                        .setDescription(obeyUi.limit(`\`\`\`${String(e.message ? e.message : e).substring(0, 2000)}\`\`\``, 4096)),
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
