//Import npm modules
const Discord = require("discord.js");
const FormData = require("form-data");
const axios = require("axios");
//require functions from files
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
//Create Variables
let invitemessage = "\u200b";

const { renderLeaveCard: _generateCard } = require('./cards');
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
            invitemessage = `Was Invited by ${invitedby && invitedby.tag ? `**${invitedby.tag}**` : `<@${leftInviterData.id}>`}\n<:Like:857334024087011378> **${realinvites} Invite${realinvites == 1 ? "" : "s"}**\n[<:joines:866356465299488809> ${invites} Joins | <:leaves:866356598356049930> ${leaves} Leaves | <:no:833101993668771842> ${fake} Fakes]`;
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
                .setFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    )
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
                .setFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    )
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
                .setFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    )
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
                .setFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    )
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
                    .setFooter(client.getFooter(
                            "Good bye: " + member.user.id,
                            member.user.displayAvatarURL()
                        )
                    )
                    .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable5"]))
                    .setDescription(
                        (client.settings.get(member.guild.id, "leave.dm_msg") || "{user} left this Server").replace("{user}", `${member.user}`)
                    );
                if (client.settings.get(member.guild.id, "leave.invitedm")) leaveembed.addFields({ name: "\u200b", value: invitemessage });

                const buf = await _generateCard({
                    member,
                    guild: member.guild,
                    accentColor: (client.settings.get(member.guild.id, "leave.framecolordm") || "#5865F2").replace("WHITE", "#FFFFF9").replace("#FFFFFF", "#FFFFF9"),
                    showAvatar: client.settings.get(member.guild.id, "leave.pbdm") || false,
                    showDiscriminator: client.settings.get(member.guild.id, "leave.discriminatordm") || false,
                    showMemberCount: client.settings.get(member.guild.id, "leave.membercountdm") || false,
                    showServerName: client.settings.get(member.guild.id, "leave.servernamedm") || false,
                    background: client.settings.get(member.guild.id, "leave.backgrounddm"),
                    isLeave: true,
                });

                //send DM leave card (axios: bypass undici UND_ERR_SOCKET on file uploads)
                try {
                    leaveembed.setImage('attachment://leave-image.png');
                    const dmRes = await axios.post(
                        'https://discord.com/api/v10/users/@me/channels',
                        { recipient_id: member.user.id },
                        { headers: { 'Content-Type': 'application/json', Authorization: `Bot ${client.token}` } }
                    );
                    const form = new FormData();
                    form.append('files[0]', buf, { filename: 'leave-image.png', contentType: 'image/png' });
                    form.append('payload_json', JSON.stringify({
                        embeds: [leaveembed.toJSON()],
                        attachments: [{ id: 0, filename: 'leave-image.png' }],
                    }));
                    await axios.post(
                        `https://discord.com/api/v10/channels/${dmRes.data.id}/messages`,
                        form,
                        { headers: { ...form.getHeaders(), Authorization: `Bot ${client.token}` } }
                    );
                } catch {}
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
                    .setFooter(client.getFooter(
                            "Good bye: " + member.user.id,
                            member.user.displayAvatarURL()
                        )
                    )
                    .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable6"]))
                    .setDescription((client.settings.get(member.guild.id, "leave.msg") || "{user} left this Server").replace("{user}", `${member.user}`));
                if (client.settings.get(member.guild.id, "leave.invite")) leaveembed.addFields({ name: "\u200b", value: invitemessage });

                const buf = await _generateCard({
                    member,
                    guild: member.guild,
                    accentColor: (client.settings.get(member.guild.id, "leave.framecolor") || "#5865F2").replace("WHITE", "#FFFFF9").replace("#FFFFFF", "#FFFFF9"),
                    showAvatar: client.settings.get(member.guild.id, "leave.pb") || false,
                    showDiscriminator: client.settings.get(member.guild.id, "leave.discriminator") || false,
                    showMemberCount: client.settings.get(member.guild.id, "leave.membercount") || false,
                    showServerName: client.settings.get(member.guild.id, "leave.servername") || false,
                    background: client.settings.get(member.guild.id, "leave.background"),
                    isLeave: true,
                });

                //send leave card (axios: bypass undici UND_ERR_SOCKET on file uploads)
                leaveembed.setImage('attachment://leave-image.png');
                const form = new FormData();
                form.append('files[0]', buf, { filename: 'leave-image.png', contentType: 'image/png' });
                form.append('payload_json', JSON.stringify({
                    embeds: [leaveembed.toJSON()],
                    attachments: [{ id: 0, filename: 'leave-image.png' }],
                }));
                axios.post(
                    `https://discord.com/api/v10/channels/${channel.id}/messages`,
                    form,
                    { headers: { ...form.getHeaders(), Authorization: `Bot ${client.token}` } }
                ).catch(() => {});
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
