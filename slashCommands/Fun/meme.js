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
    category: "🕹️ Fun",
    usage: `${path.parse(__filename).name} [@Usuario]`,
    type: "user",
    description: "*Image cmd in the style:* " + path.parse(__filename).name,
    run: async (client, interaction, cmduser, es, ls, prefix, player, message) => {
        if (!client.settings.get(message.guild.id, "FUN")) {
            return interaction?.reply({
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
                ephemeral: true,
            });
        }
        const data = await fetch(`https://imgur.com/r/${subreddits[Math.floor(Math.random() * subreddits.length)]}/hot.json`)
            .then(response => response.json())
            .then(body => body.data);
        const selected = data[Math.floor(Math.random() * data.length)];
        if (!selected || !selected.hash)
            return interaction?.reply({
                content: `${obeyUi.markup("icon.error")} **Could not find a new Meme...**\n> *Try again please!*`,
                ephemeral: true,
            });
        return interaction?.reply({
            content: `https://imgur.com/${selected.hash}${selected.ext.replace(/\\?.*/, "")}`,
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
