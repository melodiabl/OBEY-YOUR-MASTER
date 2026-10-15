const obeyMeta = require("./presentation/metadata")
const obeyUi = require("./assets/system")
//Import npm modules
const Discord = require("discord.js");
//require functions from files
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
//Create Variables
let invitemessage = "\u200b";

const { renderConfiguredLeaveCard } = require('./cards');
const { sendMembershipCard } = require('./card-delivery');
const { membershipTitle } = require('./membership-title');
//Start the module
module.exports = client => {
    client.on("guildMemberRemove", async member => {
        if (!member.guild || member.user.bot) return; //if not finished yet return
        const guildSettings = client.settings.get(member.guild.id) || {};
        let ls = guildSettings.language && client.la[guildSettings.language] ? guildSettings.language : 'es';
        let es = guildSettings.embed || { color: '#fffff9', wrongcolor: '#e01e01', thumb: false, footertext: '', footericon: '' };
        // Fetch guild and member data from the db
        EnsureInviteDB(member.guild, member.user);

        let memberData = client.invitesdb.get(member.guild.id + member.id);
        if (!memberData) memberData = { joinData: { type: "unknown", invite: null } };
        if (!memberData.joinData) {
            memberData.joinData = {
                type: "unknown",
                invite: null,
            };
        }
        const leftInviterData = client.invitesdb.find(
            v => v.guildId == member.guild.id && v.invited && Array.isArray(v.invited) && v.invited.includes(member.id)
        );
        const leftInviterDataKey = leftInviterData ? member.guild.id + leftInviterData.id : null;
        // If the member was a rejoin, remove it from whom invited him before
        if (leftInviterData) {
            //make sure that the inviter Data is an array
            if (!leftInviterData.left || !Array.isArray(leftInviterData.left)) {
                leftInviterData.left = [];
            }
            if (!leftInviterData.invited || !Array.isArray(leftInviterData.invited)) {
                leftInviterData.invited = [];
            }
            // It is removed from the invited members // inviterData
            if (!leftInviterData.left.includes(member.id)) leftInviterData.left.push(member.id);
            //add a leave
            leftInviterData.leaves++;
            //Setting it back to 0 if its less then 0
            client.invitesdb.set(leftInviterDataKey, leftInviterData);
            let { invites, fake, leaves } = client.invitesdb.get(leftInviterDataKey);
            if (fake < 0) fake *= -1;
            if (leaves < 0) leaves *= -1;
            if (invites < 0) invites *= -1;
            let realinvites = invites - fake - leaves;
            let invitedby =
                member.guild.members.cache.get(leftInviterData.id) ||
                (await member.guild.members.fetch(leftInviterData.id).catch(() => {})) ||
                false;
            invitemessage = `Was Invited by ${invitedby && invitedby.tag ? `**${invitedby.tag}**` : `<@${leftInviterData.id}>`}\n${obeyUi.markup("icon.like")} **${realinvites} Invite${realinvites == 1 ? "" : "s"}**\n[${obeyUi.markup("icon.join")} ${invites} Joins | ${obeyUi.markup("icon.leaf")} ${leaves} Leaves | ${obeyUi.markup("icon.error")} ${fake} Fakes]`;
        } else {
            if (memberData.joinData.type == "vanity") {
                try {
                    let res = await member.guild.fetchVanityData().catch(() => {});
                    if (res) {
                        invitemessage = `Invited by a **[Vanity URL](https://discord.gg/${res.code})** with \`${res.uses} Uses\``;
                    } else {
                        invitemessage = `Invited by a **Vanity Link!**`;
                    }
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                    invitemessage = `Invited by a **Vanity Link!**`;
                }
            } else {
                invitemessage = `Invited by an **unkown Member!**`;
            }
        }
        message(member);
    });

    async function message(member) {
        let ls = client.settings.get(member.guild.id, "language");
        let es = client.settings.get(member.guild.id, "embed");
        let leave = client.settings.get(member.guild.id, "leave");
        if (leave && leave.channel !== "nochannel") {
            if (leave.image) {
                if (leave.dm) {
                    if (leave.customdm === "no") dm_msg_autoimg(member);
                    else dm_msg_withimg(member);
                }
                if (leave.custom === "no") msg_autoimg(member);
                else msg_withimg(member);
            } else {
                if (leave.dm) {
                    dm_msg_withoutimg(member);
                }
                msg_withoutimg(member);
            }
        }

        async function msg_withoutimg(member) {
            let leavechannel = client.settings.get(member.guild.id, "leave.channel");
            if (!leavechannel) return;
            let channel = await client.channels.fetch(leavechannel).catch(() => {});
            if (!channel) return;

            //define the leave embed
            const leaveembed = new Discord.EmbedBuilder()
                .setColor(es.wrongcolor)
                .setThumbnail(
                    es.thumb
                        ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                        : undefined
                )
                .setTimestamp()
                .setFooter(obeyMeta.asFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    ))
                )
                .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable1"]))
                .setDescription((client.settings.get(member.guild.id, "leave.msg") || "{user} left this Server").replace("{user}", `${member.user}`));
            if (client.settings.get(member.guild.id, "leave.invite")) leaveembed.addFields({ name: "\u200b", value: invitemessage });
            //send the leave embed to there
            channel
                .send({
                    embeds: [leaveembed],
                })
                .catch(e => console.log("This catch prevents a crash"));
        }
        async function dm_msg_withoutimg(member) {
            //define the leave embed
            const leaveembed = new Discord.EmbedBuilder()
                .setColor(es.wrongcolor)
                .setThumbnail(
                    es.thumb
                        ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                        : undefined
                )
                .setTimestamp()
                .setFooter(obeyMeta.asFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    ))
                )
                .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable2"]))
                .setDescription((client.settings.get(member.guild.id, "leave.dm_msg") || "{user} left this Server").replace("{user}", `${member.user}`));
            if (client.settings.get(member.guild.id, "leave.invitedm")) leaveembed.addFields({ name: "\u200b", value: invitemessage });
            //send the leave embed to there
            member.user
                .send({
                    embeds: [leaveembed],
                })
                .catch(e => console.log("This catch prevents a crash"));
        }

        async function dm_msg_withimg(member) {
            //define the leave embed
            const leaveembed = new Discord.EmbedBuilder()
                .setColor(es.wrongcolor)
                .setThumbnail(
                    es.thumb
                        ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                        : undefined
                )
                .setTimestamp()
                .setFooter(obeyMeta.asFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    ))
                )
                .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable3"]))
                .setDescription((client.settings.get(member.guild.id, "leave.dm_msg") || "{user} left this Server").replace("{user}", `${member.user}`))
                .setImage(client.settings.get(member.guild.id, "leave.customdm"));
            if (client.settings.get(member.guild.id, "leave.invitedm")) leaveembed.addFields({ name: "\u200b", value: invitemessage });
            //send the leave embed to there
            member.user
                .send({
                    embeds: [leaveembed],
                })
                .catch(e => console.log("This catch prevents a crash"));
        }
        async function msg_withimg(member) {
            let leavechannel = client.settings.get(member.guild.id, "leave.channel");
            if (!leavechannel) return;
            let channel = await client.channels.fetch(leavechannel).catch(() => {});
            if (!channel) return;

            //define the leave embed
            const leaveembed = new Discord.EmbedBuilder()
                .setColor(es.wrongcolor)
                .setThumbnail(
                    es.thumb
                        ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                        : undefined
                )
                .setTimestamp()
                .setFooter(obeyMeta.asFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    ))
                )
                .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable4"]))
                .setDescription((client.settings.get(member.guild.id, "leave.msg") || "{user} left this Server").replace("{user}", `${member.user}`))
                .setImage(client.settings.get(member.guild.id, "leave.custom"));
            if (client.settings.get(member.guild.id, "leave.invite")) leaveembed.addFields({ name: "\u200b", value: invitemessage });
            //send the leave embed to there
            channel
                .send({
                    embeds: [leaveembed],
                })
                .catch(e => console.log("This catch prevents a crash"));
        }

        async function dm_msg_autoimg(member) {
            try {
                //define the leave embed
                const leaveembed = new Discord.EmbedBuilder()
                    .setColor(es.wrongcolor)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : undefined
                    )
                    .setTimestamp()
                    .setFooter(obeyMeta.asFooter(client.getFooter(
                            "Good bye: " + member.user.id,
                            member.user.displayAvatarURL()
                        ))
                    )
                    .setTitle(membershipTitle(client, ls, 'leave', member, 'variable5'))
                    .setDescription(
                        (client.settings.get(member.guild.id, "leave.dm_msg") || "{user} left this Server").replace("{user}", `${member.user}`)
                    );
                if (client.settings.get(member.guild.id, "leave.invitedm")) leaveembed.addFields({ name: "\u200b", value: invitemessage });

                await sendMembershipCard({ client, recipientId: member.user.id, embed: leaveembed, kind: 'leave',
                    render: () => renderConfiguredLeaveCard(client.settings, member, { dm: true }),
                });
                //member roles add on leave every single role
            } catch {}
        }
        async function msg_autoimg(member) {
            try {
                let leavechannel = client.settings.get(member.guild.id, "leave.channel");
                if (!leavechannel) return;
                let channel = await client.channels.fetch(leavechannel).catch(() => {});
                if (!channel) return;
                //define the leave embed
                const leaveembed = new Discord.EmbedBuilder()
                    .setColor(es.wrongcolor)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : undefined
                    )
                    .setTimestamp()
                    .setFooter(obeyMeta.asFooter(client.getFooter(
                            "Good bye: " + member.user.id,
                            member.user.displayAvatarURL()
                        ))
                    )
                    .setTitle(membershipTitle(client, ls, 'leave', member, 'variable6'))
                    .setDescription((client.settings.get(member.guild.id, "leave.msg") || "{user} left this Server").replace("{user}", `${member.user}`));
                if (client.settings.get(member.guild.id, "leave.invite")) leaveembed.addFields({ name: "\u200b", value: invitemessage });

                await sendMembershipCard({ client, channel, guildId: member.guild.id, embed: leaveembed, kind: 'leave',
                    render: () => renderConfiguredLeaveCard(client.settings, member),
                });
                //member roles add on leave every single role
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
            }
        }
    }
    function EnsureInviteDB(guild, user) {
        client.invitesdb.ensure(guild.id + user.id, {
            /* REQUIRED */
            id: user.id, // Discord ID of the user
            guildId: guild.id,
            /* STATS */
            fake: 0,
            leaves: 0,
            invites: 0,
            /* INVITES DATA */
            invited: [],
            left: [],
            /* INVITER */
            joinData: {
                type: "unknown",
                invite: null,
            }, // { type: "normal" || "unknown" || "vanity", invite: inviteData || null }
            messagesCount: 0,
            /* BOT */
            bot: user.bot,
        });
    }
};
