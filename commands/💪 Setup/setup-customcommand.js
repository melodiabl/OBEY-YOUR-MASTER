var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing, edit_msg, send_roster } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { getNumberEmojis, allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-customcommand",
    category: "💪 Setup",
    aliases: ["setupcustomcommand", "setupcustomcommands", "customcommand-setup", "setup-customcommands"],
    cooldown: 5,
    usage: "setup-customcommand --> Sigue los Pasos",
    description:
        'Define Personalizado Commands, Create Personalizado Commands and Remove Personalizado Commands --> "Custom Command Names, that sends Custom Messages"',
    memberpermissions: ['Administrador'],
    type: "system",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            var originalowner = message.author.id;
            let timeouterror;
            const NumberEmojis = getNumberEmojis();
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Create Custom Command",
                        description: `Create a Personalizado Comando of your Choice`,
                        emoji: "✅",
                    },
                    {
                        value: "Delete Custom Command",
                        description: `Delete one of the Personalizado Comando(s)`,
                        emoji: "❌",
                    },
                    {
                        value: "Show Settings",
                        description: `Show the all Personalizado Commands!`,
                        emoji: "📑",
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder("¡Haz clic para configurar the Automated Embed System!")
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
                    .setAuthor({ name: "Custom Command Setup", iconURL: "https://images-ext-1.discordapp.net/external/HF-XNy3iUP4D95zv2fuTUy1csYWuNa5IZj2HSCSkvhs/https/emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/google/298/flexed-biceps_1f4aa.png", url: "https://github.com/melodiabl" })
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
                switch (
                    optionhandletype // return message.reply
                ) {
                    case "Create Custom Command":
                        {
                            if (client.customcommands.get(message.guild.id, "commands").length > 24)
                                return message.reply({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle(
                                                eval(client.la[ls]["cmds"]["setup"]["setup-customcommand"]["variable5"])
                                            )
                                            .setColor(es.wrongcolor)
                                            .setDescription(
                                                `You cannot have more then **25** Personalizado Commands`.substring(0, 2000)
                                            )
                                            .setFooter(client.getFooter(es)),
                                    ],
                                });
                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-customcommand"]["variable6"]))
                                        .setColor(es.color)
                                        .setDescription(
                                            eval(client.la[ls]["cmds"]["setup"]["setup-customcommand"]["variable7"])
                                        )
                                        .setFooter(client.getFooter(es)),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id === message.author.id,
                                    max: 1,
                                    time: 120000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var msg = collected.first().content.split(" ")[0];
                                    if (msg) {
                                        var thecustomcommand = {
                                            name: msg,
                                            output: "ye",
                                            embeds: false,
                                        };
                                        tempmsg = await message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        eval(
                                                            client.la[ls]["cmds"]["setup"]["setup-customcommand"][
                                                                "variable8"
                                                            ]
                                                        )
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        eval(
                                                            client.la[ls]["cmds"]["setup"]["setup-customcommand"][
                                                                "variable9"
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
                                                time: 120000,
                                                errors: ["time"],
                                            })
                                            .then(async collected => {
                                                var msg = collected.first().content;
                                                if (msg) {
                                                    thecustomcommand.output = msg;
                                                    var ttempmsg = await message.reply({
                                                        embeds: [
                                                            new Discord.EmbedBuilder()
                                                                .setTitle(
                                                                    eval(
                                                                        client.la[ls]["cmds"]["setup"][
                                                                            "setup-customcommand"
                                                                        ]["variable10"]
                                                                    )
                                                                )
                                                                .setColor(es.color)
                                                                .setDescription(
                                                                    eval(
                                                                        client.la[ls]["cmds"]["setup"][
                                                                            "setup-customcommand"
                                                                        ]["variable11"]
                                                                    )
                                                                )
                                                                .setFooter(client.getFooter(es)),
                                                        ],
                                                    });
                                                    try {
                                                        ttempmsg.react("✅");
                                                        ttempmsg.react("❌");
                                                    } catch {}
                                                    await ttempmsg
                                                        .awaitReactions({
                                                            filter: (reaction, user) => user == originalowner,
                                                            max: 1,
                                                            time: 90000,
                                                            errors: ["time"],
                                                        })
                                                        .then(collected => {
                                                            var reaction = collected.first();
                                                            if (reaction) {
                                                                if (reaction.emoji?.name == "✅") {
                                                                    thecustomcommand.embed = true;
                                                                } else {
                                                                    thecustomcommand.embed = false;
                                                                }
                                                                client.customcommands.push(
                                                                    message.guild.id,
                                                                    thecustomcommand,
                                                                    "commands"
                                                                );

                                                                message.reply({
                                                                    embeds: [
                                                                        new Discord.EmbedBuilder()
                                                                            .setTitle(
                                                                                eval(
                                                                                    client.la[ls]["cmds"]["setup"][
                                                                                        "setup-customcommand"
                                                                                    ]["variable12"]
                                                                                )
                                                                            )
                                                                            .setColor(es.color)
                                                                            .setDescription(
                                                                                eval(
                                                                                    client.la[ls]["cmds"]["setup"][
                                                                                        "setup-customcommand"
                                                                                    ]["variable13"]
                                                                                )
                                                                            )
                                                                            .setFooter(client.getFooter(es)),
                                                                    ],
                                                                });

                                                                if (reaction.emoji?.name == "✅") {
                                                                    message.reply({
                                                                        embeds: [
                                                                            new Discord.EmbedBuilder()
                                                                                .setColor(es.color)
                                                                                .setDescription(thecustomcommand.output)
                                                                                .setFooter(client.getFooter(es)),
                                                                        ],
                                                                    });
                                                                } else {
                                                                    message.reply(thecustomcommand.output);
                                                                }
                                                            } else {
                                                                throw "you no mencionaste un Channel";
                                                            }
                                                        })
                                                        .catch(e => {
                                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                                            timeouterror = e;
                                                        });
                                                    if (timeouterror)
                                                        return message.reply({
                                                            embeds: [
                                                                new Discord.EmbedBuilder()
                                                                    .setTitle(
                                                                        eval(
                                                                            client.la[ls]["cmds"]["setup"][
                                                                                "setup-customcommand"
                                                                            ]["variable14"]
                                                                        )
                                                                    )
                                                                    .setColor(es.wrongcolor)
                                                                    .setDescription(
                                                                        `¡Operación Cancelada!`.substring(0, 2000)
                                                                    )
                                                                    .setFooter(client.getFooter(es)),
                                                            ],
                                                        });
                                                } else {
                                                    throw "you no mencionaste un Channel";
                                                }
                                            })
                                            .catch(e => {
                                                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                                timeouterror = e;
                                            });
                                        if (timeouterror)
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            eval(
                                                                client.la[ls]["cmds"]["setup"]["setup-customcommand"][
                                                                    "variable15"
                                                                ]
                                                            )
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                        .setFooter(client.getFooter(es)),
                                                ],
                                            });
                                    } else {
                                        throw "you no mencionaste un Channel";
                                    }
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    eval(client.la[ls]["cmds"]["setup"]["setup-customcommand"]["variable16"])
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Delete Custom Command":
                        {
                            let cuc = client.customcommands.get(message.guild.id, "commands");
                            if (!cuc || cuc.length < 1) return message.reply(`${allEmojis.msg.ERROR} There are no Personalizado Commands`);
                            let menuoptions = [];
                            cuc.forEach((cc, index) => {
                                const emoji = NumberEmojis[index + 1];
                                menuoptions.push({
                                    value: `${cc.name}`.substring(0, 25),
                                    description: `Delete ${cc.name} ${cc.embed ? "[✅ Embed]" : "[❌ Embed]"}`.substring(
                                        0,
                                        50
                                    ),
                                    ...(emoji ? { emoji } : {}),
                                });
                            });
                            //define the selection
                            let Selection = new StringSelectMenuBuilder()
                                .setCustomId("MenuSelection")
                                .setMaxValues(cuc.length) //OPTIONAL, this is how many values you can have at each selection
                                .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                .setPlaceholder("Select all Custom Commands which should get deleted")
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
                                .setAuthor({ name: "Custom Command Setup", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/google/298/flexed-biceps_1f4aa.png", url: "https://github.com/melodiabl" })
                                .setDescription(`**Seleccionar all \`Personalizado Commands\` which should get __deleted__**`);
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
                                    for (const value of menu?.values) {
                                        client.customcommands.remove(
                                            message.guild.id,
                                            d =>
                                                String(d.name).substring(0, 25).toLowerCase() == String(value).toLowerCase(),
                                            "commands"
                                        );
                                    }
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(`Eliminado ${menu?.values.length} Personalizado Commands!`)
                                                .setDescription(
                                                    `There are now \`${cuc.length - menu?.values.length} Personalizado Commands\` left!`
                                                )
                                                .setColor(es.color)
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                }
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
                                    content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected.first().values.length} Commands\`**` : "❌ **NOTHING SELECTED - CANCELLED**"}`,
                                });
                            });
                        }
                        break;
                    case "Show Settings":
                        {
                            let cuc = client.customcommands.get(message.guild.id, "commands");
                            var embed = new Discord.EmbedBuilder()
                                .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-customcommand"]["variable22"]))
                                .setColor(es.color)
                                .setFooter({ text: ee.footertext,
                                    iconURL: es.footericon &&
                                        (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                });
                            var embed2 = new Discord.EmbedBuilder()
                                .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-customcommand"]["variable22"]))
                                .setColor(es.color)
                                .setFooter({ text: ee.footertext,
                                    iconURL: es.footericon &&
                                        (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                });
                            var sendembed2 = false;
                            for (let i = 0; i < cuc.length; i++) {
                                try {
                                    var string = `${cuc[i].output}`;
                                    if (string.length > 250) string = string.substring(0, 250) + " ...";
                                    if (i > 13) {
                                        sendembed2 = true;
                                        embed2.addFields({ name: `<:arrow:832598861813776394> \`${cuc[i].name}\` | ${cuc[i].embed ? "✅ Embed" : "❌ Embed"}`, value: ">>> " + string });
                                    } else
                                        embed.addFields({ name: `<:arrow:832598861813776394> \`${cuc[i].name}\` | ${cuc[i].embed ? "✅ Embed" : "❌ Embed"}`, value: ">>> " + string });
                                } catch (e) {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                }
                            }
                            if (sendembed2) await message.reply({ embeds: [embed, embed2] });
                            else await message.reply({ embeds: [embed] });
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
                        .setDescription(`\`\`\`${String(e.message ? e.message : e).substring(0, 2000)}\`\`\``),
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
