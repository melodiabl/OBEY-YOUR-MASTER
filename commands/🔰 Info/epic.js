const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { GetUser, GetGlobalUser, handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "epic",
    aliases: ["epicinfo"],
    category: "🔰 Info",
    description: "Get the Epic Information About the Usuario",
    usage: "epic [@USER]",
    type: "user",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            client.epicgamesDB.ensure(message.guild.id, {
                logChannel: "",
                verifychannel: "",
            });
            let serverdata = client.epicgamesDB.get(message.guild.id);
            if (!serverdata.verifychannel || serverdata.verifychannel.length < 5)
                return message.reply(
                    `:not: Verification System not setupped! An Admin can enable it via: \`${prefix}setup-epicgamesverify\``
                );

            //"HELLO"
            var user;
            let customavatar = false;
            try {
                if (args[1] && args[1].toLowerCase() == "global") {
                    args.pop();
                    user = await GetGlobalUser(message, args);
                } else {
                    user = await GetUser(message, args);
                }
            } catch (e) {
                return message.reply({
                    content: String("```" + e.message ? String(e.message).substring(0, 1900) : String(e) + "```"),
                });
            }
            if (!user) user = message.author;
            client.epicgamesDB.ensure(user.id, {
                epic: "",
                user: user.id,
                guild: message.guild.id,
                Platform: "",
                InputMethod: "",
            });
            let data = client.epicgamesDB.get(user.id);
            if (!data.epic || data.epic.length < 5)
                return message.reply(`❌ **${user.username}** did not verify/connect their Epic Games Account`);
            message
                .reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(es.color)
                            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
                            .setTitle(`Epic Games Account!`)
                            .addFields({ name: "**Epic Games Name:**", value: `\`\`\`${data.epic}\`\`\`` })
                            .addFields({ name: "**Platform:**", value: `\`\`\`${data.Platform}\`\`\`` })
                            .addFields({ name: "**Input Method:**", value: `\`\`\`${data.InputMethod}\`\`\`` })
                            .setFooter({ text: "ID: " + user.id, iconURL: user.displayAvatarURL() }),
                    ],
                })
                .catch(() => {});
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
