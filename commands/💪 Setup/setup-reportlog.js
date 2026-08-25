var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-reportlog",
    category: "💪 Setup",
    aliases: ["setupreportlog", "cmdlog", "reportlog-setup", "reportlogsetup"],
    cooldown: 5,
    usage: "setup-reportlog --> Sigue los Pasos",
    description: "Esta Configuración te permite enviar registros a un Canal específico cuando alguien usa el Comando: report",
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
                        value: "Enable Report",
                        description: `Define the Report Canal`,
                        emoji: allEmojis.msg.SUCCESS,
                    },
                    {
                        value: "Disable Report",
                        description: `Disable the Report System`,
                        emoji: allEmojis.msg.ERROR,
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Report-Configuración!`,
                        emoji: allEmojis.msg.cancel,
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder("¡Haz clic para configurar the Report-System")
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
                    .setAuthor({ name: "Report Log Setup", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/bookmark_1f516.png", url: "https://github.com/melodiabl" })
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
                    case "Enable Report":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-reportlog"]["variable5"]))
                                        .setColor(es.color)
                                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-reportlog"]["variable6"]))
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
                                    if (!message) throw "NO SE ENVIÓ NINGÚN MENSAJE";
                                    if (message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first()) {
                                        client.settings.set(
                                            message.guild.id,
                                            message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first()
                                                .id,
                                            `reportlog`
                                        );
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        eval(client.la[ls]["cmds"]["setup"]["setup-reportlog"]["variable7"])
                                                    )
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        `If someone executes the Report Comando, a Log Information will be sent in that Canal`.substring(
                                                            0,
                                                            2048
                                                        )
                                                    )
                                                    .setFooter(client.getFooter(es)),
                                            ],
                                        });
                                    }
                                    throw "NO SE MENCIONÓ NINGÚN CANAL";
                                })
                                .catch(e => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    eval(client.la[ls]["cmds"]["setup"]["setup-reportlog"]["variable8"])
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(`¡Operación Cancelada!`.substring(0, 2000))
                                                .setFooter(client.getFooter(es)),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Disable Report":
                        {
                            client.settings.set(message.guild.id, "no", `reportlog`);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-reportlog"]["variable9"]))
                                        .setColor(es.color)
                                        .setDescription(
                                            `If someone executes an Admin Comando, **no** Information will be sent`.substring(
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
                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-reportlog"]["variable11"])),
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
