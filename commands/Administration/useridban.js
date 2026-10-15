const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const { allEmojis } = require("../../botconfig/emojiFunctions");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `useridban`,
    category: "Administration",
    aliases: [`hackban`, "hban", "uban"],
    description: `Bans a Usuario from the Guild, just by adding the ID. He does not need to be in your Guild...`,
    usage: `useridban <ID> [Reason]`,
    type: "member",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");

        try {
            if (!message.guild.members.me.permissions.has([PermissionFlagsBits.BanMembers]))
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable1"]), 256)),
                    ],
                });
            //databasing(client, message.guild.id, message.author.id);
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.useridban");
            if (!cmdroles) cmdroles = [];
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        client.settings.remove(message.guild.id, r, `cmdadminroles.useridban`);
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
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable2"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["ban"]["variable3"]), 4096)),
                    ],
                });
            let user = args[0];
            if (!user)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(obeyUi.owned("❌ Por favor add a USERID"), 256))
                            .setDescription(obeyUi.limit(`Usage: \`${prefix}useridban <ID> [REASON]\``, 4096)),
                    ],
                });
            let reason = args.slice(1).join(" ") || "No reason given.";

            try {
                let ban = await message.guild.members.ban(user, {
                    reason,
                });
                message.reply({
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
                            .setTitle(obeyUi.limit(`${allEmojis.msg.SUCCESS} Baneado ${ban.tag || user}`, 256))
                            .setDescription(obeyUi.limit(`**Reason**: ${reason}`, 4096)),
                    ],
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
