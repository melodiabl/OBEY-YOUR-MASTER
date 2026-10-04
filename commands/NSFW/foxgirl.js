const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const booru = require("booru");

module.exports = {
    name: "foxgirl",
    category: "NSFW",
    usage: "foxgirl",
    type: "anime",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!client.settings.get(message.guild.id, "NSFW")) {
            const x = new EmbedBuilder()
                .setColor(es.wrongcolor)
                .setFooter(client.getFooter(es))
                .setTitle(client.la[ls].common.disabled.title)
                .setDescription(
                    require(`${process.cwd()}/handlers/functions`).handlemsg(client.la[ls].common.disabled.description, {
                        prefix: prefix,
                    })
                );
            return message.reply({ embeds: [x] });
        }

        if (!message.channel.nsfw)
            return message.reply(eval(client.la[ls]["cmds"]["nsfw"]["2danal"]["variable1"])).then(msg => {
                message.react("💢");
                msg.delete({ timeout: 3000 });
            });

        try {
            const images = await booru.search("rule34", ["fox_girl"], {
                nsfw: true,
                limit: 1,
                random: true,
            });
            const image = booru.commonfy(images)[0];
            if (image) {
                message.reply({ content: `${image.common.file_url}` });
            } else {
                message.reply({ content: "No se encontró imagen de foxgirl" });
            }
        } catch (err) {
            message.reply({ content: "Error al buscar foxgirl" });
        }
    },
};
