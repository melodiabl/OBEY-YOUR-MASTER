const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
﻿const Discord = require("discord.js");
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const canvacord = require("canvacord");
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const request = require("request");
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
module.exports = {
    name: "disability",
    aliases: [""],
    category: "Fun",
    description: "COMANDO DE IMAGEN",
    usage: "disability @Usuario",
    type: "user",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!client.settings.get(message.guild.id, "FUN")) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(client.la[ls].common.disabled.title)
                        .setDescription(
                            require(`${process.cwd()}/handlers/functions`).handlemsg(
                                client.la[ls].common.disabled.description,
                                { prefix: prefix }
                            )
                        ),
                ],
            });
        }
        //send loading message
        var tempmsg = await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(ee.color)
                    .setAuthor(obeyMeta.asAuthor({ name: "Obteniendo datos de imagen...", iconURL: obeyUi.image("motion.cargando") })),
            ],
        });
        //find the USER
        let user = message.mentions.users.first();
        if (!user && args[0] && args[0].length == 18) {
            let tmp = await client.users.fetch(args[0]).catch(() => {});
            if (tmp) user = tmp;
            if (!tmp) return message.reply({ content: eval(client.la[ls]["cmds"]["fun"]["disability"]["variable2"]) });
        } else if (!user && args[0]) {
            let alluser = message.guild.members.cache.map(member => String(member.user.username).toLowerCase());
            user = alluser.find(user => user.includes(args[0].toLowerCase()));
            user = message.guild.members.cache.find(me => me.user.username.toLowerCase() == user).user;
            if (!user || user == null || !user.id)
                return message.reply({ content: eval(client.la[ls]["cmds"]["fun"]["disability"]["variable3"]) });
        } else {
            user = message.mentions.users.first() || message.author;
        }
        //get avatar of the user
        var avatar = user.displayAvatarURL();
        //get the memer image
        client.memer.disability(avatar).then(image => {
            //make an attachment
            var attachment = new AttachmentBuilder(image, { name: "disability.png" });
            //delete old message
            tempmsg.delete();
            //send new Message
            message
                .reply({
                    embeds: [
                        tempmsg.embeds[0]
                            .setAuthor(obeyMeta.asAuthor({ name: `Meme para: ${user.username}`, iconURL: avatar }))
                            .setColor(es.color)
                            .setImage("attachment://disability.png"),
                    ],
                    files: [attachment],
                })
                .catch(() => {});
        });
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
