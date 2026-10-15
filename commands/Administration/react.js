const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const config = require(`${process.cwd()}/botconfig/config.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `react`,
    category: "Administration",
    aliases: [``],
    description: `Closes the ticket`,
    usage: `react <msgid> <Emoji>`,
    type: "server",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.react");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.react`);
                    }
                }
            }
            if (
                [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(message.author.id) && [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![message.guild.ownerId, config.ownerid].includes(message.author.id) &&
                !message.member.permissions.has([PermissionFlagsBits.Administrator])
            )
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable1"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable2"]), 4096)),
                    ],
                });

            if (!args[0])
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable3"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable4"]), 4096)),
                    ],
                });
            if (args[0].length != 18)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable5"]), 256)),
                    ],
                });

            if (!args[1])
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable6"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable7"]), 4096)),
                    ],
                });

            if (args[1].includes("<")) {
                let emojii = args[1].split(":")[args[1].split(":").length - 1].replace(">", "");
                console.log(emojii);
                if (!emojii)
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable8"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable9"]), 4096)),
                        ],
                    });
                message.channel.messages
                    .fetch(args[0])
                    .catch(() => {})
                    .then(msg => msg.react(obeyUi.reaction(emojii)).catch(() => {}))
                    .catch(() => {});
                if (client.settings.get(message.guild.id, `adminlog`) != "no") {
                    try {
                        var channel = message.guild.channels.cache.get(client.settings.get(message.guild.id, `adminlog`));
                        if (!channel) return client.settings.set(message.guild.id, "no", `adminlog`);
                        channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setAuthor(obeyMeta.asAuthor({ name: `${require("path").parse(__filename).name} | ${message.author.username}`, iconURL: message.author.displayAvatarURL() }))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable10"]), 4096))
                                    .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable15"]) })
                                    .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable16"]) })
                                    .setTimestamp()
                                    .setFooter(obeyMeta.asFooter(client.getFooter(
                                            "ID: " + message.author.id,
                                            message.author.displayAvatarURL()
                                        ))
                                    ),
                            ],
                        });
                    } catch (e) {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                    }
                }
            } else {
                let emojii = args[1];
                if (!emojii)
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable13"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable14"]), 4096)),
                        ],
                    });
                message.channel.messages
                    .fetch(args[0])
                    .catch(() => {})
                    .then(msg => msg.react(obeyUi.reaction(emojii)).catch(() => {}))
                    .catch(e => {
                        console.log(String(e.stack).grey.bgRed);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable15"]), 4096)),
                            ],
                        });
                    });
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable16"]), 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["react"]["variable17"]), 4096)),
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
