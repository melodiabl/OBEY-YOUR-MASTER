const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const Discord = require("discord.js");
const { EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { swap_pages } = require(`${process.cwd()}/handlers/functions`);
const moment = require("moment");
module.exports = {
    name: "removequote",
    aliases: ["rquote", "removequotes"],
    category: "Info",
    description: "Removes a Quote from a Usuario/you",
    usage: "removequote <@USER> <ID>",
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
            if (user.id != message.author.id) {
                if (!message.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
                    return message.reply(obeyUi.owned("❌ **Only Admins can add Quotes to other Users!**"));
                }
            }
            client.afkDB.ensure(user.id, {
                quotes: [
                    /*
          { by: "id", text: "", image: null, at: Date.now(), }
          */
                ],
            });
            let data = client.afkDB.get(user.id, "quotes");
            data = data.sort((a, b) => a.at - b?.at);
            let id = String(args[0]);
            if (!id || !isNaN(id))
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(obeyUi.owned("❌ Wrong command Usage!"), 256))
                            .setDescription(obeyUi.limit(`\`${prefix}removequote ${user.id} <QuoteId (E.G: 0 ... First Quote)>\``, 4096)),
                    ],
                });

            if (Number(id) < 0 || Number(id) > data.length - 1 || !data[Number(id)] || !data[Number(id)].text) {
                return message.reply(
                    `${obeyUi.markup("icon.error")} **No válido Quote ID!**\n> Use one between \`0\` and \`${data.length - 1}\`\nTo see all Quotes type: \`${prefix}quotes ${user.id}\``
                );
            }
            let embed = new EmbedBuilder()
                .setColor(es.color)
                .setFooter(obeyMeta.asFooter({ text: user.id, iconURL: user.displayAvatarURL() }))
                .addFields({ name: "**Quote by:**", value: `<@${data[Number(id)].by}>` })
                .addFields({ name: "**Quote at:**", value: `\`\`\`${moment(data[Number(id)].at).format("DD/MM/YYYY HH:mm")}\`\`\`` })
                .setTitle(obeyUi.limit("**Quote Text:**", 256))
                .setDescription(obeyUi.limit(`${String(data[Number(id)].text).substring(0, 2000)}`, 4096));
            if (data[Number(id)].image) {
                embed.setImage(data[Number(id)].image);
            }
            //remove the data
            data.splice(Number(id), 1);
            //set the new data
            client.afkDB.set(user.id, data, "quotes");
            //send information message
            return message.reply({
                embeds: [
                    embed,
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setTitle(obeyUi.limit(`${obeyUi.markup("icon.delete")} Removido the above showed Quoted from \`${user.username}\``, 256))
                        .setDescription(obeyUi.limit(`**${user.username}** now has **\`${data.length} Quotes\`**!`, 4096)),
                ],
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["info"]["avatar"]["variable1"]), 4096)),
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
