const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const ms = require("ms");
const { databasing, duration } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `timeout`,
    category: "Administration",
    description: `Timeouts a Miembro from a Guild`,
    usage: `timeout @Usuario <Timespan> [Reason] | e.g: timeout @Usuario 10h+20min Stop spamming!`,
    type: "member",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");

        try {
            //databasing(client, message.guild.id, message.author.id);
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.timeout");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.timeout`);
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
                return message
                    .reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable2"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable3"]), 4096)),
                        ],
                    })
                    .catch(() => {});
            let kickmember =
                message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                message.guild.members.cache.get(args[0] ? args[0] : ``) ||
                (await message.guild.members.fetch(args[0] ? args[0] : ``).catch(() => {})) ||
                false;
            if (!kickmember)
                return message
                    .reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable4"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable5"]), 4096)),
                        ],
                    })
                    .catch(() => {});
            if (!message.member || message.member.roles || !message.member.roles.highest)
                await message.member.fetch().catch(() => {});
            if (kickmember.communicationDisabledUntilTimestamp)
                return message.reply(obeyUi.owned("❌ **This Usuario is already timeouted!**"));
            let time = 0;
            if (!args[1])
                return message.reply(
                    `${obeyUi.markup("icon.error")} **No time added!**\nTry something like this:\n> \`${prefix}timeout ${kickmember.id} 1h+15min Stop spamming!\``
                );
            let timeargs = [args[1]];
            if (timeargs[0].includes("+")) {
                timeargs = timeargs[0].split("+");
            }
            for (const a of timeargs.filter(Boolean)) {
                time += ms(a);
            }
            if (!time || isNaN(time))
                return message.reply(
                    `${obeyUi.markup("icon.error")} **You added a invalid time!**\nTry something like this:\n> \`${prefix}timeout ${kickmember.id} 1h+15min Stop spamming!\``
                );

            let reason = args.slice(2).join(` `);
            if (!reason) {
                reason = `No Reason added | Timeout by: ${message.author.username} (${message.author.id})`;
            }

            const memberPosition = kickmember.roles.highest.rawPosition;
            const moderationPosition = message.member.roles.highest.rawPosition;

            if (moderationPosition <= memberPosition)
                return message
                    .reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable6"]), 256)),
                        ],
                    })
                    .catch(() => {});

            if (!kickmember.manageable)
                return message
                    .reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(obeyUi.owned("❌ **I am not able to manage this Usuario**"), 256)),
                        ],
                    })
                    .catch(() => {});
            try {
                if (!kickmember.user.bot) {
                    kickmember.user
                        .send({
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
                                    .setTitle(
                                        obeyUi.limit(`You got timeouted by \`${message.author.username}\` for ${duration(time)
                                            .map(t => `\`${t}\``)
                                            .join(" ")}`, 256)
                                    )
                                    .setDescription(obeyUi.limit(`Reason:\n>>> ${reason}`.substring(0, 2048), 4096)),
                            ],
                        })
                        .catch(e => {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        });
                }
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                message
                    .reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable10"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable11"]), 4096)),
                        ],
                    })
                    .catch(() => {});
            }
            try {
                kickmember.timeout(time, reason).then(() => {
                    client.stats.push(message.guild.id + message.author.id, new Date().getTime(), "mute");
                    message
                        .reply({
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
                                    .setTitle(
                                        obeyUi.limit(`**${kickmember.user.username}** got timeouted by \`${message.author.username}\` for ${duration(
                                            time
                                        )
                                            .map(t => `\`${t}\``)
                                            .join(" ")}`, 256)
                                    )
                                    .setDescription(obeyUi.limit(`Reason:\n>>> ${reason}`.substring(0, 2048), 4096)),
                            ],
                        })
                        .catch(e => {
                            console.log(e);
                        });
                    if (client.settings.get(message.guild.id, `adminlog`) != "no") {
                        try {
                            var channel = message.guild.channels.cache.get(
                                client.settings.get(message.guild.id, `adminlog`)
                            );
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
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable14"]), 4096))
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
                });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable17"]), 4096)),
                    ],
                });
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable18"]), 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable19"]), 4096)),
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
