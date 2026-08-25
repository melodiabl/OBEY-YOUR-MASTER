const Discord = require("discord.js");
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "serveravatar",
    description: "Muestra el avatar del servidor",
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
            interaction?.reply({
                ephemeral: true,
                embeds: [
                    new Discord.EmbedBuilder()
                        .setAuthor({
                            name: handlemsg(client.la[ls].cmds.info.serveravatar.author, { servername: guild.name }),
                            iconURL: guild.iconURL(),
                            url: "https://github.com/melodiabl"
                        })
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .addFields(
                            { name: "<:arrow:832598861813776394> PNG", value: `[\`LINK\`](${guild.iconURL()})`, inline: true },
                            { name: "<:arrow:832598861813776394> JPEG", value: `[\`LINK\`](${guild.iconURL()})`, inline: true },
                            { name: "<:arrow:832598861813776394> WEBP", value: `[\`LINK\`](${guild.iconURL()})`, inline: true }
                        )
                        .setURL(
                            guild.iconURL()
                        )
                        .setFooter(client.getFooter(es))
                        .setImage(
                            guild.iconURL({
                                size: 256,
                            })
                        ),
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
