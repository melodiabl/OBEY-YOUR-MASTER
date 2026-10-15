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
    name: "setup-embed",
    category: "Setup",
    aliases: ["setupembed", "embed-setup", "embedsetup"],
    cooldown: 5,
    usage: "setup-embed  -->  Follow Steps",
    description: "Cambia la apariencia de tus embeds (color, imagen, miniatura, ...)",
    memberpermissions: ['Administrador'],
    type: "info",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            var timeouterror = false;
            let row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("1").setEmoji(obeyUi.component("1️⃣")),
                new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("2").setEmoji(obeyUi.component("2️⃣")),
                new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("3").setEmoji(obeyUi.component("3️⃣")),
                new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("4").setEmoji(obeyUi.component("4️⃣"))
            );
            var tempmsg = await message.reply({
                components: [row],
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable1"]), 256))
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable2"]), 4096))
                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                ],
            });
            //Create the collector
            const collector = tempmsg.createMessageComponentCollector({
                filter: i => i?.isButton() && i?.message.author.id == client.user.id && i?.user,
                time: 90000,
            });
            //Menu Collections
            collector.on("collect", async button => {
                if (button?.user.id === cmduser.id) {
                    collector.stop();
                    button?.deferUpdate();
                    if (button?.customId == "1") {
                        let discordsupportedcolors = [
                            "DEFAULT",
                            "WHITE",
                            "AQUA",
                            "GREEN",
                            "BLUE",
                            "YELLOW",
                            "PURPLE",
                            "LUMINOUS_VIVID_PINK",
                            "FUCHSIA",
                            "GOLD",
                            "ORANGE",
                            "RED",
                            "GREY",
                            "NAVY",
                            "DARK_AQUA",
                            "DARK_GREEN",
                            "DARK_BLUE",
                            "DARK_PURPLE",
                            "DARK_VIVID_PINK",
                            "DARK_GOLD",
                            "DARK_ORANGE",
                            "DARK_RED",
                            "DARK_GREY",
                            "DARKER_GREY",
                            "LIGHT_GREY",
                            "DARK_NAVY",
                            "BLURPLE",
                            "GREYPLE",
                            "DARK_BUT_NOT_BLACK",
                            "NOT_QUITE_BLACK",
                            "RANDOM",
                        ];

                        tempmsg = await tempmsg.edit({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable5"]), 256))
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .addFields({ name: `**Supported Colors:**`, value: `>>> **HTML/Hex-Colors** (\`#ffff00\`)\n\nColor-Names/Discord-Colors (\`FUCHSIA\`)\n\nHex-Notation Colors (\`0xffffff\`)` })
                                    .addFields({ name: `**Discord Supported Colors:**`, value: `>>> ${discordsupportedcolors.map(c => `\`${c}\``).join("︲")}` })
                                    .addFields({ name: `**Current Color:**`, value: `>>> \`${es.color}\`` })
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
                                var color = collected.first().content;
                                if (!color)
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable7"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable8"]), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                try {
                                    const {
                                        Util: { resolveColor },
                                    } = require("discord.js");
                                    try {
                                        color = color.toUpperCase(); //convert it to uppercase, (cleaner)
                                        let newcolor = false;
                                        newcolor = resolveColor(color);
                                        if (!newcolor)
                                            throw {
                                                message: "Invalid Color Added, make sure to stick to the Example-Rules",
                                            };
                                    } catch (e) {
                                        return message.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor("#ED4245")
                                                    .setTitle(obeyUi.limit(`${allEmojis.msg.ERROR} INVALID COLOR ADDED`, 256))
                                                    .setDescription(
                                                        obeyUi.limit(`\`\`\`${String(e.message ? e.message : e).substring(0, 2000)}\`\`\``, 4096)
                                                    ),
                                            ],
                                        });
                                    }
                                    client.settings.set(message.guild.id, color, "embed.color");
                                    es = client.settings.get(message.guild.id, "embed");
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable11"]), 256))
                                                .setColor(es.color)
                                                .setThumbnail(
                                                    es.thumb
                                                        ? es.footericon &&
                                                          (es.footericon.includes("http://") ||
                                                              es.footericon.includes("https://"))
                                                            ? es.footericon
                                                            : client.user.displayAvatarURL()
                                                        : null
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                } catch (e) {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable12"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable13"]), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                }
                            })
                            .catch(e => {
                                timeouterror = e;
                            });
                        if (timeouterror)
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable14"]), 256))
                                        .setColor(es.wrongcolor)
                                        .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                    } else if (button?.customId == "2") {
                        tempmsg = await tempmsg.edit({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable15"]), 256))
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable16"]), 4096))
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
                                var url = collected.first().content;
                                function attachIsImage(msgAttach) {
                                    url = msgAttach.url;
                                    //True if this url is a png image.
                                    return (
                                        url.indexOf("png", url.length - "png".length /*or 3*/) !== -1 ||
                                        url.indexOf("jpeg", url.length - "jpeg".length /*or 3*/) !== -1 ||
                                        url.indexOf("jpg", url.length - "jpg".length /*or 3*/) !== -1
                                    );
                                }

                                if (collected.first().attachments.size > 0) {
                                    if (collected.first().attachments.every(attachIsImage)) {
                                        try {
                                            client.settings.set(message.guild.id, url, "embed.footericon");
                                            es = client.settings.get(message.guild.id, "embed");
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable17"]), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setThumbnail(
                                                            es.thumb
                                                                ? es.footericon &&
                                                                  (es.footericon.includes("http://") ||
                                                                      es.footericon.includes("https://"))
                                                                    ? es.footericon
                                                                    : client.user.displayAvatarURL()
                                                                : null
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable18"]), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable19"]), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable20"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                } else if (
                                    !url.includes("http") ||
                                    !(
                                        url.toLowerCase().includes("png") ||
                                        url.toLowerCase().includes("gif") ||
                                        url.toLowerCase().includes("jpg")
                                    )
                                ) {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable21"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                } else {
                                    try {
                                        client.settings.set(message.guild.id, url, "embed.footericon");
                                        es = client.settings.get(message.guild.id, "embed");
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable22"]), 256)
                                                    )
                                                    .setColor(es.color)
                                                    .setThumbnail(
                                                        es.thumb
                                                            ? es.footericon &&
                                                              (es.footericon.includes("http://") ||
                                                                  es.footericon.includes("https://"))
                                                                ? es.footericon
                                                                : client.user.displayAvatarURL()
                                                            : null
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    } catch (e) {
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable23"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable24"]), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                }
                            })
                            .catch(e => {
                                timeouterror = e;
                            });
                        if (timeouterror)
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable25"]), 256))
                                        .setColor(es.wrongcolor)
                                        .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                    } else if (button?.customId == "3") {
                        tempmsg = await tempmsg.edit({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable26"]), 256))
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable27"]), 4096))
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
                                var text = collected.first().content;
                                try {
                                    client.settings.set(message.guild.id, text, "embed.footertext");
                                    es = client.settings.get(message.guild.id, "embed");
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(`${allEmojis.msg.SUCCESS} The new Embed Footer Text is:`.substring(
                                                        0,
                                                        256
                                                    ), 256)
                                                )
                                                .setColor(es.color)
                                                .setThumbnail(
                                                    es.thumb
                                                        ? es.footericon &&
                                                          (es.footericon.includes("http://") ||
                                                              es.footericon.includes("https://"))
                                                            ? es.footericon
                                                            : client.user.displayAvatarURL()
                                                        : null
                                                )
                                                .setDescription(obeyUi.limit(es.footertext, 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                } catch (e) {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable28"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable29"]), 4096)
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                }
                            })
                            .catch(e => {
                                timeouterror = e;
                            });
                        if (timeouterror)
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable30"]), 256))
                                        .setColor(es.wrongcolor)
                                        .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                    } else if (button?.customId == "4") {
                        try {
                            client.settings.set(
                                message.guild.id,
                                !client.settings.get(message.guild.id, "embed.thumb"),
                                "embed.thumb"
                            );
                            es = client.settings.get(message.guild.id, "embed");
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable31"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable32"]), 4096))
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        } catch (e) {
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable33"]), 256))
                                        .setColor(es.wrongcolor)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable34"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }
                    }
                } else
                    button?.reply({
                        content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                        ephemeral: true,
                    });
            });
            //Once the Collections ended edit the menu message
            collector.on("end", collected => {
                tempmsg.edit({
                    embeds: [tempEmbedBuilder.from(msg.embeds[0]).setDescription(obeyUi.limit(`~~${tempmsg.embeds[0].description}~~`, 4096))],
                    components: [],
                    content: `${collected && collected.first() && collected.first().customId ? `${allEmojis.msg.SUCCESS} **Selected the \`${collected.first().customId}\`. Button**` : obeyUi.owned("❌ **NOTHING SELECTED - CANCELLED**")}`,
                });
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-embed"]["variable36"]), 4096)),
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
