const obeyMeta = require("./presentation/metadata")
const obeyUi = require("./assets/system")
const { registry } = require('./assets/registry')
const { t, localeFor } = require('./i18n')
const { voteEmoji, updateVoteEmbed, voteButtons } = require('./suggestions/presentation')
const { Client, Collection, EmbedBuilder, AttachmentBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require(`discord.js`);
const { allEmojis } = require("../botconfig/emojiFunctions");
const ee = require(`${process.cwd()}/botconfig/embed.json`);
module.exports = client => {
    client.on("messageCreate", async message => {
        if (message.author.bot) return;
        if (!message.guild) return;

        //////////////////////////////////////////
        //////////////////////////////////////////
        /////////////FEEDBACK SYSTEM//////////////
        //////////////////////////////////////////
        //////////////////////////////////////////
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
        let settings = client.settings.get(message.guild.id, "suggest") || {
            channel: "", approveemoji: "✅", denyemoji: "❌",
            footertext: "Vote on this suggestion!", statustext: "Waiting for votes...",
        };
        var approveemoji = settings.approveemoji;
        var denyemoji = settings.denyemoji;
        var footertext = settings.footertext;
        var statustext = settings.statustext;
        var feedbackchannel = settings.channel;
        const locale = localeFor(client, message.guild.id)
        let allbuttons = [voteButtons(settings, {}, locale)];
        let allbuttonsSave = [voteButtons({}, {}, locale)];
        if (!feedbackchannel) return;
        if (message.channel.id === feedbackchannel) {
            try {
                message.delete({ timeout: 500 }).catch(e => {
                    console.log(String(e).grey);
                });
            } catch (e) {
                console.log(String(e).grey);
            }
            client.settings.ensure(message.guild.id, {
                embed: {
                    color: ee.color,
                },
            });
            var es = client.settings.get(message.guild.id, `embed`);
            var url = ``;
            var imagename = `Unknown`;
            var embed = new EmbedBuilder()
                .setThumbnail(message.member.user.displayAvatarURL())
                .addFields({ name: `:thumbsup: **__Up Votes__**`, value: `**\`\`\`0 Votes\`\`\`**`, inline: true })
                .addFields({ name: `:thumbsdown: **__Down Votes__**`, value: `**\`\`\`0 Votes\`\`\`**`, inline: true })
                .setColor(es.color)
                .setAuthor(
                    obeyMeta.asAuthor(client.getAuthor(
                        message.author.username + "' Suggestion",
                        message.member.user.displayAvatarURL(),
                        `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`
                    ))
                )
                .setDescription(obeyUi.limit("\n" + message.content + "\n", 4096))
                .setFooter(obeyMeta.asFooter(client.getFooter(footertext, message.guild.iconURL())));
            embed = updateVoteEmbed(embed, {}, locale);
            //.addFields({ name: `Status`, value: `REASON` })
            if (message.content) {
                embed.setDescription(obeyUi.limit(">>> " + message.content, 4096));
            }
            //add images if added (no videos possible)
            if (message.attachments.size > 0) {
                if (message.attachments.every(attachIsImage)) {
                    embed.setImage(message.attachments.first().attachment);
                }
            }
            //if no content and no image, return and dont continue
            if (!message.content && message.attachments.size <= 0) return;

            function attachIsImage(msgAttach) {
                url = msgAttach.url;
                imagename = msgAttach.name || `Unknown`;
                return (
                    url.indexOf(`png`, url.length - 3) !== -1 ||
                    url.indexOf(`jpeg`, url.length - 4) !== -1 ||
                    url.indexOf(`gif`, url.length - 3) !== -1 ||
                    url.indexOf(`jpg`, url.length - 3) !== -1
                );
            }
            message.channel
                .send({
                    embeds: [embed],
                    components: allbuttons,
                })
                .then(msg => {
                    //ste suggestions Data
                    client.settings.set(msg.id, {
                        upvotes: 0,
                        downvotes: 0,
                        user: message.author.id,
                        voted_ppl: [],
                        downvoted_ppl: [],
                    });
                })
                .catch(e => {
                    console.log(String(e).grey);
                    message.channel
                        .send({
                            embeds: [embed],
                            components: allbuttonsSave,
                        })
                        .then(msg => {
                            //ste suggestions Data
                            client.settings.set(msg.id, {
                                upvotes: 0,
                                downvotes: 0,
                                user: message.author.id,
                                voted_ppl: [],
                                downvoted_ppl: [],
                            });
                        })
                        .catch(e => {
                            console.log(String(e).grey);
                        });
                });
        }

        function attachIsImage(msgAttach) {
            url = msgAttach.url;
            imagename = msgAttach.name || `Unknown`;
            return (
                url.indexOf(`png`, url.length - `png`.length /*or 3*/) !== -1 ||
                url.indexOf(`jpeg`, url.length - `jpeg`.length /*or 3*/) !== -1 ||
                url.indexOf(`gif`, url.length - `gif`.length /*or 3*/) !== -1 ||
                url.indexOf(`jpg`, url.length - `jpg`.length /*or 3*/) !== -1
            );
        }
    });
    //Event for the Mod Log & Suggestions System
    client.on("interactionCreate", async button => {
        if (!button?.inGuild() || !button?.isButton()) return;
        if (!button?.message.guild || !button?.message.guild.available || !button?.message.channel) return;
        if (button?.message.author.id != client.user.id) return;
        let guild = button?.message.guild;
        let channel = button?.message.channel;
        if (['Suggest_upvote','Suggest_downvote','Suggest_who'].includes(button?.customId)) {
            const locale = localeFor(client, guild.id)
            if (client.settings.get(guild.id, "suggest.channel") !== channel.id) return;
            let SuggestionsData = client.settings.get(button?.message.id);
            if (!SuggestionsData || !Array.isArray(SuggestionsData.voted_ppl) || !button.message.embeds[0]) return button.reply({content:t(locale,'suggestions.expired'),ephemeral:true});
            if (!SuggestionsData.downvoted_ppl) {
                client.settings.set(button?.message.id, [], "downvoted_ppl");
                SuggestionsData = client.settings.get(button?.message.id);
            }
            if (button?.customId == "Suggest_upvote") {
                if (SuggestionsData.voted_ppl.includes(button?.user.id)) {
                    return button?.reply({
                        content: t(locale, 'suggestions.already'),
                        ephemeral: true,
                    });
                }
                //remove the downvote
                if (SuggestionsData.downvoted_ppl.includes(button?.user.id)) {
                    client.settings.math(button?.message.id, "-", 1, "downvotes");
                    client.settings.remove(button?.message.id, button?.user.id, "downvoted_ppl");
                }
                client.settings.math(button?.message.id, "+", 1, "upvotes");
                client.settings.push(button?.message.id, button?.user.id, "voted_ppl");
            }
            if (button?.customId == "Suggest_downvote") {
                if (SuggestionsData.downvoted_ppl.includes(button?.user.id)) {
                    return button?.reply({
                        content: t(locale, 'suggestions.already'),
                        ephemeral: true,
                    });
                }
                //remove the upvote
                if (SuggestionsData.voted_ppl.includes(button?.user.id)) {
                    client.settings.math(button?.message.id, "-", 1, "upvotes");
                    client.settings.remove(button?.message.id, button?.user.id, "voted_ppl");
                }
                client.settings.math(button?.message.id, "+", 1, "downvotes");
                client.settings.push(button?.message.id, button?.user.id, "downvoted_ppl");
            }
            if (button?.customId == "Suggest_who") {
                return button?.reply({
                    ephemeral: true,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(button?.message.embeds[0].color)
                            .setTitle(obeyUi.limit(`${obeyUi.markup("icon.help")} **Who reacted with what?** ${obeyUi.markup("icon.help")}`, 256))
                            .addFields({ name: `${SuggestionsData.upvotes} Upvotes`, value: `${SuggestionsData.voted_ppl && SuggestionsData.voted_ppl.length > 0 ? (SuggestionsData.voted_ppl.length < 20 ? SuggestionsData.voted_ppl.map(r => `<@${r}>`).join("\n") : [...SuggestionsData.voted_ppl.slice(0, 20).map(r => `<@${r}>`), `${SuggestionsData.voted_ppl.length - 20} more...`].join("\n")) : "Noone"}`.substring(
                                    0,
                                    1024
                                ), inline: true })
                            .addFields({ name: `${SuggestionsData.downvotes} Downvotes`, value: `${SuggestionsData.downvoted_ppl && SuggestionsData.downvoted_ppl.length > 0 ? (SuggestionsData.downvoted_ppl.length < 20 ? SuggestionsData.downvoted_ppl.map(r => `<@${r}>`).join("\n") : [...SuggestionsData.downvoted_ppl.slice(0, 20).map(r => `<@${r}>`), `${SuggestionsData.downvoted_ppl.length - 20} more...`].join("\n")) : "Noone"}`.substring(
                                    0,
                                    1024
                                ), inline: true }),
                    ],
                });
            }
            SuggestionsData = client.settings.get(button?.message.id);
            let embed = updateVoteEmbed(button.message.embeds[0], SuggestionsData, locale);
            let settings = client.settings.get(button?.message.guild.id, "suggest") || { approveemoji: "✅", denyemoji: "❌" };
            var approveemoji = settings.approveemoji;
            var denyemoji = settings.denyemoji;
            if (button.message.attachments.size > 0) {
                if (button.message.attachments.every(attachIsImage)) {
                    embed.setImage(button.message.attachments.first().attachment);
                }
            }
            await button.deferUpdate();
            await button?.message
                .edit({
                    embeds: [embed],
                    components: [voteButtons(settings, SuggestionsData, locale)],
                })
                .catch(e => {
                    return button?.message
                        .edit({
                            embeds: [embed],
                            components: [voteButtons({}, SuggestionsData, locale)],
                        })
                        .catch(e => {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        });
                });

            function attachIsImage(msgAttach) {
                var url = msgAttach.url;
                return (
                    url.indexOf(`png`, url.length - `png`.length /*or 3*/) !== -1 ||
                    url.indexOf(`jpeg`, url.length - `jpeg`.length /*or 3*/) !== -1 ||
                    url.indexOf(`gif`, url.length - `gif`.length /*or 3*/) !== -1 ||
                    url.indexOf(`jpg`, url.length - `jpg`.length /*or 3*/) !== -1
                );
            }
        }
    });
};
