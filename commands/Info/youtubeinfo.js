const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const Discord = require("discord.js");
const { EmbedBuilder,
    ButtonStyle
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const moment = require("moment");
const { databasing, delay, getLatestVideos, channelInfo } = require("../../handlers/functions");
const { ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "youtubeinfo",
    aliases: ["ytinfo", "youtubeuserinfo", "ytuserinfo", "ytuser", "youtubeuser"],
    category: "Info",
    description: "Get information about a Youtube Canal-Link",
    usage: "youtubeinfo <YOUTUBECHANNELLINK>",
    type: "util",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let button_back = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId("1").setLabel(obeyUi.plain("<< Back"));
            let button_forward = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId("3").setLabel(obeyUi.plain("Forward >>"));
            const allbuttons = [new ActionRowBuilder().addComponents([button_back, button_forward])];
            let url = args[0];
            if (url && typeof url === "string") {
                if (url.match(/^https?:\/\/(www\.)?youtube\.com\/(channel\/UC[\w-]{21}[AQgw]|(c\/|user\/)?[\w-]+)$/) == null)
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setTitle(obeyUi.limit(client.la[ls].cmds.info.youtubeinfo.error1, 256))
                                .setTitle(obeyUi.limit(client.la[ls].cmds.info.youtubeinfo.example, 256))
                                .setDescription(
                                    obeyUi.limit(handlemsg(client.la[ls].cmds.info.youtubeinfo.example, {
                                        prefix: prefix,
                                    }), 4096)
                                ),
                        ],
                    });
            } else {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(client.la[ls].cmds.info.youtubeinfo.error1, 256))
                            .setDescription(
                                obeyUi.limit(handlemsg(client.la[ls].cmds.info.youtubeinfo.example, {
                                    prefix: prefix,
                                }), 4096)
                            ),
                    ],
                });
            }
            let tempmsg = await message.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(es.color)
                        .setAuthor(obeyMeta.asAuthor({ name: client.la[ls].cmds.info.youtubeinfo.loading, iconURL: obeyUi.image("motion.cargando"), url: "https://github.com/melodiabl" })),
                ],
            });
            let Channel = await channelInfo(url);
            let embed = new Discord.EmbedBuilder()
                .setTitle(obeyUi.limit(Canal.name, 256))
                .setURL(Channel.url)
                .setColor("#ED4245")
                .addFields({ name: client.la[ls].cmds.info.youtubeinfo.field1, value: "`" + Channel.subscribers + "`" })
                .addFields({ name: client.la[ls].cmds.info.youtubeinfo.field2, value: Channel.tags.map(t => `\`${t}\``).join(",  ") })
                .addFields({ name: client.la[ls].cmds.info.youtubeinfo.field3, value: Channel.unlisted ? obeyUi.owned("✅") : obeyUi.owned("❌"), inline: true })
                .addFields({ name: client.la[ls].cmds.info.youtubeinfo.field4, value: Channel.familySafe ? obeyUi.owned("✅") : obeyUi.owned("❌"), inline: true })
                .setFooter(obeyMeta.asFooter({ text: "ID: " + Channel.id }))
                .setImage(Channel.mobileBanner[0] ? Channel.mobileBanner[0].url : undefined)
                .setDescription(obeyUi.limit(String(Canal.description).substring(0, 1500), 4096));
            let Videos = await getLatestVideos(url);
            let embed2 = new Discord.EmbedBuilder()
                .setTitle(
                    obeyUi.limit(handlemsg(client.la[ls].cmds.info.youtubeinfo.videosof, {
                        author: Videos[0].author,
                    }), 256)
                )
                .setColor("#ED4245")
                .setURL(url);
            //For Each Video, add a new Field (just the first 10 Videos!)
            Videos.forEach((v, i) => {
                if (i < 10) {
                    embed2.addFields({ name: v.title, value: handlemsg(client.la[ls].cmds.info.youtubeinfo.videos, {
                            date: v.pubDate,
                            link: v.link,
                        }) });
                }
            });
            //Send the Message
            let pagemsg = await tempmsg.edit({
                embeds: [embed],
                components: allbuttons,
            });
            //create a collector for the thinggy
            const collector = pagemsg.createMessageComponentCollector({
                filter: i => i?.isButton() && i?.user && i?.user.id == cmduser.id && i?.message.author.id == client.user.id,
                time: 180e3,
            }); //collector for 5 seconds
            //array of all embeds, here simplified just 10 embeds with numbers 0 - 9
            var edited = false;
            var embeds = [embed, embed2];
            let currentPage = 0;
            collector.on("collect", async b => {
                if (b?.user.id !== message.author.id)
                    return b?.reply(
                        handlemsg(client.la[ls].cmds.info.youtubeinfo.error2, {
                            prefix: prefix,
                        })
                    );
                //page forward
                if (b?.customId == "1") {
                    //b?.reply("***Swapping a PAGE FORWARD***, *please wait 2 Seconds for the next Input*", true)
                    if (currentPage !== 0) {
                        await pagemsg.edit({
                            embeds: [embeds[currentPage]],
                            components: allbuttons,
                        });
                        await b?.deferUpdate();
                    } else {
                        currentPage = embeds.length - 1;
                        await pagemsg.edit({
                            embeds: [embeds[currentPage]],
                            components: allbuttons,
                        });
                        await b?.deferUpdate();
                    }
                }

                //go forward
                else if (b?.customId == "3") {
                    //b?.reply("***Swapping a PAGE BACK***, *please wait 2 Seconds for the next Input*", true)
                    if (currentPage < embeds.length - 1) {
                        currentPage++;
                        await pagemsg.edit({
                            embeds: [embeds[currentPage]],
                            components: allbuttons,
                        });
                        await b?.deferUpdate();
                    } else {
                        currentPage = 0;
                        await pagemsg.edit({
                            embeds: [embeds[currentPage]],
                            components: allbuttons,
                        });
                        await b?.deferUpdate();
                    }
                }
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
        return;
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
