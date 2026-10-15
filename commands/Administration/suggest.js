const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const { allEmojis } = require("../../botconfig/emojiFunctions");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { delay, databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `suggest`,
    aliases: [`suggestion`, "feedback"],
    category: "Administration",
    description: `Approves, Denies or even Maybies a Sugerencia from your SETUP!`,
    usage: `suggest <approve/deny/maybe/soon/duplicate> <Suggestion_id> [REASON]`,
    type: "server",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.suggest");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.suggest`);
                    }
                }
            }
            if (
                [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(message.author.id) && [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![message.guild.ownerId, config.ownerid].includes(message.author.id) &&
                !message.member.permissions.has([PermissionFlagsBits.Administrator])
            )
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable1"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable2"]), 4096)),
                    ],
                });
            let reason = `No reason`;

            client.settings.ensure(message.guild.id, {
                suggest: {
                    channel: "",
                    approvemsg: `${allEmojis.msg.SUCCESS} Accepted Idea! Expect this soon.`,
                    denymsg: `${allEmojis.msg.ERROR} Thank you for the feedback, but we are not interested in this idea at this time.`,
                    maybemsg: `${obeyUi.markup("icon.idea")} We are thinking about this idea!`,
                    duplicatemsg: `${obeyUi.markup("icon.warning")} This is a duplicated Suggestion`,
                    soonmsg: `${obeyUi.markup("icon.success")} Expect this Feature Soon!`,
                    statustext: `${allEmojis.msg.loading} Waiting for Community Feedback, please vote!`,
                    footertext: `Want to suggest / Feedback something? Simply type in this channel!`,
                    approveemoji: `${allEmojis.msg.SUCCESS}`,
                    denyemoji: `${allEmojis.msg.ERROR}`,
                },
            });
            let suggestdata = client.settings.get(message.guild.id, "suggest");
            var approvetext = suggestdata.approvemsg;
            var denytext = suggestdata.denymsg;
            var maybetext = suggestdata.maybemsg;
            var soonmsg = suggestdata.soonmsg;
            var duplicatemsg = suggestdata.duplicatemsg;
            var feedbackchannel = suggestdata.channel;

            if (!suggestdata.channel || suggestdata.channel.length < 5)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : `https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png`
                            )
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable3"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable4"]), 4096)),
                    ],
                });
            if (!args[0])
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : `https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png`
                            )
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable5"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable6"]), 4096)),
                    ],
                });
            //wenn kein grund
            if (!args[1])
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : `https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png`
                            )
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable7"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable8"]), 4096)),
                    ],
                });

            if (args[1].length !== 18)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : `https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png`
                            )
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable9"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable10"]), 4096)),
                    ],
                });
            if (!args[2]) reason = `No reason`;
            else reason = args.slice(2).join(` `);
            //finde feedbackchannel
            const channel = message.guild.channels.cache.get(feedbackchannel);
            if (!channel)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : `https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png`
                            )
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable11"]), 256))
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable12"]), 4096)),
                    ],
                });

            //finde die nachricht
            const targetMessage = await channel.messages.fetch(args[1]);
            if (!targetMessage)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : `https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png`
                            )
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable13"]), 256)),
                    ],
                });

            //altes embed
            const oldEmbed = targetMessage.embeds[0];

            if (!oldEmbed)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : `https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png`
                            )
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable14"]), 256)),
                    ],
                });

            //bekomme was er machen will
            let color;
            let statustext;

            switch (args[0]) {
                case `approve`:
                    color = `GREEN`;
                    statustext = `${approvetext}`;
                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(`GREEN`)
                                .setThumbnail(
                                    es.thumb
                                        ? es.footericon &&
                                          (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                            ? es.footericon
                                            : client.user.displayAvatarURL()
                                        : `https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png`
                                )
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable15"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable16"]), 4096)),
                        ],
                    });
                    break;

                case `deny`:
                    color = `RED`;
                    statustext = `${denytext}`;
                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(`RED`)
                                .setThumbnail(
                                    es.thumb
                                        ? es.footericon &&
                                          (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                            ? es.footericon
                                            : client.user.displayAvatarURL()
                                        : `https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png`
                                )
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable17"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable18"]), 4096)),
                        ],
                    });
                    break;

                case `maybe`:
                    color = `ORANGE`;
                    statustext = `${maybetext}`;
                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.color)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable19"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable20"]), 4096)),
                        ],
                    });
                    break;

                case `soon`:
                    color = `#FFFFF9`;
                    statustext = `${soonmsg}`;
                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.color)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable21"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable22"]), 4096)),
                        ],
                    });
                    break;

                case `duplicate`:
                    color = `BLUE`;
                    statustext = `${duplicatemsg}`;
                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.color)
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable23"]), 256))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable24"]), 4096)),
                        ],
                    });
                    break;
                default:
                    message.reply({ content: eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable25"]) });
                    break;
            }

            const embed = new EmbedBuilder()
                .setAuthor(obeyMeta.asAuthor({ name: oldEmbed.author.name, iconURL: oldEmbed.author.iconURL }))
                .setDescription(obeyUi.limit(oldEmbed.description, 4096))
                .setColor(color)
                .setFooter(obeyMeta.asFooter(client.getFooter(
                        `Want to suggest something? Simply type it in this channel`,
                        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/light-bulb_1f4a1.png"))
                );

            if (embed.fields[2]) {
                embed.fields[2].name == `<:arrow:832598861813776394> __Reason by **${message.author.username}**:__`;
                embed.fields[2].value == `>>> ${String(reason).substring(0, 1000)}`;
            } else {
                embed.addFields({ name: `${obeyUi.markup("icon.arrow-right")} __Reason by **${message.author.username}**__`, value: `>>> ${String(reason).substring(0, 1000)}` });
            }
            targetMessage.edit({ embeds: [embed] });
            try {
                let SuggestionsData = client.settings.get(targetMessage.id);
                let member = message.guild.members.cache.get(SuggestionsData.user);
                if (!member) member = await message.guild.members.fetch(SuggestionsData.user).catch(() => {});
                if (member) {
                    member.send({
                        content: `Your Sugerencia in **${message.guild.name}** got an Status Update!\n> https://discord.com/channels/${message.guild.id}/${channel.id}/${targetMessage.id}`,
                        embeds: [embed],
                    });
                }
            } catch (e) {
                console.log(String(e).grey);
            }
            if (client.settings.get(message.guild.id, `adminlog`) != "no") {
                try {
                    var channel2send = message.guild.channels.cache.get(client.settings.get(message.guild.id, `adminlog`));
                    if (!channel2send) return client.settings.set(message.guild.id, "no", `adminlog`);
                    channel2send.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.color)
                                .setThumbnail(
                                    es.thumb
                                        ? es.footericon &&
                                          (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                            ? es.footericon
                                            : client.user.displayAvatarURL()
                                        : null
                                )
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setAuthor(obeyMeta.asAuthor({ name: `${require("path").parse(__filename).name} | ${message.author.username}`, iconURL: message.author.displayAvatarURL() }))
                                .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable26"]), 4096))
                                .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable15"]) })
                                .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable16"]) })
                                .setTimestamp()
                                .setFooter(obeyMeta.asFooter(client.getFooter(
                                        "ID: " + message.author.id,
                                        message.author.displayAvatarURL()
                                    ))
                                ),
                        ],
                    });
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                }
            }
        } catch (e) {
            console.log(e.stack ? String(e.stack).grey : String(e).grey);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["administration"]["suggest"]["variable29"]), 4096)),
                ],
            });
        }
    },
};
