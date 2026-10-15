const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const ms = require("ms");
const { databasing, duration } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `removetimeout`,
    category: "Administration",
    description: `Removes the timeouts of a Miembro from a Guild`,
    usage: `removetimeout @Usuario`,
    type: "member",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");

        try {
            //databasing(client, message.guild.id, message.author.id);
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.removetimeout");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.removetimeout`);
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
            if (!kickmember.communicationDisabledUntilTimestamp) return message.reply(obeyUi.owned("❌ **This Usuario is not timeouted!**"));

            let time = 0;

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
                                    .setTitle(obeyUi.limit(`Your Timeout got removed by \`${message.author.username}\``, 256)),
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
                kickmember.timeout(time).then(() => {
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
                                        obeyUi.limit(`**${kickmember.user.username}'s** Timeout got removed by \`${message.author.username}\` `, 256)
                                    ),
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
