const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const config = require(`${process.cwd()}/botconfig/config.json`);
const ms = require(`ms`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits,
    ButtonStyle
} = require(`discord.js`);
const Discord = require("discord.js");
const { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `deleterole`,
    category: "Administration",
    aliases: [`roledelete`, "delete-role", "role-delete"],
    cooldown: 4,
    usage: `deleterole  @Rol`,
    description: `Delets a Rol from this Servidor`,
    type: "role",
    run: async (client, message, args, cmduser, text, prefix) => {
        if (!message.guild.members.me.permissions.has([PermissionFlagsBits.ManageRoles]))
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable1"]), 256)),
                ],
            });
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.deleterole");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.deleterole`);
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
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable2"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable3"]), 4096)),
                    ],
                });
            let role =
                message.mentions.roles.filter(role => role.guild.id == message.guild.id).first() ||
                message.guild.roles.cache.get(args[0]);
            if (!role || role == null || role == undefined || role.name == null || role.name == undefined)
                return message.reply({ embeds: [] });
            let button_verify = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId("deleterole_verify")
                .setLabel(obeyUi.plain("Verify this Step"))
                .setEmoji(obeyUi.component("✅"));
            let msg = await message.channel.send({
                content: `<@${message.author.id}>`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable6"]), 256))
                        .setColor(es.color),
                ],
                components: [new ActionRowBuilder().addComponents(button_verify)],
            });
            let edited = false;
            const collector = msg.createMessageComponentCollector( { filter:bb => !bb?.user.bot,
                time: 30000,
            }); //collector for 5 seconds
            collector.on("collect", async b => {
                if (b?.user.id !== message.author.id)
                    return b?.reply(
                        `${obeyUi.markup("icon.error")} **Only the one who typed ${prefix}help is allowed to react!**`,
                        true
                    );

                edited = true;
                msg.edit({
                    content: `<@${message.author.id}>`,
                    embeds: [new EmbedBuilder().setTitle(obeyUi.limit("¡Verificado!", 256)).setColor(es.color)],
                    components: [new ActionRowBuilder().addComponents(button_verify.setDisabled(true))],
                }).catch(e => {
                    console.log(String(e).grey);
                });

                //page forward
                if (b?.customId == "deleterole_verify") {
                    let membersize = [...role.members.values()].length;
                    role.delete(`${message.author.username} Requested a Role delete`)
                        .then(r => {
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
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable8"]), 256)),
                                ],
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
                                                          (es.footericon.includes("http://") ||
                                                              es.footericon.includes("https://"))
                                                            ? es.footericon
                                                            : client.user.displayAvatarURL()
                                                        : null
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                .setAuthor(obeyMeta.asAuthor({ name: `${require("path").parse(__filename).name} | ${message.author.username}`, iconURL: message.author.displayAvatarURL() }))
                                                .setDescription(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable9"]), 4096)
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
                        })
                        .catch(() => {});
                } else {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable12"]), 256))
                                .setDescription(obeyUi.limit(ge.message, 4096)),
                        ],
                    });
                }
            });

            let endedembed = new EmbedBuilder().setTitle(obeyUi.limit("Time ran out!", 256)).setColor(es.wrongcolor);
            collector.on("end", collected => {
                if (!edited) {
                    edited = true;
                    msg.edit({
                        content: `<@${message.author.id}>`,
                        embeds: [endedembed],
                        components: [
                            new ActionRowBuilder().addComponents(
                                button_verify
                                    .setDisabled(true)
                                    .setLabel(obeyUi.plain("FAILED TO VERIFY"))
                                    .setEmoji(obeyUi.component("❌"))
                                    .setStyle(ButtonStyle.Danger)
                            ),
                        ],
                    }).catch(e => {
                        console.log(String(e).grey);
                    });
                }
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable14"]), 4096)),
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
