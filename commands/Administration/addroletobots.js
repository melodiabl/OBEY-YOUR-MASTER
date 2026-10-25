const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const config = require(`${process.cwd()}/botconfig/config.json`);
const ms = require(`ms`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { acquireRoleBatch } = require("../../handlers/role-batch-lock");
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const { databasing, delay } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `addroletobots`,
    category: "Administration",
    cooldown: 60,
    usage: `addroletobots @Rol`,
    description: `Adds a Rol to every BOT in this Guild`,
    type: "memberrole",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        let releaseBatch;
        try {
            if (!message.guild.members.me.permissions.has([PermissionFlagsBits.ManageRoles]))
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable1"])),
                    ],
                });
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.addroletobots");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
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
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable2"]))
                            .setDescription(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable3"])),
                    ],
                });
            releaseBatch = acquireRoleBatch(client, message.guild.id);
            if (!releaseBatch)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable4"])),
                    ],
                });
            let role =
                message.mentions.roles.filter(role => role.guild.id == message.guild.id).first() ||
                message.guild.roles.cache.get(args[0]);
            if (!role || role == null || role == undefined || role.name == null || role.name == undefined)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable5"]))
                            .setDescription(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable6"])),
                    ],
                });
            if (message.member.roles.highest.position <= role.position)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable7"])),
                    ],
                });
            await message.guild.members.fetch();
            var members = message.guild.members.cache
                .filter(member => !member.roles.cache.has(role.id) && member.user.bot)
                .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
            if (!members || members.length == 0)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable8"]))
                            .setDescription(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable9"])),
                    ],
                });
            let seconds = Number(members.length) * 1500;
            await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setAuthor(obeyMeta.asAuthor({ name: `Changing roles for ${members.length} Bots...`, iconURL: obeyUi.image("motion.cargando"), url: "https://discord.gg/2dKrZQyaC4" }))
                        .setDescription(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable10"])),
                ],
            });
            if (client.settings.get(message.guild.id, `adminlog`) != "no") {
                try {
                    var channel = message.guild.channels.cache.get(client.settings.get(message.guild.id, `adminlog`));
                    if (channel) await channel.send({
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
                                .setDescription(
                                    eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable11"])
                                )
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
            var success = 0;
            var failed = 0;
            var counter = 0;
            for (const member of members) {
                if (client._shuttingDown) throw new Error("The bot is restarting. This role operation has stopped; check the existing roles before retrying.");
                counter++;
                try {
                    await member.roles.add(role.id);
                    success++;
                } catch {
                    failed++;
                    continue;
                }
                await delay(1500);
            }
            await send_finished();

            function send_finished() {
                return message.reply({
                    content: `<@${message.author.id}>`,
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
                            .setTitle(`${emoji?.msg.SUCCESS} SUCCESS`)
                            .setDescription(
                                `Successfully added ${role} to \`${success} BOTS\` of \`${counter} BOTS\`${failed != 0 ? `\n${failed} Members, did not get the added, redo it with: \`${prefix}addroletobots ${role.id}\`` : ""}`
                            ),
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
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["administration"]["addroletoeveryone"]["variable16"])),
                ],
            });
        } finally {
            releaseBatch?.();
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
