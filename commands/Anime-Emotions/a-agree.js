const obeyMeta = require("../../handlers/presentation/metadata")
const Discord = require("discord.js");
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const canvacord = require("canvacord");
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const anime = require("anime-actions");
module.exports = {
    name: "a-agress",
    aliases: ["aagress", "animeagress", "anime-agress"],
    category: "Anime-Emotions",
    description: "Shows an Emotion-Expression in an Anime style",
    usage: "a-agress",
    type: "self",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!client.settings.get(message.guild.id, "ANIME")) {
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
        //send new Message
        message
            .reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.color)
                        .setImage(await anime.yes())
                        .setAuthor(obeyMeta.asAuthor({ name: `${message.author.username} agrees...`, iconURL: message.author.displayAvatarURL() })),
                ],
            })
            .catch(() => {});
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
