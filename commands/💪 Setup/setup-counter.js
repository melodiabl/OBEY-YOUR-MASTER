var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
module.exports = {
    name: "setup-counter",
    category: "💪 Setup",
    aliases: [
        "setupcounter",
        "counter-setup",
        "countersetup",
        "setup-numbercounter",
        "setupnumbercounter",
        "numbercounter-setup",
        "numbercountersetup",
    ],
    cooldown: 5,
    usage: "setup-counter --> Sigue los Pasos",
    description: "Esta Configuración te permite enviar registros a un Canal específico cuando alguien usa el Comando: report",
    memberpermissions: ['Administrador'],
    type: "fun",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Enable Counter",
                        description: `Set a Canal to the Counter Canal`,
                        emoji: "✅",
                    },
                    {
                        value: "Disable Counter",
                        description: `Disables the Counter System`,
                        emoji: "❌",
                    },
                    {
                        value: "Reset Current Number",
                        description: `Resets the current, counted Number back to 0`,
                        emoji: "🗑️",
                    },
                    {
                        value: "Show Settings",
                        description: `Show the current Ajustes!`,
                        emoji: "📑",
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder("¡Haz clic para configurar the Number Counter System!")
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
                    .setAuthor({ name: "Number Counter Setup", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/emojidex/112/input-symbol-for-numbers_1f522.png", url: "https://github.com/melodiabl" })
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
                switch (
                    optionhandletype // return message.reply
                ) {
                    case "Enable Counter":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-counter"]["variable5"]))
                                        .setColor(es.color)
                                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-counter"]["variable6"]))
                                        .setFooter(client.getFooter(es)),
                                ],
                            });
                            var thecmd;
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
                                        client.settings.set(message.guild.id, channel.id, `counter`);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        eval(client.la[ls]["cmds"]["setup"]["setup-counter"]["variable7"])
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        `You can now count Numbers in <#${channel.id}>`.substring(0, 2048)
                                                    )
                                                    .setFooter(client.getFooter(es)),
                                            ],
                                        });
                                    }
                                    return message.reply("NO SE MENCIONÓ NINGÚN CANAL");
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-counter"]["variable8"]))
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Disable Counter":
                        {
                            client.settings.set(message.guild.id, "no", `counter`);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-counter"]["variable9"]))
                                        .setColor(es.color)
                                        .setDescription(`You can't count Numbers anymore`.substring(0, 2048))
                                        .setFooter(client.getFooter(es)),
                                ],
                            });
                        }
                        break;
                    case "Reset Current Number":
                        {
                            client.settings.set(message.guild.id, 0, `counternum`);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-counter"]["variable10"]))
                                        .setColor(es.color)
                                        .setDescription(`People now need to count from 1 again!`.substring(0, 2048))
                                        .setFooter(client.getFooter(es)),
                                ],
                            });
                        }
                        break;
                    case "Show Settings":
                        {
                            let thesettings = client.settings.get(message.guild.id, `counter`);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-counter"]["variable11"]))
                                        .setColor(es.color)
                                        .setDescription(
                                            `**Canal:** ${thesettings == "no" ? "Not Setupped" : `<#${thesettings}> | \`${thesettings}\``}\n\n**Current Number:** \`${client.settings.get(message.guild.id, "counternum")}\`\n**Nest Number:** \`${Number(client.settings.get(message.guild.id, "counternum")) + 1}\``.substring(
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
                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-counter"]["variable13"])),
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
