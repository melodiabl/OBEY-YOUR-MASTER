const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
module.exports = {
    name: "defaultequalizer",
    category: "⚙️ Settings",
    aliases: ["default-equalizer", "defaulteq", "default-eq"],
    cooldown: 10,
    usage: "equalizer",
    description: "Toggles if it should use the Default Equalizer on 1. Pista start or not! [Default: false]",
    memberpermissions: ['Administrador'],
    type: "music",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            client.settings.ensure(message.guild.id, {
                defaulteq: false,
            });

            client.settings.set(message.guild.id, !client.settings.get(message.guild.id, "defaulteq"), "defaulteq");

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter(client.getFooter(es))
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setTitle(eval(client.la[ls]["cmds"]["settings"]["defaultequalizer"]["variable1"]))
                        .setDescription(eval(client.la[ls]["cmds"]["settings"]["defaultequalizer"]["variable2"])),
                ],
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter(client.getFooter(es))
                        .setColor(es.wrongcolor)
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["settings"]["defaultequalizer"]["variable3"])),
                ],
            });
        }
    },
};
/**
 * @INFO
 * Bot Coded by Melodia | https://github?.com/melodiabl/discord-js-lavalink-Music-Bot-erela-js
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 */
