const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { swap_pages } = require(`${process.cwd()}/handlers/functions`);
const moment = require("moment");
module.exports = {
    name: "quotes",
    aliases: ["quos", "quote"],
    category: "🔰 Info",
    description: "Shows the Quotes which are saved on this Usuario/you",
    usage: "quotes [@USER]",
    type: "user",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            //"HELLO"
            var member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if (member) {
                args.shift();
            } else {
                member = message.member;
            }
            var { user } = member;
            client.afkDB.ensure(user.id, {
                quotes: [
                    /*
          { by: "id", text: "", image: null, at: Date.now(), }
          */
                ],
            });
            let data = client.afkDB.get(user.id, "quotes");
            data = data.sort((a, b) => a.at - b?.at);
            console.log(args[0], args[0] && !isNaN(args[0]));
            if (args[0] && !isNaN(args[0])) {
                if (
                    Number(args[0]) < 0 ||
                    Number(args[0]) > data.length - 1 ||
                    !data[Number(args[0])] ||
                    !data[Number(args[0])].text
                ) {
                    return message.reply(`❌ **No válido Quote ID!**\n> Use one between \`0\` and \`${data.length - 1}\``);
                }
                let embed = new EmbedBuilder()
                    .setColor(es.color)
                    .setFooter({ text: user.id, iconURL: user.displayAvatarURL() })
                    .addFields({ name: "**Quote by:**", value: `<@${data[Number(args[0])].by}>` })
                    .addFields({ name: "**Quote at:**", value: `\`\`\`${moment(data[Number(args[0])].at).format("DD/MM/YYYY HH:mm")}\`\`\`` })
                    .setTitle("**Quote Text:**")
                    .setDescription(`${String(data[Number(args[0])].text).substring(0, 2000)}`);
                if (data[Number(args[0])].image) {
                    embed.setImage(data[Number(args[0])].image);
                }
                return message.reply({ embeds: [embed] });
            }
            if (!data || data.length == 0)
                return message.reply({ content: "❌ **¡Este usuario no tiene citas en este servidor todavía!**" });
            var datas = data.map(
                (data, index) =>
                    `\` ${index}. \` By: <@${data.by}> | At: \`${moment(data.at).format("DD/MM/YYYY HH:mm")}\` \n> ${String(data.text).length > 80 ? String(data.text).substring(0, 75) + " ..." : String(data.text)}\n`
            );
            swap_pages(
                client,
                message,
                datas,
                `Quotes of **\`${user.username}\`** in **\`${message.guild.name}\`**\n*(Sorted after Date)*\n For more details type:\n> \`${prefix}quotes ${user.id} [ID]\``
            );
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
