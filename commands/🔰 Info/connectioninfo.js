const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { GetUser, GetGlobalUser, handlemsg } = require(`${process.cwd()}/handlers/functions`);
const fetch = require("node-fetch");
module.exports = {
    name: "connectioninfo",
    aliases: ["coinfo"],
    category: "🔰 Info",
    description: "Get Information of your Connection",
    usage: "connectioninfo",
    type: "user",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");

        try {
            var user;
            if (args[0]) {
                try {
                    if (args[1] && args[1].toLowerCase() == "global") {
                        args.pop();
                        user = await GetGlobalUser(message, args);
                    } else {
                        user = await GetUser(message, args);
                    }
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                    return message.reply(client.la[ls].common.usernotfound);
                }
            } else {
                user = message.author;
            }
            let member =
                message.guild.members.cache.get(user.id) ||
                (await message.guild.members.fetch(user.id).catch(() => {})) ||
                false;

            if (!member) return message.reply("❌ **This Usuario is not a Miembro of this Guild!**");
            if (!member.voice || !member.voice.channel)
                return message.reply("❌ **This Usuario is not Conectado to a Voicechannel!**");

            const embed = new Discord.EmbedBuilder()
                .setTitle(`Connection Información of: \`${user.username}\``)
                .addFields({ name: "<:arrow:832598861813776394> **Channel**", value: `> **${member.voice.channel.name}** ${member.voice.channel}`, inline: true })
                .addFields({ name: "<:arrow:832598861813776394> **Channel-ID**", value: `> \`${member.voice.channel.id}\``, inline: true })
                .addFields({ name: "<:arrow:832598861813776394> **Members in there**", value: `> \`${member.voice.channel.members.size} total Members\``, inline: true })
                .addFields({ name: "<:arrow:832598861813776394> **Full Channel?**", value: `> ${member.voice.channel.full ? "✅" : "❌"}`, inline: true })
                .addFields({ name: "<:arrow:832598861813776394> **Bitrate**", value: `> ${member.voice.channel.bitrate}`, inline: true })
                .addFields({ name: "<:arrow:832598861813776394> **User join limit**", value: `> \`${member.voice.channel.userLimit != 0 ? member.voice.channel.userLimit : "No limit!"}\``, inline: true });

            message.reply({
                embeds: [embed],
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["info"]["color"]["variable2"])),
                ],
            });
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
