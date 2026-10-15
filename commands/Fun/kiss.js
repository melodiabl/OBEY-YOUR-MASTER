const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const imageEffects = require('../../handlers/image-effects');
const Discord = require("discord.js");
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const canvacord = require("canvacord");
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const request = require("request");
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const path = require("path");
module.exports = {
    name: path.parse(__filename).name,
    category: "Fun",
    usage: `${path.parse(__filename).name} <@Usuario> [@User2]`,
    type: "user",
    description: "*Comando de imagen al estilo:* " + path.parse(__filename).name,
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!client.settings.get(message.guild.id, "FUN")) {
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
            let tempmsg = await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.color)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setAuthor(obeyMeta.asAuthor({ name: "Obteniendo datos de imagen...", iconURL: obeyUi.image("motion.cargando") })),
                ],
            });
            //find the USER
            let user = message.mentions.users.first();
            if (!user && args[0] && args[0].length == 18) {
                let tmp = await client.users.fetch(args[0]).catch(() => {});
                if (tmp) user = tmp;
                if (!tmp) return message.reply({ content: eval(client.la[ls]["cmds"]["fun"]["kiss"]["variable2"]) });
            } else if (!user && args[0]) {
                let alluser = message.guild.members.cache.map(member => String(member.user.username).toLowerCase());
                user = alluser.find(user => user.includes(args[0].toLowerCase()));
                user = message.guild.members.cache.find(me => me.user.username.toLowerCase() == user).user;
                if (!user || user == null || !user.id)
                    return message.reply({ content: eval(client.la[ls]["cmds"]["fun"]["kiss"]["variable3"]) });
            } else {
                user = message.mentions.users.first() || message.author;
            }
            //find the USER
            let user2 = message.mentions.users.last();
            if (!user2 && args[1] && args[1].length == 18) {
                let tmp = await client.users.fetch(args[1]).catch(() => {});
                if (tmp) user2 = tmp;
                if (!tmp) user2 = message.author;
            } else if (!user2 && args[1]) {
                let alluser = message.guild.members.cache.map(member => String(member.user.username).toLowerCase());
                user2 = alluser.find(user => user.includes(args[1].toLowerCase()));
                user2 = message.guild.members.cache.find(me => me.user.username.toLowerCase() == user2).user;
                if (!user2 || user2 == null || !user2.id) user2 = message.author;
            } else {
                user2 = message.mentions.users.last() || message.author;
            }
            if (user.id == user2.id) {
                user2 == message.author;
            }
            if (user.id == user2.id)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(obeyUi.owned("❌ ¡Olvidaste mencionar al menos a un miembro!"), 256))
                            .setDescription(obeyUi.limit(`Usage: \`${prefix}kiss <@User1> [@User2]\``, 4096)),
                    ],
                });
            let avatar = user.displayAvatarURL({
                dynamic: false,
            });
            let avatar2 = user2.displayAvatarURL({
                dynamic: false,
            });
            let image = await imageEffects.kiss(avatar, avatar2);
            let attachment = await new Discord.AttachmentBuilder(image, "kiss.png");
            let fastembed2 = new Discord.EmbedBuilder()
                .setColor(es.color)
                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                .setImage("attachment://kiss.png");
            await message.reply({ embeds: [fastembed2], files: [attachment] });
            await tempmsg.delete().catch(() => {});
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["fun"]["kiss"]["variable4"]), 4096)),
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
