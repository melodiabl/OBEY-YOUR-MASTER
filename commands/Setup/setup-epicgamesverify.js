const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder,
    ButtonStyle
} = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-epicgamesverify",
    category: "Setup",
    aliases: ["setupepicgamesverify", "epicgamesverify-setup", "epicgamesverifysetup"],
    cooldown: 5,
    usage: "setup-epicgamesverify --> Sigue los Pasos",
    description: "Configura un sistema de verificación de Epic Games para tu servidor y organiza eventos y juega mejor juntos!",
    memberpermissions: ['Administrador'],
    type: "info",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Enable Verification",
                        description: `Define the Canal for the Verification Process`,
                        emoji: obeyUi.component(allEmojis.msg.SUCCESS),
                    },
                    {
                        value: "Enable Log",
                        description: `Define the Comando Log Canal`,
                        emoji: obeyUi.component(allEmojis.msg.SUCCESS),
                    },
                    {
                        value: "Disable Log",
                        description: `Disable the Action Log`,
                        emoji: obeyUi.component(allEmojis.msg.ERROR),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Epic Games Verify"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Epic Games Verify Setup", iconURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Epic_Games_logo.svg/882px-Epic_Games_logo.svg.png", url: "https://github.com/melodiabl" }))
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
                client.epicgamesDB.ensure(message.guild.id, {
                    logChannel: "",
                    verifychannel: "",
                });
                switch (optionhandletype) {
                    case "Enable Verification":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admincmdlog"]["variable4"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admincmdlog"]["variable5"]), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                    if (message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first()) {
                                        var channel = message.mentions.channels
                                            .filter(ch => ch.guild.id == message.guild.id)
                                            .first();

                                        channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(es.color)
                                                    .setFooter(obeyMeta.asFooter({ text: message.guild.name + " | Powered by: github.com/melodiabl",
                                                        iconURL: message.guild.iconURL()
                                                    }))
                                                    .setThumbnail(es.thumb ? message.guild.iconURL() : undefined)
                                                    .setTitle(obeyUi.limit(`Click the Button to Verify and Link your Epic Games Account`, 256))
                                                    .setDescription(
                                                        obeyUi.limit(`If you click the Button you can verify your Epic Games account to this Servidor!\nYou can click it again to change your Account details!`, 4096)
                                                    ),
                                            ],
                                            components: [
                                                new ActionRowBuilder().addComponents([
                                                    new ButtonBuilder()
                                                        .setCustomId("epicgamesverify")
                                                        .setStyle(ButtonStyle.Primary)
                                                        .setLabel(obeyUi.plain("Verify"))
                                                        .setEmoji(obeyUi.component("✋")),
                                                ]),
                                            ],
                                        });

                                        client.epicgamesDB.set(message.guild.id, channel.id, `verifychannel`);

                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(obeyUi.limit("Activado the Verification System!", 256))
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`People can now verify their Epic Games Account in <#${channel.id}>\n> If wished, you can edit the Embed in there by running the \`${prefix}editembed\` Comando!`.substring(
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
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admincmdlog"]["variable7"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Enable Log":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admincmdlog"]["variable4"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admincmdlog"]["variable5"]), 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                                    if (message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first()) {
                                        client.epicgamesDB.set(
                                            message.guild.id,
                                            message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first()
                                                .id,
                                            `logChannel`
                                        );
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(obeyUi.limit("Activado the Log", 256))
                                                    .setColor(es.color)
                                                    .setDescription(
                                                        obeyUi.limit(`I will now log all Actions in <#${message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first().id}>`.substring(
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
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admincmdlog"]["variable7"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    case "Disable Log":
                        {
                            client.epicgamesDB.set(message.guild.id, "", `logChannel`);
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit("Desactivado the Log Canal", 256))
                                        .setColor(es.color)
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admincmdlog"]["variable11"]), 4096)),
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
