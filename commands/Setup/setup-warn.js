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
    name: "setup-warn",
    category: "Setup",
    aliases: ["setupwarn", "warn-setup", "warnsetup", "warnsystem"],
    cooldown: 5,
    usage: "setup-warn --> Follow Steps",
    description:
        "Adjust the Ajustes for the warn system, like add a Rol per specific warn amount or ban/kick on a specific amount of warn",
    memberpermissions: ['Administrador'],
    type: "security",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        let warnsettings = client.settings.get(message.guild.id, "warnsettings");
        const Mensaje = message;
        const commandUserId = cmduser?.id || cmduser;
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Kick Amount",
                        description: `${warnsettings.kick ? `A User will be kicked if he has ${warnsettings.kick} Warns,change it` : `Define a amount some1 need to have to get kicked`}`,
                        emoji: obeyUi.component(allEmojis.msg.kick),
                    },
                    {
                        value: "Ban Amount",
                        description: `${warnsettings.kick ? `A User will be banned if he has ${warnsettings.ban} Warns,change it` : `Define a amount some1 need to have to get kicked`}`,
                        emoji: obeyUi.component(allEmojis.msg.ban),
                    },
                    {
                        value: "Add Role on Warn",
                        description: `Define a Rol to give, if he has X Warns`,
                        emoji: obeyUi.component(allEmojis.msg.roles),
                    },
                    {
                        value: "Remove Role on Warn",
                        description: `Remove a X Warn Defined Rol`,
                        emoji: obeyUi.component(allEmojis.msg.roles),
                    },
                    {
                        value: "Show Settings",
                        description: `Show the Current Ajustes`,
                        emoji: obeyUi.component(allEmojis.msg.list),
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
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Warn System!"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Warn Setup", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/prohibited_1f6ab?.png", url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable2"]), 4096));
                //send the menu msg
                let menumsg = await message.reply({
                    embeds: [MenuEmbed],
                    components: [new ActionRowBuilder().addComponents(Selection)],
                });
                //function to handle the menuselection
                async function menuselection(menu) {
                    let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                    let menuoptionindex = menuoptions.findIndex(v => v.value == menu?.values[0]);
                    if (menu?.values[0] == "Cancel")
                        return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable3"]));
                    await menu?.deferUpdate();
                    handle_the_picks(menuoptionindex, menuoptiondata);
                }
                const collector = menumsg.createMessageComponentCollector({ time: 180000 });
                collector.on("collect", async menu => {
                    if (!menu?.isStringSelectMenu()) return;
                    if (menu?.user.id !== commandUserId)
                        return menu?.reply({
                            content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${commandUserId}>`,
                            flags: Discord.MessageFlags.Ephemeral,
                        });

                    collector.stop("selected");
                    await menuselection(menu);
                });
                collector.on("end", () => {
                    menumsg.edit({ components: [] }).catch(() => null);
                });
            }

            async function handle_the_picks(menuoptionindex, menuoptiondata) {
                switch (menuoptionindex) {
                    case 0:
                        var msg6 = new EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable4"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable5"]), 4096))
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setColor(es.color);
                        message.reply({ embeds: [msg6] }).then(msg => {
                            msg.channel
                                .awaitMessages({
                                    filter: m => m.author.id === commandUserId,
                                    max: 1,
                                    time: 180000,
                                    errors: ["time"],
                                })
                                .then(collected => {
                                    const amount = collected.first().content;
                                    if (!amount)
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable6"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`Cancelado`.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (amount.toLowerCase() == "no") {
                                        client.settings.set(message.guild.id, false, "warnsettings.kick");
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable7"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    if (isNaN(amount))
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable8"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`You entered: \`${amount}\``.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (Number(amount) <= 0)
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable9"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`You entered: \`${amount}\``.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    client.settings.set(message.guild.id, amount, "warnsettings.kick");
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable10"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                })
                                .catch(error => {
                                    console.log(error);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable11"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        });
                        break;
                    case 1:
                        var msg7 = new EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable12"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable13"]), 4096))
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setColor(es.color);
                        message.reply({ embeds: [msg7] }).then(msg => {
                            msg.channel
                                .awaitMessages({
                                    filter: m => m.author.id === commandUserId,
                                    max: 1,
                                    time: 180000,
                                    errors: ["time"],
                                })
                                .then(collected => {
                                    const amount = collected.first().content;
                                    if (!amount)
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable14"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`Cancelado`.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (amount.toLowerCase() == "no") {
                                        client.settings.set(message.guild.id, false, "warnsettings.ban");
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable15"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    if (isNaN(amount))
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable16"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`You entered: \`${amount}\``.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (Number(amount) <= 0)
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable17"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`You entered: \`${amount}\``.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    client.settings.set(message.guild.id, amount, "warnsettings.ban");
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable18"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                })
                                .catch(error => {
                                    console.log(error);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable19"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        });
                        break;
                    case 2:
                        var msg8 = new EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable20"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable21"]), 4096))
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setColor(es.color);
                        message.reply({ embeds: [msg8] }).then(msg => {
                            msg.channel
                                .awaitMessages({
                                    filter: m => m.author.id === commandUserId,
                                    max: 1,
                                    time: 180000,
                                    errors: ["time"],
                                })
                                .then(collected => {
                                    let colargs = collected.first().content?.trim().split(" ");
                                    let amount = colargs[0];
                                    let role = collected
                                        .first()
                                        .mentions.roles.filter(r => r.guild.id == message.guild.id)
                                        .first();
                                    const Rol = role;
                                    if (!role || !role.id)
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable22"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`Cancelado`.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (!amount)
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable23"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`Cancelado`.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (isNaN(amount))
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable24"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`You entered: \`${amount}\``.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (Number(amount) <= 0)
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable25"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`You entered: \`${amount}\``.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });

                                    if (warnsettings.roles.some(r => r?.warncount == amount))
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable26"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(
                                                        obeyUi.limit(`You can't add 2 Roles at the Same time`.substring(0, 2000), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    client.settings.push(
                                        message.guild.id,
                                        { warncount: Number(amount), roleid: role.id },
                                        "warnsettings.roles"
                                    );
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable27"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                })
                                .catch(error => {
                                    console.log(error);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable28"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        });
                        break;
                    case 3:
                        var msg8 = new EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable29"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable30"]), 4096))
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setColor(es.color);
                        message.reply({ embeds: [msg8] }).then(msg => {
                            msg.channel
                                .awaitMessages({
                                    filter: m => m.author.id === commandUserId,
                                    max: 1,
                                    time: 180000,
                                    errors: ["time"],
                                })
                                .then(collected => {
                                    let colargs = collected.first().content?.trim().split(" ");
                                    let amount = colargs[0];
                                    if (!amount)
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable31"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`Cancelado`.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (isNaN(amount))
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable32"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`You entered: \`${amount}\``.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (Number(amount) <= 0)
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable33"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`You entered: \`${amount}\``.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });

                                    if (!warnsettings.roles.some(r => r?.warncount == amount))
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable34"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(
                                                        obeyUi.limit(`You can't remove a Setting which does not exist`.substring(0, 2000), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    let yeee = warnsettings.roles.filter(r => r?.warncount == amount)[0];
                                    client.settings.remove(
                                        message.guild.id,
                                        v => v?.warncount == yeee.warncount,
                                        "warnsettings.roles"
                                    );
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable35"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                })
                                .catch(error => {
                                    console.log(error);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable36"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        });
                        break;
                    case 4:
                        var rembed = new EmbedBuilder()
                            .setColor(es.color)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable37"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable38"]), 4096));
                        message.reply({ embeds: [rembed] }).catch(error => {
                            console.log(error);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable39"]), 256))
                                        .setColor(es.wrongcolor)
                                        .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                        break;
                    default:
                        message.reply(
                            String(
                                "SORRY, that Number does not exists :(\n Your Input:\n> " + collected.first().content
                            ).substring(0, 1999)
                        );
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable40"]), 4096)),
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
