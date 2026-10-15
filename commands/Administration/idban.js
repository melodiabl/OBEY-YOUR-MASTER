const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `idban`,
    category: "Administration",
    aliases: [`idbanhammer`, "idban"],
    description: `Bans a Miembro from a Guild`,
    usage: `idban <userid> [Reason]`,
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
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.ban");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        client.settings.remove(message.guild.id, r, `cmdadminroles.ban`);
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
            if (!args[0])
                return message
                    .reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(obeyUi.owned("❌ No válido Comando Usage"), 256))
                                .setDescription(
                                    obeyUi.limit(`Usage: \`${prefix}idban <USER-ID>\`\nExample: \`${prefix}idban 917827695453286410\``, 4096)
                                ),
                        ],
                    })
                    .catch(() => {});
            let banuser = args[0];
            let reason = args[1] ? args.slice(1).join(", ") : false;
            message.guild.members
                .ban(banuser, {
                    reason: reason ? reason : `No reason given, ban by: ${message.author.id}`,
                })
                .then(ban => {
                    return message
                        .reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.color)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(`${obeyUi.markup("icon.success")} Baneado ${ban.tag || `Unkown Usuario with id: \`${banuser}\``}`, 256))
                                    .setDescription(obeyUi.limit(`**Reason**: ${reason ? reason : "No Reason"}`, 4096)),
                            ],
                        })
                        .catch(() => {});
                })
                .catch(e => {
                    return message
                        .reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(`${obeyUi.markup("icon.error")} Could not ban ${banuser}`, 256))
                                    .setDescription(obeyUi.limit(`\`\`\`${String(e.message ? e.message : e).substring(0, 2000)}\`\`\``, 4096)),
                            ],
                        })
                        .catch(() => {});
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
