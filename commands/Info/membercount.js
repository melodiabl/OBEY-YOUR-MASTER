const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const moment = require("moment");
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "membercount",
    aliases: ["members"],
    category: "Info",
    description: "Shows how many Members there are in this Servidor",
    usage: "membercount",
    type: "server",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            await message.guild.members.fetch().catch(() => {});

            message.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setAuthor(obeyMeta.asAuthor({ name: client.la[ls].cmds.info.membercount.title + " " + message.guild.name, iconURL: message.guild.iconURL(), url: "https://discord.com/api/oauth2/authorize?client_id=734513783338434591&permissions=8&scope=bot%20applications.commands" }))
                        .setColor(es.color)
                        .addFields({ name: client.la[ls].cmds.info.membercount.field1, value: obeyUi.owned("😀 `") + message.guild.memberCount + "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field2, value: obeyUi.owned("👤 `") + message.guild.members.cache.filter(member => !member.user.bot).size + "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field3, value: obeyUi.owned("🤖 `") + message.guild.members.cache.filter(member => member.user.bot).size + "`", inline: true })

                        .addFields({ name: client.la[ls].cmds.info.membercount.field4, value: obeyUi.owned("🟢 `") +
                                message.guild.members.cache.filter(
                                    member => member.presence && member.presence && member.presence.status != "offline"
                                ).size +
                                "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field4, value: obeyUi.owned("🟢 `") +
                                message.guild.members.cache.filter(
                                    member =>
                                        !member.user.bot &&
                                        member.presence &&
                                        member.presence &&
                                        member.presence.status != "offline"
                                ).size +
                                "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field4, value: obeyUi.owned("🟢 `") +
                                message.guild.members.cache.filter(
                                    member =>
                                        member.user.bot &&
                                        member.presence &&
                                        member.presence &&
                                        member.presence.status != "offline"
                                ).size +
                                "`", inline: true })

                        .addFields({ name: client.la[ls].cmds.info.membercount.field5, value: obeyUi.owned("🟠 `") +
                                message.guild.members.cache.filter(
                                    member => member.presence && member.presence && member.presence.status == "idle"
                                ).size +
                                "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field5, value: obeyUi.owned("🟠 `") +
                                message.guild.members.cache.filter(
                                    member =>
                                        !member.user.bot &&
                                        member.presence &&
                                        member.presence &&
                                        member.presence.status == "idle"
                                ).size +
                                "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field5, value: obeyUi.owned("🟠 `") +
                                message.guild.members.cache.filter(
                                    member =>
                                        member.user.bot &&
                                        member.presence &&
                                        member.presence &&
                                        member.presence.status == "idle"
                                ).size +
                                "`", inline: true })

                        .addFields({ name: client.la[ls].cmds.info.membercount.field6, value: obeyUi.owned("🔴 `") +
                                message.guild.members.cache.filter(
                                    member => member.presence && member.presence && member.presence.status == "dnd"
                                ).size +
                                "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field6, value: obeyUi.owned("🔴 `") +
                                message.guild.members.cache.filter(
                                    member =>
                                        !member.user.bot &&
                                        member.presence &&
                                        member.presence &&
                                        member.presence.status == "dnd"
                                ).size +
                                "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field6, value: obeyUi.owned("🔴 `") +
                                message.guild.members.cache.filter(
                                    member =>
                                        member.user.bot &&
                                        member.presence &&
                                        member.presence &&
                                        member.presence.status == "dnd"
                                ).size +
                                "`", inline: true })

                        .addFields({ name: client.la[ls].cmds.info.membercount.field7, value: ":black_circle:`" +
                                message.guild.members.cache.filter(
                                    member => !member.presence || (member.presence && member.presence.status == "offline")
                                ).size +
                                "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field7, value: ":black_circle:`" +
                                message.guild.members.cache.filter(
                                    member =>
                                        !member.user.bot &&
                                        (!member.presence || (member.presence && member.presence.status == "offline"))
                                ).size +
                                "`", inline: true })
                        .addFields({ name: client.la[ls].cmds.info.membercount.field7, value: ":black_circle:`" +
                                message.guild.members.cache.filter(
                                    member =>
                                        member.user.bot &&
                                        (!member.presence || (member.presence && member.presence.status == "offline"))
                                ).size +
                                "`", inline: true })
                        .setTimestamp(),
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["info"]["color"]["variable2"]), 4096)),
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
