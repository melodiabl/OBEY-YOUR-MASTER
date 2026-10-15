const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const { allEmojis } = require("../../botconfig/emojiFunctions");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `nickname`,
    category: "Administration",
    aliases: [`changenickname`],
    description: `Change the Nickname of a Miembro`,
    usage: `nickname @Usuario [New Nickname]`,
    type: "member",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");

        try {
            if (!message.guild.members.me.permissions.has([PermissionFlagsBits.ManageNicknames]))
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(
                                obeyUi.limit(`${obeyUi.markup("icon.error")} **I am missing the Permiso to Manage Nicknames of others**`, 256)
                            ),
                    ],
                });
            //databasing(client, message.guild.id, message.author.id);
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.nickname");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.nickname`);
                    }
                }
            }
            if (
                [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(message.author.id) && [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![message.guild.ownerId, config.ownerid].includes(message.author.id) &&
                !message.member.permissions.has([PermissionFlagsBits.ManageNicknames])
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
            let kickmember =
                message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                message.guild.members.cache.get(args[0] ? args[0] : ``);
            if (!kickmember)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(`${obeyUi.markup("icon.error")} **You forgot to ping a Miembro**`, 256))
                            .setDescription(obeyUi.limit(`Usage: \`${prefix}nickname @Usuario newnickname\``, 4096)),
                    ],
                });
            if (!args[1])
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(`${obeyUi.markup("icon.error")} **You forgot to add a Nickname**`, 256))
                            .setDescription(obeyUi.limit(`Usage: \`${prefix}nickname @Usuario newnickname\``, 4096)),
                    ],
                });
            let nickname = args.slice(1).join(" ");
            if (nickname.length > 32)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(`${obeyUi.markup("icon.error")} **The Nickname must have smaller then 32 Characters**`, 256))
                            .setDescription(obeyUi.limit(`Usage: \`${prefix}nickname @Usuario newnickname\``, 4096)),
                    ],
                });
            kickmember
                .setNickname(nickname)
                .then(member => {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.color)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(
                                    obeyUi.limit(`${allEmojis.msg.SUCCESS} **Successfully changed the username of \`${kickmember.user.username}\` to \`${nickname}\`**`, 256)
                                ),
                        ],
                    });
                })
                .catch(e => {
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
                });
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
