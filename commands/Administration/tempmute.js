const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const config = require(`${process.cwd()}/botconfig/config.json`);
const ms = require(`ms`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `tempmute`,
    category: "Administration",
    aliases: [``],
    cooldown: 4,
    usage: `tempmute @Usuario <Time+Format(e.g: 10m)> [REASON]`,
    description: `Tempmutes a Usuario for a specific Time! (no Perma Option allowed)`,
    type: "member",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            if (!message.guild.members.me.permissions.has([PermissionFlagsBits.ManageRoles]))
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable1"]), 256)),
                    ],
                });
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.mute");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.mute`);
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
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable2"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable3"]), 4096)),
                    ],
                });
            let member =
                message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                message.guild.members.cache.get(args[0] ? args[0] : ``);
            if (!member)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable4"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable5"]), 4096)),
                    ],
                });
            args.shift();
            if (member.roles.highest.position >= message.member.roles.highest.position)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable6"]), 256)),
                    ],
                });

            let time = args[0];
            if (!time)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable7"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable8"]), 4096)),
                    ],
                });

            args.shift();
            let reason = args.join(` `);
            let allguildroles = [...message.guild.roles.cache.values()];
            let mutedrole = false;
            for (let i = 0; i < allguildroles.length; i++) {
                if (allguildroles[i].name.toLowerCase().includes(`muted`)) {
                    mutedrole = allguildroles[i];
                    break;
                }
            }
            if (!mutedrole) {
                let highestrolepos = message.guild.members.me.roles.highest.position;
                mutedrole = await message.guild.roles
                    .create({
                        name: `muted`,
                        color: `#222222`,
                        hoist: true,
                        position: Number(highestrolepos) - 1,
                        reason: `This role got created, to mute Members!`,
                    })
                    .catch(e => {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable9"]), 256)),
                            ],
                        });
                    });
            }
            if (mutedrole.position > message.guild.members.me.roles.highest.position)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable10"]), 256)),
                    ],
                });

            if (time.toLowerCase().includes("pe")) {
                try {
                    return message.reply(
                        `${obeyUi.markup("icon.error")} **Perma is __not__ allowed with tempmute!**\nUse: \`${prefix}mute ${member.id} perma ...\` for it!`
                    );
                } catch (e) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable13"]), 4096)),
                        ],
                    });
                }
            } else {
                let mutetime;
                try {
                    mutetime = ms(time);
                } catch (e) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable11"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable12"]), 4096)),
                        ],
                    });
                }
                try {
                    await member.roles.add(mutedrole).catch(e => {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                    });
                    if (!mutetime || mutetime === undefined) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable18"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable19"]), 4096)),
                            ],
                        });
                    }
                    //Send information in the Chat
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
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable20"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable21"]), 4096)),
                        ],
                    });
                    //Add the Member to the Mute DB
                    client.mutes.push(
                        "MUTES",
                        {
                            timestamp: Date.now(),
                            mutetime: mutetime,
                            role: mutedrole.id,
                            user: member.user.id,
                            guild: message.guild.id,
                            channel: message.channel.id,
                            reason: reason,
                        },
                        "MUTES"
                    );
                    //increase the Mod Stats
                    client.stats.push(message.guild.id + message.author.id, new Date().getTime(), "mute");
                    //Send information to the MUTE - MEMBER
                    member
                        .send({
                            embeds: new EmbedBuilder()
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
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable22"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable23"]), 4096)),
                        })
                        .catch(_ => {});

                    await message.guild.channels.cache
                        .filter(c => c.permissionOverwrites)
                        .filter(
                            c =>
                                !c.permissionOverwrites.cache.has(mutedrole.id) ||
                                (c.permissionOverwrites.cache.has(mutedrole.id) &&
                                    !c.permissionOverwrites.cache
                                        .get(mutedrole.id)
                                        .deny.toArray()
                                        .includes("SEND_MESSAGES")) ||
                                (c.permissionOverwrites.cache.has(mutedrole.id) &&
                                    !c.permissionOverwrites.cache.get(mutedrole.id).deny.toArray().includes("ADD_REACTIONS"))
                        )
                        .forEach(async ch => {
                            try {
                                if (ch.permissionsFor(ch.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                    await ch.permissionOverwrites
                                        .edit(mutedrole, {
                                            SEND_MESSAGES: false,
                                            ADD_REACTIONS: false,
                                            CONNECT: false,
                                            SPEAK: false,
                                        })
                                        .catch(() => {});
                                    await delay(1500);
                                }
                            } catch (e) {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                            }
                        });
                } catch (e) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable13"]), 4096)),
                        ],
                    });
                }
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
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable24"]), 4096))
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
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable27"]), 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["mute"]["variable28"]), 4096)),
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
