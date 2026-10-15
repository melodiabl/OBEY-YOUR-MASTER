const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const fetch = require("node-fetch");
const Discord = require("discord.js");
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const canvacord = require("canvacord");
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const request = require("request");
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const subreddits = ["memes", "DeepFriedMemes", "bonehurtingjuice", "surrealmemes", "dankmemes", "meirl", "me_irl", "funny"];
const path = require("path");
module.exports = {
    name: path.parse(__filename).name,
    category: "Fun",
    usage: `${path.parse(__filename).name} [@Usuario]`,
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
            const data = await fetch(
                `https://imgur.com/r/${subreddits[Math.floor(Math.random() * subreddits.length)]}/hot.json`
            )
                .then(response => response.json())
                .then(body => body.data);
            let selected = data[Math.floor(Math.random() * data.length)];
            if (!selected) selected = data[Math.floor(Math.random() * data.length)];
            if (!selected) selected = data[Math.floor(Math.random() * data.length)];
            if (!selected) selected = data[Math.floor(Math.random() * data.length)];
            if (!selected) return message.reply(obeyUi.owned("❌ **No Meme found, please retry!**"));
            return message.reply({ content: eval(client.la[ls]["cmds"]["fun"]["meme"]["variable1"]) });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["fun"]["meme"]["variable2"]), 4096)),
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
