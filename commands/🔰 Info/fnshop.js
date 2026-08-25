const Discord = require("discord.js");
// discord-canvas requiere canvas nativo incompatible con Node 22
const Canvas = null;
const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { GetUser, GetGlobalUser, handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "fnshop",
    aliases: ["fortniteshop", "fshop"],
    category: "🔰 Info",
    description: "Muestra la Tienda actual de Fortnite",
    usage: "fnshop",
    type: "games",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let themsg = await message.reply("<a:Loading:833101350623117342> Obteniendo los Datos de la Tienda");
            const shop = new Canvas.FortniteShop();
            const image = await shop
                .setToken(process.env.fnbr || config.fnbr)
                .setBackground("#23272A")
                .toAttachment();
            let attachment = new Discord.AttachmentBuilder(image, "FortniteShop.png");
            themsg.edit({ content: "Tienda de Fortnite de Hoy:", files: [attachment] }).catch(() => {});
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["info"]["avatar"]["variable1"])),
                ],
            });
        }
    },
};
/*
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 */
