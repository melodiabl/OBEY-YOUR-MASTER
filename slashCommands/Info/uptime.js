const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { duration } = require(`${process.cwd()}/handlers/functions`);
const moment = require("moment");
module.exports = {
    name: "uptime",
    description: "Muestra cuánto tiempo el Bot ha estado en línea",
    run: async (client, interaction, cmduser, es, ls, prefix, player, message) => {
        //things u can directly access in an interaction!
        const {
            member,
            channelId,
            guildId,
            applicationId,
            commandName,
            deferred,
            replied,
            ephemeral,
            options,
            id,
            createdTimestamp,
        } = interaction;
        const { guild } = member;

        try {
            let date = new Date();
            let timestamp = date.getTime() - Math.floor(client.uptime);
            interaction?.reply({
                ephemeral: true,
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
                        .setFooter(client.getFooter(es))
.setTitle(eval(client.la[ls]["cmds"]["info"]["uptime"]["variable1"]))
                        .setDescription(eval(client.la[ls]["cmds"]["info"]["uptime"]["variable2"]))
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["uptime"]["variablex_3"]), value: eval(client.la[ls]["cmds"]["info"]["uptime"]["variable3"]) }),
                ],
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
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
