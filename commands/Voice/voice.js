const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Discord = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
module.exports = {
    name: "voice",
    category: "Voice",
    aliases: [""],
    cooldown: 5,
    extracustomdesc:
        "`voice add`, `voice ban`, `voice bitrate`, `voice invite`, `voice kick`, `voice limit`, `voice lock`, `voice promote`, `voice trust`, `voice trust`, `voice unban`, `voice unlock`, `voice untrust`, `voice stage`, `voice unstage`, `voice stage`, `voice unstage`",
    usage: "`voice <CMD_TYPE> [Options]`\n\nValid CMD_TYPES: `lock`, `invite`, `add`, `kick`, `unlock`, `ban`, `unban`, `trust`, `untrust`, `limit`, `bitrate`, `promote`, `stage`, `unstage`",
    description: "Los Comandos de Voz son para los COMANDOS DE UNIRSE PARA CREAR, úsalos para ajustar tu canal creado!",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!client.settings.get(message.guild.id, "VOICE")) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.disabled.title, 256))
                        .setDescription(
                            obeyUi.limit(require(`${process.cwd()}/handlers/functions`).handlemsg(
                                client.la[ls].common.disabled.description,
                                { prefix: prefix }
                            ), 4096)
                        ),
                ],
            });
        }
        try {
            let newargs = message.content.slice(prefix.length).split(/ +/).slice(1);
            let args = newargs;
            let cmd = args.shift();
            if (cmd && cmd.length > 0) cmd = cmd.toLowerCase();
            if (cmd === "lock") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable1"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);

                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable2"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                        return message.reply(`${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`);
                    }
                    vc.permissionOverwrites
                        .set([
                            {
                                id: message.guild.id,
                                allow: ["VIEW_CHANNEL"],
                                deny: ["CONNECT"],
                            },
                        ])
                        .then(lol => {
                            if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                return message.reply(
                                    `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                );
                            }
                            vc.permissionOverwrites.edit(message.author.id, {
                                MANAGE_CHANNELS: true,
                                VIEW_CHANNEL: true,
                                MANAGE_ROLES: true,
                                CONNECT: true,
                            });
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable3"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable4"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable5"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "unlock") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable6"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable7"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });

                    if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                        return message.reply(`${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`);
                    }
                    vc.permissionOverwrites
                        .edit(message.guild.id, {
                            VIEW_CHANNEL: true,
                            CONNECT: true,
                        })
                        .then(lol => {
                            if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                return message.reply(
                                    `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                );
                            }
                            vc.permissionOverwrites.edit(message.author.id, {
                                MANAGE_CHANNELS: true,
                                VIEW_CHANNEL: true,
                                MANAGE_ROLES: true,
                                CONNECT: true,
                            });
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable8"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable9"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable10"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "stage") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable1"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);

                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable2"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                        return message.reply(`${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`);
                    }
                    vc.permissionOverwrites
                        .set([
                            {
                                id: message.guild.id,
                                allow: ["VIEW_CHANNEL", "CONNECT"],
                                deny: ["SPEAK"],
                            },
                        ])
                        .then(lol => {
                            if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                return message.reply(
                                    `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                );
                            }
                            vc.permissionOverwrites.edit(message.author.id, {
                                MANAGE_CHANNELS: true,
                                VIEW_CHANNEL: true,
                                MANAGE_ROLES: true,
                                CONNECT: true,
                            });
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(obeyUi.owned("✅ ¡ESCENARIO en tu Canal!"), 256))
                                        .setDescription(obeyUi.limit(`¡Nadie puede hablar ya!`, 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable5"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "unstage") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable6"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable7"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });

                    if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                        return message.reply(`${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`);
                    }
                    vc.permissionOverwrites
                        .edit(message.guild.id, {
                            VIEW_CHANNEL: true,
                            CONNECT: true,
                            SPEAK: true,
                        })
                        .then(lol => {
                            if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                return message.reply(
                                    `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                );
                            }
                            vc.permissionOverwrites.edit(message.author.id, {
                                MANAGE_CHANNELS: true,
                                VIEW_CHANNEL: true,
                                MANAGE_ROLES: true,
                                SPEAK: true,
                                CONNECT: true,
                            });
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(obeyUi.owned("✅ ¡SIN ESCENARIO en tu Canal!"), 256))
                                        .setDescription(obeyUi.limit(`¡Todos pueden hablar en tu Canal ahora!`, 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable10"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "kick") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable11"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable12"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!args[0])
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable13"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable14"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    let member =
                        message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                        message.guild.members.cache.get(args[0]);
                    if (!member || member == null || member == undefined)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable15"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable16"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!member.voice.channel)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable17"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (member.voice.channel.id != channel.id)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable18"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    try {
                        member.voice.disconnect();
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable19"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    } catch (e) {
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable20"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable21"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    }
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable22"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (["invite", "add"].includes(cmd)) {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable23"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable24"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!args[0])
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable25"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable26"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    let member =
                        message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                        message.guild.members.cache.get(args[0]);
                    if (!member || member == null || member == undefined)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable27"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable28"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    let txt = args.slice(1).join(" ");
                    try {
                        if (!channel.permissionsFor(channel.guild.members.me).has(PermissionFlagsBits.CreateInstantInvite)) {
                            return message.reply(
                                `${allEmojis.msg.ERROR} **Me falta el PERMISO CREATE_INSTANT_INVITE para \`${channel.name}\`**`
                            );
                        }
                        channel.createInvite().then(invite => {
                            if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                return message.reply(
                                    `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                );
                            }
                            vc.permissionOverwrites
                                .edit(member.user.id, {
                                    VIEW_CHANNEL: true,
                                    CONNECT: true,
                                })
                                .then(lol => {
                                    if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                        return message.reply(
                                            `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                        );
                                    }
                                    vc.permissionOverwrites.edit(message.author.id, {
                                        MANAGE_CHANNELS: true,
                                        VIEW_CHANNEL: true,
                                        MANAGE_ROLES: true,
                                        CONNECT: true,
                                    });
                                    member.user
                                        .send({
                                            embeds: [
                                                new Discord.EmbedBuilder()
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
                                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable29"]), 256))
                                                    .setDescription(
                                                        obeyUi.limit(`[Click aquí](${invite.url}) para unirte a **${channel.name}**\n\n${txt ? txt : ""}`.substring(
                                                            0,
                                                            2000
                                                        ), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        })
                                        .catch(e => {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setColor(es.wrongcolor)
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable30"]), 256)
                                                        )
                                                        .setDescription(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable31"]), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        });
                                });
                            return message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable32"]), 256))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                    } catch (e) {
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable33"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable34"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    }
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable35"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "ban") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable36"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable37"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!args[0])
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable38"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable39"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    let member =
                        message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                        message.guild.members.cache.get(args[0]);
                    if (!member || member == null || member == undefined)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable40"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable41"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (member.voice.channel && member.voice.channel.id == channel.id)
                        try {
                            member.voice.disconnect();
                            message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable42"]), 256))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        } catch (e) {
                            message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.wrongcolor)
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable43"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable44"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        }

                    if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                        return message.reply(`${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`);
                    }
                    vc.permissionOverwrites
                        .edit(member.user.id, {
                            VIEW_CHANNEL: true,
                            CONNECT: false,
                        })
                        .then(lol => {
                            if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                return message.reply(
                                    `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                );
                            }
                            vc.permissionOverwrites.edit(message.author.id, {
                                MANAGE_CHANNELS: true,
                                VIEW_CHANNEL: true,
                                MANAGE_ROLES: true,
                                CONNECT: true,
                            });
                            message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable45"]), 256))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable46"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "unban") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable47"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable48"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!args[0])
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable49"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable50"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    let member =
                        message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                        message.guild.members.cache.get(args[0]);
                    if (!member || member == null || member == undefined)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable51"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable52"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                        return message.reply(`${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`);
                    }
                    vc.permissionOverwrites
                        .edit(member.user.id, {
                            VIEW_CHANNEL: true,
                            CONNECT: true,
                        })
                        .then(lol => {
                            if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                return message.reply(
                                    `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                );
                            }
                            vc.permissionOverwrites.edit(message.author.id, {
                                MANAGE_CHANNELS: true,
                                VIEW_CHANNEL: true,
                                MANAGE_ROLES: true,
                                CONNECT: true,
                            });
                            message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable53"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable54"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable55"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "trust") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable56"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable57"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!args[0])
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable58"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable59"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    let member =
                        message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                        message.guild.members.cache.get(args[0]);
                    if (!member || member == null || member == undefined)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable60"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable61"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                        return message.reply(`${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`);
                    }
                    vc.permissionOverwrites
                        .edit(member.user.id, {
                            VIEW_CHANNEL: true,
                            CONNECT: true,
                        })
                        .then(lol => {
                            if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                return message.reply(
                                    `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                );
                            }
                            vc.permissionOverwrites.edit(message.author.id, {
                                MANAGE_CHANNELS: true,
                                VIEW_CHANNEL: true,
                                MANAGE_ROLES: true,
                                CONNECT: true,
                            });
                            message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable62"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable63"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable64"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "untrust") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable65"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable66"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!args[0])
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable67"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable68"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    let member =
                        message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                        message.guild.members.cache.get(args[0]);
                    if (!member || member == null || member == undefined)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable69"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable70"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                        return message.reply(`${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`);
                    }
                    vc.permissionOverwrites
                        .edit(member.user.id, {
                            VIEW_CHANNEL: true,
                            CONNECT: false,
                        })
                        .then(lol => {
                            if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                return message.reply(
                                    `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                );
                            }
                            vc.permissionOverwrites.edit(message.author.id, {
                                MANAGE_CHANNELS: true,
                                VIEW_CHANNEL: true,
                                MANAGE_ROLES: true,
                                CONNECT: true,
                            });
                            message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable71"]), 256))
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable72"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable73"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "limit") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable74"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable75"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!args[0])
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable76"]), 256)),
                            ],
                        });
                    if (isNaN(args[0]))
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable77"]), 256)),
                            ],
                        });
                    let userlimit = Number(args[0]);
                    if (userlimit > 99 || userlimit < 0)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable78"]), 256)),
                            ],
                        });
                    channel.setUserLimit(userlimit).then(vc => {
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable79"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable80"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "bitrate") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable81"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable82"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!args[0])
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable83"]), 256)),
                            ],
                        });
                    if (isNaN(args[0]))
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable84"]), 256)),
                            ],
                        });
                    let maxbitrate = 96000;
                    let boosts = message.guild.premiumSubscriptionCount;
                    if (boosts >= 2) maxbitrate = 128000;
                    if (boosts >= 15) maxbitrate = 256000;
                    if (boosts >= 30) maxbitrate = 384000;
                    let userlimit = Number(args[0]);
                    if (userlimit > maxbitrate || userlimit < 8000)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable85"]), 256)),
                            ],
                        });
                    channel.setBitrate(userlimit).then(vc => {
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.color)
                                    .setThumbnail(
                                        es.thumb
                                            ? es.footericon &&
                                              (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                ? es.footericon
                                                : client.user.displayAvatarURL()
                                            : null
                                    )
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable86"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    });
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable87"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else if (cmd === "promote") {
                let { channel } = message.member.voice;
                if (!channel)
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable88"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                client.jointocreatemap.ensure(`tempvoicechannel_${message.guild.id}_${channel.id}`, false);
                client.jointocreatemap.ensure(`owner_${message.guild.id}_${channel.id}`, false);
                if (client.jointocreatemap.get(`tempvoicechannel_${message.guild.id}_${channel.id}`)) {
                    var vc = channel;
                    let perms = vc.permissionOverwrites.cache.map(c => c);
                    let owner = false;
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].id === message.author.id && perms[i].allow.toArray().includes("MANAGE_CHANNELS"))
                            owner = true;
                    }
                    if (client.jointocreatemap.get(`owner_${message.guild.id}_${channel.id}`) === message.author.id)
                        owner = true;
                    if (!owner)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable89"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!args[0])
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable90"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable91"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    let member =
                        message.mentions.members.filter(member => member.guild.id == message.guild.id).first() ||
                        message.guild.members.cache.get(args[0]);
                    if (!member || member == null || member == undefined)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable92"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable93"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (!member.voice.channel)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable94"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    if (member.voice.channel.id != channel.id)
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable95"]), 256))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    try {
                        if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                            return message.reply(`${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`);
                        }
                        vc.permissionOverwrites
                            .edit(member.user.id, {
                                MANAGE_CHANNELS: true,
                                VIEW_CHANNEL: true,
                                MANAGE_ROLES: true,
                                CONNECT: true,
                            })
                            .then(l => {
                                if (!vc.permissionsFor(vc.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                    return message.reply(
                                        `${allEmojis.msg.ERROR} **Me falta el PERMISO MANAGE_CHANNEL para \`${vc.name}\`**`
                                    );
                                }
                                vc.permissionOverwrites
                                    .edit(message.author.id, {
                                        MANAGE_CHANNELS: false,
                                        VIEW_CHANNEL: true,
                                        MANAGE_ROLES: false,
                                        CONNECT: true,
                                    })
                                    .then(lol => {
                                        client.jointocreatemap.set(`owner_${vc.guild.id}_${vc.id}`, member.user.id);
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
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
                                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable96"]), 256))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    });
                            });
                    } catch (e) {
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable97"]), 256))
                                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable98"]), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    }
                } else {
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable99"]), 256))
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                }
            } else {
                return message.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable100"]), 256))
                            .setColor(es.color)
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : null
                            )
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable101"]), 4096))
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
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
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["voice"]["voice"]["variable102"]), 4096)),
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
