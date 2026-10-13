//Import npm modules
const Discord = require("discord.js");
const { ChannelType,
    PermissionFlagsBits
} = require("discord.js");
const FormData = require("form-data");
const axios = require("axios");
const { renderConfiguredWelcomeCard } = require('./cards')
// require functions from files
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const { delay, duration, simple_databasing } = require(`./functions`);
const { Captcha } = require(`captcha-canvas`); //require package here
const ms = require("ms");
//Create Variables
let invitemessage = "\u200b";

//Start the module
module.exports = client => {
    client.fetched = false;
    client.invitations = {};

    /**
     * FETCH THE INVITES OF ALL GUILDS
     */
    client.on("ready", async () => {
        for (const guild of [...client.guilds.cache.values()]) {
            let fetchedInvites = null;
            if (guild.members.me.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
                await guild.invites.fetch().catch(() => {});
            }
            fetchedInvites = await generateInvitesCache(guild.invites.cache);
            client.invitations[guild.id] = fetchedInvites;
        }
        client.fetched = true;
    });

    /**
     * FETCH THE INVITES OF THAT GUILD
     */
    client.on("guildCreate", async guild => {
        let fetchedInvites = null;
        if (guild.members.me.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
            await guild.invites.fetch().catch(() => {});
        }
        fetchedInvites = await generateInvitesCache(guild.invites.cache);
        client.invitations[guild.id] = fetchedInvites;
    });

    /**
     * Register new Created Invites
     */
    client.on("inviteCreate", invite => {
        if (!invite.guild) return;
        function SetInvite(i) {
            if (!client.fetched) {
                if (!client.invitations[invite.guild.id]) {
                    setTimeout(() => {
                        SetInvite(i);
                    }, 5_000);
                    return;
                }
            }
            client.invitations[invite.guild.id].set(invite.code, inviteToJson(invite));
        }
        SetInvite(invite);
    });
    /**
     * Handle Invite Delete Event
     */
    client.on("inviteDelete", invite => {
        if (!invite.guild) return;
        function SetInvite(i) {
            if (!client.fetched) {
                if (!client.invitations[invite.guild.id]) {
                    setTimeout(() => {
                        SetInvite(i);
                    }, 5_000);
                    return;
                }
            }
            client.invitations[invite.guild.id].delete(invite.code);
        }
        SetInvite(invite);
    });

    /**
     * if a User leaves, remove him from the db
     * Done in: ./leave.js
     */

    /**
     * WELCOMING + Register the Invites etc.
     */
    client.on("guildMemberAdd", async mem => {
        if (!mem.guild || mem.user.bot) return; //if not finished yet return
        simple_databasing(client, mem.guild.id, mem.id);
        const guildSettings = client.settings.get(mem.guild.id) || {};
        let ls = guildSettings.language && client.la[guildSettings.language] ? guildSettings.language : 'es';
        let es = guildSettings.embed || { color: '#fffff9', wrongcolor: '#e01e01', thumb: false, footertext: '', footericon: '' };
        welcome(mem);
        async function welcome(member) {
            if (!client.fetched) {
                if (client.invitations[mem.guild.id]) {
                    console.log("NOT FETCHED ALL SERVERS, but this one did");
                } else {
                    console.log("NOT FETCHED YET PLS WAIT! Retrying in 5 Seconds...");
                    setTimeout(() => {
                        welcome(member);
                    }, 5_000);
                    return;
                }
            }
            if (!client.isReady()) {
                setTimeout(() => {
                    welcome(member);
                }, 5_000); //try in 5 secs again
                return;
            }
            // Fetch guild and member data from the db
            EnsureInviteDB(member.guild, member.user);

            let memberDataKey = member.guild.id + member.id;
            let memberData = client.invitesdb.get(memberDataKey);
            /* Find who is the inviter */
            let invite = null;
            let vanity = false; //if a vanity invite
            let perm = false; //if manage guild permissions

            //if i dont exist in the guild fetch me
            if (!member.guild.members.me) {
                await member.guild.members
                    .fetch({
                        user: client.user.id,
                        cache: true,
                    })
                    .catch(() => {});
            }
            //if not allowed set perm to true
            if (!member.guild.members.me.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) perm = true;
            /**
             * @INFO
             * GET THE INVITE LINK INFORMATION
             */
            //if i am allowed to do so then start
            if (!perm) {
                // Fetch the current invites of the guild
                await member.guild.invites.fetch().catch(() => {});
                //generate an invites cache collection
                const guildInvites = generateInvitesCache(member.guild.invites.cache);
                //get the old GUild INvites
                const oldGuildInvites = client.invitations[member.guild.id];

                if (guildInvites && oldGuildInvites) {
                    // Update the cache
                    client.invitations[member.guild.id] = guildInvites;
                    // Find the invitations which doesn't have the same number of use
                    let inviteUsed = guildInvites.find(
                        i =>
                            oldGuildInvites.has(i?.code) &&
                            (oldGuildInvites.get(i?.code).uses ? oldGuildInvites.get(i?.code).uses : "Infinite") < i?.uses
                    );
                    // Special case: The invitation used was deleted shortly after the member's arrival and only
                    // before GUILD_MEMBER_ADD is output. (An invitation with a limited number of uses works like this)
                    if (!inviteUsed) {
                        oldGuildInvites
                            .map(i => i)
                            .sort((a, b) =>
                                a.deletedTimestamp && b.deletedTimestamp ? b.deletedTimestamp - a.deletedTimestamp : 0
                            )
                            .forEach(invite => {
                                if (
                                    !guildInvites.get(invite.code) &&
                                    invite.maxUses > 0 &&
                                    invite.uses === invite.maxUses - 1
                                ) {
                                    inviteUsed = invite;
                                }
                            });
                    }
                    //if it's a vanity code
                    if (
                        isEqual(
                            oldGuildInvites.map(i => `${i?.code}|${i?.uses}`).sort(),
                            guildInvites.map(i => `${i?.code}|${i?.uses}`).sort()
                        ) &&
                        !inviteUsed &&
                        member.guild.features.includes("VANITY_URL")
                    ) {
                        vanity = true;
                    }
                    if (!inviteUsed) {
                        const newAndUsed = guildInvites.filter(i => !oldGuildInvites.get(i?.code) && i?.uses >= 1);
                        if (newAndUsed.size >= 1) {
                            inviteUsed = newAndUsed.first();
                        }
                    }
                    if (inviteUsed && !vanity) invite = inviteUsed;
                } else if (guildInvites) {
                    client.invitations[member.guild.id] = guildInvites;
                }

                //if there wasn't an invite found, yet
                if (!invite && guildInvites) {
                    //try to find the inviter
                    const targetInvite = guildInvites.find(i => i?.targetUser && i?.targetUser.id === member.id);
                    if (targetInvite && targetInvite.uses === 1) {
                        invite = targetInvite;
                    }
                }
            }
            const inviter = invite && invite.inviter ? invite.inviter : null;
            //if there is an inviter, ensure the database
            if (inviter) {
                //ensure him in the database
                EnsureInviteDB(member.guild, inviter);
                //get the inviterData
                const inviterDataKey = member.guild.id + inviter.id;
                const inviterData = client.invitesdb.get(inviterDataKey);
                if (!inviterData) return;
                //make sure that the inviter Data is an array
                if (!inviterData.left || !Array.isArray(inviterData.left)) {
                    inviterData.left = [];
                }
                if (!inviterData.invited || !Array.isArray(inviterData.invited)) {
                    inviterData.invited = [];
                }
                // If the member was a rejoin, remove it from whom invited him before
                if (inviterData.left.includes(member.id)) {
                    // We`re removing a leave
                    inviterData.leaves--;
                    //Setting it back to 0 if its less then 0
                    if (inviterData.leaves < 0) inviterData.leaves = 0;
                }

                // FAKEINVITE - If the member had already invited this member before
                if (inviterData.invited.includes(member.id)) {
                    // We increase the number of fake invitations
                    inviterData.fake++;
                }
                if (!inviterData.invited.includes(member.id)) inviterData.invited.push(member.id);

                // We increase the number of regular invitations
                inviterData.invites++;
                //update the database
                client.invitesdb.set(inviterDataKey, inviterData);
            }

            /**
             * @INFO CHANGE THE MEMBERDATA TO WHOM INVITED HIM
             */
            if (invite) {
                memberData.joinData = {
                    type: "normal",
                    invite: {
                        uses: invite.uses,
                        code: invite.code,
                        inviter: inviter ? inviter.id : null,
                    },
                };
            } else if (vanity) {
                memberData.joinData = {
                    type: "vanity",
                    invite: null,
                };
            } else if (perm) {
                memberData.joinData = {
                    type: "perm",
                    invite: null,
                };
            }
            //update the database for the MEMBER
            client.invitesdb.set(memberDataKey, memberData);

            if (invite && inviter) {
                //get the new memberdata
                let { invites, fake, leaves } = client.invitesdb.get(member.guild.id + inviter.id);
                if (fake < 0) fake *= -1;
                if (leaves < 0) leaves *= -1;
                if (invites < 0) invites *= -1;
                let realinvites = invites - fake - leaves;
                invitemessage = `Invited by ${inviter.tag ? `**${inviter.tag}**` : `<@${inviter.id}>`}\n<:Like:857334024087011378> **${realinvites} Invite${realinvites == 1 ? "" : "s"}**\n[<:joines:866356465299488809> ${invites} Joins | <:leaves:866356598356049930> ${leaves} Leaves | <:no:833101993668771842> ${fake} Fakes]`;
            } else if (invite) {
                invitemessage = `Invited by an **Unknown Member**`;
            } else if (vanity) {
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
            } else if (perm) {
                //get the new memberdata
                invitemessage = `I need the **Manage Server** Permission, to fetch Invites!`;
            } else {
                invitemessage = "\u200b";
            }
            if (client.settings.get(member.guild.id, "welcome.captcha") && !member.user.bot) {
                const captcha = new Captcha();
                captcha.async = false; //Sync
                captcha.addDecoy(); //Add decoy text on captcha canvas.
                captcha.drawTrace(); //draw trace lines on captcha canvas.
                captcha.drawCaptcha(); //draw captcha text on captcha canvas
                const buffer = captcha.png; //returns buffer of the captcha image
                const attachment = new Discord.AttachmentBuilder(buffer, { name: `${captcha.text}_Captcha.png` });
                //fin a muted role
                let mutedrole = member.guild.roles.cache.find(r => r.name.toLowerCase().includes("captcha")) || false;
                //if no muted role found, create a new one
                if (!mutedrole) {
                    mutedrole = await member.guild.roles
                        .create({
                            name: `DISABLED - CAPTCHA`,
                            color: `#222222`,
                            hoist: true,
                            position: member.guild.members.me.roles.highest.position - 1,
                            reason: `This role got created, to DISABLED - CAPTCHA Members!`,
                        })
                        .catch(e => {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        });
                }
                //For each channel, not including the captcha role, change the permissions
                await mem.guild.channels.cache
                    .filter(c => c.permissionOverwrites)
                    .filter(
                        c =>
                            !c.permissionOverwrites.cache.has(mutedrole.id) ||
                            (c.permissionOverwrites.cache.has(mutedrole.id) &&
                                !c.permissionOverwrites.cache.get(mutedrole.id).deny.toArray().includes("SEND_MESSAGES")) ||
                            (c.permissionOverwrites.cache.has(mutedrole.id) &&
                                !c.permissionOverwrites.cache.get(mutedrole.id).deny.toArray().includes("ADD_REACTIONS"))
                    )
                    .forEach(async ch => {
                        try {
                            if (ch.permissionsFor(ch.guild.members.me).has(Discord.PermissionFlagsBits.ManageChannels)) {
                                await ch.permissionOverwrites
                                    .edit(mutedrole, {
                                        VIEW_CHANNEL: false,
                                        SEND_MESSAGES: false,
                                        ADD_REACTIONS: false,
                                        CONNECT: false,
                                        SPEAK: false,
                                    })
                                    .catch(() => {});
                                await delay(300);
                            }
                        } catch (e) {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        }
                    });
                //Add the role
                member.roles.add(mutedrole.id).catch(() => {});
                const captchaembed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : undefined
                    )
                    .setTimestamp()
                    .setFooter(client.getFooter(es))
                    .setTitle(eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable1"]))
                    .setDescription(eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable2"]));
                //Dm him

                member
                    .send({
                        content: `**${member.guild.name}** has a Captcha Security Option enabled!\n> Solve it first, by typing the WHOLE LETTERS of the IMAGE!`,
                        embeds: [captchaembed],
                        files: [attachment],
                    })
                    .then(msg => {
                        msg.channel
                            .awaitMessages({
                                filter: m => m.author.id === member.user.id,
                                max: 1,
                                time: 60000,
                                errors: ["time"],
                            })
                            .then(async collected => {
                                if (collected.first().content.trim().toLowerCase() == captcha.text.toLowerCase()) {
                                    //remove the role again
                                    member.roles
                                        .remove(mutedrole.id)
                                        .catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey));
                                    //Send the message to success
                                    await msg.channel
                                        .send({
                                            embeds: [
                                                msg.embeds[0]
                                                    .setDescription(
                                                        eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable3"])
                                                    )
                                                    .setImage(
                                                        "https://cdn.discordapp.com/attachments/807985610265460766/834519837782704138/success-3345091_1280.png"
                                                    ),
                                            ],
                                        })
                                        .catch(() => {});
                                    //try to delete the original message
                                    msg.delete().catch(() => {});
                                    //Do the WELCOME functions
                                    add_roles(member);
                                    message(member);
                                } else {
                                    msg.edit({
                                        embeds: [],
                                        content: `**Falló the CAPTCHA!**`,
                                    }).catch(() => {});
                                    try {
                                        //kick the member, but fetch the invites first if there is no valid invite
                                        if (
                                            member.guild.invites.cache.filter(
                                                i => i?.code && (i?.maxAge === 0 || i?.maxAge > 600)
                                            ).size < 1
                                        )
                                            await member.guild.invites.fetch().catch(() => {});
                                        //if there is a valid invite which lasts for at least 10 minutes or forever
                                        if (
                                            member.guild.invites.cache.filter(
                                                i => i?.code && (i?.maxAge === 0 || i?.maxAge > 600)
                                            ).size > 0
                                        ) {
                                            await member.send(
                                                `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${member.guild.invites.cache.filter(i => i?.code && i?.maxAge === 0).first().code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                            );
                                            member.kick("FAILED THE CAPTCHA").catch(() => {});
                                        } else {
                                            let channels = member.guild.channels.cache.filter(ch =>
                                                ch
                                                    .permissionsFor(member.guild.members.me)
                                                    .has(Discord.PermissionFlagsBits.CreateInstantInvite)
                                            );
                                            if (channels.size > 0) {
                                                member.guild.invites
                                                    .create(channels.first().id)
                                                    .create()
                                                    .then(async invite => {
                                                        await member.send(
                                                            `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${invite.code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                        );
                                                        member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                    })
                                                    .catch(async e => {
                                                        await member.user
                                                            .send(
                                                                `**OH NO - You failed the CAPTCHA!**\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                            )
                                                            .catch(() => {});
                                                        member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                    });
                                            }
                                        }
                                    } catch (E) {
                                        member.kick("FAILED THE CAPTCHA").catch(() => {});
                                    }
                                }
                            })
                            .catch(async () => {
                                msg.edit({
                                    embeds: [],
                                    content: `**Falló the CAPTCHA!**`,
                                }).catch(() => {});
                                try {
                                    //kick the member, but fetch the invites first if there is no valid invite
                                    if (
                                        member.guild.invites.cache.filter(
                                            i => i?.code && (i?.maxAge === 0 || i?.maxAge > 600)
                                        ).size < 1
                                    )
                                        await member.guild.invites.fetch().catch(() => {});
                                    //if there is a valid invite which lasts for at least 10 minutes or forever
                                    if (
                                        member.guild.invites.cache.filter(
                                            i => i?.code && (i?.maxAge === 0 || i?.maxAge > 600)
                                        ).size > 0
                                    ) {
                                        await member.send(
                                            `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${member.guild.invites.cache.filter(i => i?.code && i?.maxAge === 0).first().code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                        );
                                        member.kick("FAILED THE CAPTCHA").catch(() => {});
                                    } else {
                                        let channels = member.guild.channels.cache.filter(ch =>
                                            ch
                                                .permissionsFor(member.guild.members.me)
                                                .has(Discord.PermissionFlagsBits.CreateInstantInvite)
                                        );
                                        if (channels.size > 0) {
                                            member.guild.invites
                                                .create(channels.first().id)
                                                .create()
                                                .then(async invite => {
                                                    await member.send(
                                                        `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${invite.code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                    );
                                                    member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                })
                                                .catch(async e => {
                                                    await member.user
                                                        .send(
                                                            `**OH NO - You failed the CAPTCHA!**\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                        )
                                                        .catch(() => {});
                                                    member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                });
                                        }
                                    }
                                } catch (E) {
                                    member.kick("FAILED THE CAPTCHA").catch(() => {});
                                }
                            });
                    })
                    .catch(e => {
                        member.guild.channels
                            .create(`verify-${member.user.username}`.substring(0, 32), {
                                type: Discord.ChannelType.GuildText,
                                topic: "PLEASE SEND THE CAPTCHA CODE IN THE CHAT!",
                                permissionOverwrites: [
                                    {
                                        id: member.user.id,
                                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
                                    },
                                    {
                                        id: client.user.id,
                                        allow: ["VIEW_CHANNEL", "EMBED_LINKS", "ATTACH_FILES", "SEND_MESSAGES"],
                                    },
                                    {
                                        id: member.guild.id,
                                        deny: ["VIEW_CHANNEL"],
                                    },
                                ],
                            })
                            .then(ch => {
                                try {
                                    if (ch.permissionsFor(ch.guild.members.me).has(Discord.PermissionFlagsBits.SendMessages)) {
                                        if (ch.permissionsFor(ch.guild.members.me).has(Discord.PermissionFlagsBits.EmbedLinks)) {
                                            ch.send({
                                                content: `<@${member.user.id}>`,
                                                embeds: [captchaembed],
                                                files: [attachment],
                                            })
                                                .then(msg => {
                                                    msg.channel
                                                        .awaitMessages({
                                                            filter: m => m.author.id === member.user.id,
                                                            max: 1,
                                                            time: 60000,
                                                            errors: ["time"],
                                                        })
                                                        .then(async collected => {
                                                            if (
                                                                collected.first().content.trim().toLowerCase() ==
                                                                captcha.text.toLowerCase()
                                                            ) {
                                                                //remove the role again
                                                                member.roles
                                                                    .remove(mutedrole.id)
                                                                    .catch(e =>
                                                                        console.log(
                                                                            e.stack ? String(e.stack).grey : String(e).grey
                                                                        )
                                                                    );
                                                                //Send the message to success
                                                                ch.delete().catch(() => {});
                                                                //Do the WELCOME functions
                                                                add_roles(member);
                                                                message(member);
                                                            } else {
                                                                msg.edit({
                                                                    embeds: [],
                                                                    content: `**Falló the CAPTCHA!**`,
                                                                }).catch(() => {});
                                                                try {
                                                                    //kick the member, but fetch the invites first if there is no valid invite
                                                                    if (
                                                                        member.guild.invites.cache.filter(
                                                                            i =>
                                                                                i?.code &&
                                                                                (i?.maxAge === 0 || i?.maxAge > 600)
                                                                        ).size < 1
                                                                    )
                                                                        await member.guild.invites.fetch().catch(() => {});
                                                                    //if there is a valid invite which lasts for at least 10 minutes or forever
                                                                    if (
                                                                        member.guild.invites.cache.filter(
                                                                            i =>
                                                                                i?.code &&
                                                                                (i?.maxAge === 0 || i?.maxAge > 600)
                                                                        ).size > 0
                                                                    ) {
                                                                        await ch.send(
                                                                            `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${member.guild.invites.cache.filter(i => i?.code && i?.maxAge === 0).first().code}\n> :hammer: *I will kick you in 2 Seconds from the Server due to Security Reasons*`
                                                                        );
                                                                        await delay(2000);
                                                                        member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                                        ch.delete(() => {});
                                                                    } else {
                                                                        let channels = member.guild.channels.cache.filter(
                                                                            ch =>
                                                                                ch
                                                                                    .permissionsFor(member.guild.members.me)
                                                                                    .has(
                                                                                        Discord.PermissionFlagsBits.CreateInstantInvite
                                                                                    )
                                                                        );
                                                                        if (channels.size > 0) {
                                                                            member.guild.invites
                                                                                .create(channels.first().id)
                                                                                .create()
                                                                                .then(async invite => {
                                                                                    await ch.send(
                                                                                        `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${invite.code}\n> :hammer: *I will kick you in 2 Seconds from the Server due to Security Reasons*`
                                                                                    );
                                                                                    await delay(2000);
                                                                                    member
                                                                                        .kick("FAILED THE CAPTCHA")
                                                                                        .catch(() => {});
                                                                                    ch.delete(() => {});
                                                                                })
                                                                                .catch(async e => {
                                                                                    await ch.user
                                                                                        .send(
                                                                                            `**OH NO - You failed the CAPTCHA!**\n> :hammer: *I will kick you in 2 Seconds from the Server due to Security Reasons*`
                                                                                        )
                                                                                        .catch(() => {});
                                                                                    await delay(2000);
                                                                                    member
                                                                                        .kick("FAILED THE CAPTCHA")
                                                                                        .catch(() => {});
                                                                                    ch.delete(() => {});
                                                                                });
                                                                        }
                                                                    }
                                                                } catch (E) {
                                                                    member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                                }
                                                            }
                                                        })
                                                        .catch(async () => {
                                                            msg.edit({
                                                                embeds: [],
                                                                content: `**Falló the CAPTCHA!**`,
                                                            }).catch(() => {});
                                                            try {
                                                                //kick the member, but fetch the invites first if there is no valid invite
                                                                if (
                                                                    member.guild.invites.cache.filter(
                                                                        i => i?.code && (i?.maxAge === 0 || i?.maxAge > 600)
                                                                    ).size < 1
                                                                )
                                                                    await member.guild.invites.fetch().catch(() => {});
                                                                //if there is a valid invite which lasts for at least 10 minutes or forever
                                                                if (
                                                                    member.guild.invites.cache.filter(
                                                                        i => i?.code && (i?.maxAge === 0 || i?.maxAge > 600)
                                                                    ).size > 0
                                                                ) {
                                                                    await ch.send(
                                                                        `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${member.guild.invites.cache.filter(i => i?.code && i?.maxAge === 0).first().code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                                    );
                                                                    await delay(2000);
                                                                    member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                                    ch.delete(() => {});
                                                                } else {
                                                                    let channels = member.guild.channels.cache.filter(ch =>
                                                                        ch
                                                                            .permissionsFor(member.guild.members.me)
                                                                            .has(
                                                                                Discord.PermissionFlagsBits.CreateInstantInvite
                                                                            )
                                                                    );
                                                                    if (channels.size > 0) {
                                                                        member.guild.invites
                                                                            .create(channels.first().id)
                                                                            .create()
                                                                            .then(async invite => {
                                                                                await ch.send(
                                                                                    `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${invite.code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                                                );
                                                                                await delay(2000);
                                                                                member
                                                                                    .kick("FAILED THE CAPTCHA")
                                                                                    .catch(() => {});
                                                                                ch.delete(() => {});
                                                                            })
                                                                            .catch(async e => {
                                                                                await ch.user
                                                                                    .send(
                                                                                        `**OH NO - You failed the CAPTCHA!**\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                                                    )
                                                                                    .catch(() => {});
                                                                                await delay(2000);
                                                                                member
                                                                                    .kick("FAILED THE CAPTCHA")
                                                                                    .catch(() => {});
                                                                                ch.delete(() => {});
                                                                            });
                                                                    }
                                                                }
                                                            } catch (E) {
                                                                member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                            }
                                                        });
                                                })
                                                .catch(() => {
                                                    member.guild
                                                        .fetchOwner()
                                                        .then(owner => {
                                                            owner
                                                                .send(
                                                                    `:warning: **I can't create Channels_with_SEND_MESSAGES_PERMISSIONS for Captcha User, please give me PERMISSIONS for it asap!**`
                                                                )
                                                                .catch(() => {});
                                                        })
                                                        .catch(() => {});
                                                    member.kick().catch(() => {});
                                                });
                                        } else {
                                            ch.send({
                                                content: `<@${member.user.id}>\n${captchaembed.description}`.substring(
                                                    0,
                                                    2000
                                                ),
                                                files: [attachment],
                                            })
                                                .then(msg => {
                                                    msg.channel
                                                        .awaitMessages({
                                                            filter: m => m.author.id === member.user.id,
                                                            max: 1,
                                                            time: 60000,
                                                            errors: ["time"],
                                                        })
                                                        .then(async collected => {
                                                            if (
                                                                collected.first().content.trim().toLowerCase() ==
                                                                captcha.text.toLowerCase()
                                                            ) {
                                                                //remove the role again
                                                                member.roles
                                                                    .remove(mutedrole.id)
                                                                    .catch(e =>
                                                                        console.log(
                                                                            e.stack ? String(e.stack).grey : String(e).grey
                                                                        )
                                                                    );
                                                                //Send the message to success
                                                                ch.delete().catch(() => {});
                                                                //Do the WELCOME functions
                                                                add_roles(member);
                                                                message(member);
                                                            } else {
                                                                msg.edit({
                                                                    embeds: [],
                                                                    content: `**Falló the CAPTCHA!**`,
                                                                }).catch(() => {});
                                                                try {
                                                                    //kick the member, but fetch the invites first if there is no valid invite
                                                                    if (
                                                                        member.guild.invites.cache.filter(
                                                                            i =>
                                                                                i?.code &&
                                                                                (i?.maxAge === 0 || i?.maxAge > 600)
                                                                        ).size < 1
                                                                    )
                                                                        await member.guild.invites.fetch().catch(() => {});
                                                                    //if there is a valid invite which lasts for at least 10 minutes or forever
                                                                    if (
                                                                        member.guild.invites.cache.filter(
                                                                            i =>
                                                                                i?.code &&
                                                                                (i?.maxAge === 0 || i?.maxAge > 600)
                                                                        ).size > 0
                                                                    ) {
                                                                        await ch.send(
                                                                            `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${member.guild.invites.cache.filter(i => i?.code && i?.maxAge === 0).first().code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                                        );
                                                                        await delay(2000);
                                                                        member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                                        ch.delete(() => {});
                                                                    } else {
                                                                        let channels = member.guild.channels.cache.filter(
                                                                            ch =>
                                                                                ch
                                                                                    .permissionsFor(member.guild.members.me)
                                                                                    .has(
                                                                                        Discord.PermissionFlagsBits.CreateInstantInvite
                                                                                    )
                                                                        );
                                                                        if (channels.size > 0) {
                                                                            member.guild.invites
                                                                                .create(channels.first().id)
                                                                                .create()
                                                                                .then(async invite => {
                                                                                    await ch.send(
                                                                                        `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${invite.code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                                                    );
                                                                                    await delay(2000);
                                                                                    member
                                                                                        .kick("FAILED THE CAPTCHA")
                                                                                        .catch(() => {});
                                                                                    ch.delete(() => {});
                                                                                })
                                                                                .catch(async e => {
                                                                                    await ch.user
                                                                                        .send(
                                                                                            `**OH NO - You failed the CAPTCHA!**\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                                                        )
                                                                                        .catch(() => {});
                                                                                    await delay(2000);
                                                                                    member
                                                                                        .kick("FAILED THE CAPTCHA")
                                                                                        .catch(() => {});
                                                                                    ch.delete(() => {});
                                                                                });
                                                                        }
                                                                    }
                                                                } catch (E) {
                                                                    member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                                }
                                                            }
                                                        })
                                                        .catch(async () => {
                                                            msg.edit({
                                                                embeds: [],
                                                                content: `**Falló the CAPTCHA!**`,
                                                            }).catch(() => {});
                                                            try {
                                                                //kick the member, but fetch the invites first if there is no valid invite
                                                                if (
                                                                    member.guild.invites.cache.filter(
                                                                        i => i?.code && (i?.maxAge === 0 || i?.maxAge > 600)
                                                                    ).size < 1
                                                                )
                                                                    await member.guild.invites.fetch().catch(() => {});
                                                                //if there is a valid invite which lasts for at least 10 minutes or forever
                                                                if (
                                                                    member.guild.invites.cache.filter(
                                                                        i => i?.code && (i?.maxAge === 0 || i?.maxAge > 600)
                                                                    ).size > 0
                                                                ) {
                                                                    await ch.send(
                                                                        `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${member.guild.invites.cache.filter(i => i?.code && i?.maxAge === 0).first().code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                                    );
                                                                    await delay(2000);
                                                                    member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                                    ch.delete(() => {});
                                                                } else {
                                                                    let channels = member.guild.channels.cache.filter(ch =>
                                                                        ch
                                                                            .permissionsFor(member.guild.members.me)
                                                                            .has(
                                                                                Discord.PermissionFlagsBits.CreateInstantInvite
                                                                            )
                                                                    );
                                                                    if (channels.size > 0) {
                                                                        member.guild.invites
                                                                            .create(channels.first().id)
                                                                            .create()
                                                                            .then(async invite => {
                                                                                await ch.send(
                                                                                    `**OH NO - You failed the CAPTCHA!**\n> Here is an Invite Link in case u need one: https://discord.gg/${invite.code}\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                                                );
                                                                                await delay(2000);
                                                                                member
                                                                                    .kick("FAILED THE CAPTCHA")
                                                                                    .catch(() => {});
                                                                                ch.delete(() => {});
                                                                            })
                                                                            .catch(async e => {
                                                                                await ch.user
                                                                                    .send(
                                                                                        `**OH NO - You failed the CAPTCHA!**\n> :hammer: *I kicked you from the Server due to Security Reasons*`
                                                                                    )
                                                                                    .catch(() => {});
                                                                                await delay(2000);
                                                                                member
                                                                                    .kick("FAILED THE CAPTCHA")
                                                                                    .catch(() => {});
                                                                                ch.delete(() => {});
                                                                            });
                                                                    }
                                                                }
                                                            } catch (E) {
                                                                member.kick("FAILED THE CAPTCHA").catch(() => {});
                                                            }
                                                        });
                                                })
                                                .catch(() => {});
                                        }
                                    } else {
                                        member.guild
                                            .fetchOwner()
                                            .then(owner => {
                                                owner
                                                    .send(
                                                        `:warning: **I can't create Channels_with_SEND_MESSAGES_PERMISSIONS for Captcha User, please give me PERMISSIONS for it asap!**`
                                                    )
                                                    .catch(() => {});
                                            })
                                            .catch(() => {});
                                        member.kick().catch(() => {});
                                    }
                                } catch (e) {
                                    console.log(e);
                                    ch.delete().catch(() => {});
                                    member.kick().catch(() => {});
                                }
                            })
                            .catch(e => {
                                member.kick().catch(() => {});
                                member.guild
                                    .fetchOwner()
                                    .then(owner => {
                                        owner
                                            .send(
                                                `:warning: **I can't create Channels for Captcha User, please give me PERMISSIONS for it asap!**`
                                            )
                                            .catch(() => {});
                                    })
                                    .catch(() => {});
                            });
                    });
            } else {
                add_roles(member);
                message(member);
            }
        }
        async function message(member) {
            let welcome = client.settings.get(member.guild.id, "welcome");
            if (welcome && welcome.secondchannel !== "nochannel") {
                let themessage = String(welcome.secondmsg);
                if (!themessage || themessage.length == 0) themessage = ":wave: {user} **¡Bienvenido a nuestro servidor!** :v:";
                themessage = themessage
                    .replace("{user}", `${member.user}`)
                    .replace("{username}", `${member.user.username}`)
                    .replace("{usertag}", `${member.user.username}`);
                let channel = member.guild.channels.cache.get(welcome.secondchannel);
                if (!channel) {
                    try {
                        client.channels
                            .fetch(welcome.secondchannel)
                            .then(ch => {
                                ch.send({ content: themessage }).catch(() => {});
                            })
                            .catch(() => {});
                    } catch (e) {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                    }
                } else {
                    if (channel.permissionsFor(channel.guild.members.me).has(Discord.PermissionFlagsBits.SendMessages)) {
                        channel.send({ content: themessage }).catch(() => {});
                    }
                }
            }

            // DMs fire independently of whether a channel is configured
            if (welcome && welcome.dm) {
                if (welcome.imagedm) {
                    if (welcome.customdm === "no") dm_msg_autoimg(member);
                    else dm_msg_withimg(member);
                } else {
                    dm_msg_withoutimg(member);
                }
            }

            if (welcome && welcome.channel !== "nochannel") {
                if (welcome.image) {
                    if (welcome.custom === "no") msg_autoimg(member);
                    else msg_withimg(member);
                } else {
                    msg_withoutimg(member);
                }
            }

            async function msg_withoutimg(member) {
                let welcomechannel = client.settings.get(member.guild.id, "welcome.channel");
                if (!welcomechannel) return;
                let channel = await client.channels.fetch(welcomechannel).catch(() => {});
                if (!channel) return;

                //define the welcome embed
                const welcomeembed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : undefined
                    )
                    .setTimestamp()
                    .setFooter({
                        text: `ID: ${member.user.id}`,
                        iconURL: `${member.user.displayAvatarURL()}`,
                    })
                    .setTitle(eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable7"]))
                    .setDescription(
                        require("./welcome-message").renderWelcomeMessage(require("./config-service").welcomeMessage(client.settings, member.guild.id) || "{user} ¡Bienvenido a este servidor!", member.user, member.guild)
                    )
                    .addFields({ name: eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variablex_8"]), value: eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable8"]) });

                //send the welcome embed to there
                if (channel.permissionsFor(channel.guild.members.me).has(Discord.PermissionFlagsBits.SendMessages)) {
                    if (channel.permissionsFor(channel.guild.members.me).has(Discord.PermissionFlagsBits.EmbedLinks)) {
                        channel
                            .send({
                                content: `<@${member.user.id}>`,
                                embeds: [welcomeembed],
                            })
                            .catch(() => {});
                    } else {
                        channel
                            .send({
                                content: `<@${member.user.id}>\n${welcomeembed.description}`.substring(0, 2000),
                            })
                            .catch(() => {});
                    }
                }
            }
            async function dm_msg_withoutimg(member) {
                //define the welcome embed
                const welcomeembed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : undefined
                    )
                    .setTimestamp()
                    .setFooter({
                        text: `ID: ${member.user.id}`,
                        iconURL: `${member.user.displayAvatarURL()}`,
                    })
                    .setTitle(eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable9"]))
                    .setDescription(
                        (client.settings.get(member.guild.id, "welcome.dm_msg") || "{user} ¡Bienvenido al servidor!")
                            .replace("{user}", `${member.user}`)
                            .replace("{username}", `${member.user.username}`)
                            .replace("{usertag}", `${member.user.username}`)
                    );
                if (client.settings.get(member.guild.id, "welcome.invitedm"))
                    welcomeembed.addFields({ name: "\u200b", value: `${invitemessage}` });
                //send the welcome embed to there
                member.user
                    .send({
                        content: `<@${member.user.id}>`,
                        embeds: [welcomeembed],
                    })
                    .catch(() => {});
            }

            async function dm_msg_withimg(member) {
                //define the welcome embed
                const welcomeembed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : undefined
                    )
                    .setTimestamp()
                    .setFooter({
                        text: `ID: ${member.user.id}`,
                        iconURL: `${member.user.displayAvatarURL()}`,
                    })
                    .setTitle(eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable10"]))
                    .setDescription(
                        (client.settings.get(member.guild.id, "welcome.dm_msg") || "{user} ¡Bienvenido al servidor!")
                            .replace("{user}", `${member.user}`)
                            .replace("{username}", `${member.user.username}`)
                            .replace("{usertag}", `${member.user.username}`)
                    )
                    .setImage(client.settings.get(member.guild.id, "welcome.customdm"));
                if (client.settings.get(member.guild.id, "welcome.invitedm"))
                    welcomeembed.addFields({ name: "\u200b", value: `${invitemessage}` });
                //send the welcome embed to there
                member.user
                    .send({
                        content: `<@${member.user.id}>`,
                        embeds: [welcomeembed],
                    })
                    .catch(() => {});
            }
            async function msg_withimg(member) {
                let welcomechannel = client.settings.get(member.guild.id, "welcome.channel");
                if (!welcomechannel) return;
                let channel = await client.channels.fetch(welcomechannel).catch(() => {});
                if (!channel) return;

                //define the welcome embed
                const welcomeembed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : undefined
                    )
                    .setTimestamp()
                    .setFooter({
                        text: `ID: ${member.user.id}`,
                        iconURL: `${member.user.displayAvatarURL()}`,
                    })
                    .setTitle(eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable11"]))
                    .setDescription(
                        require("./welcome-message").renderWelcomeMessage(require("./config-service").welcomeMessage(client.settings, member.guild.id) || "{user} ¡Bienvenido a este servidor!", member.user, member.guild)
                    )
                    .setImage(client.settings.get(member.guild.id, "welcome.custom"));
                if (client.settings.get(member.guild.id, "welcome.invite"))
                    welcomeembed.addFields({ name: "\u200b", value: `${invitemessage}` });
                //send the welcome embed to there
                if (channel.permissionsFor(channel.guild.members.me).has(Discord.PermissionFlagsBits.SendMessages)) {
                    if (channel.permissionsFor(channel.guild.members.me).has(Discord.PermissionFlagsBits.EmbedLinks)) {
                        channel
                            .send({
                                content: `<@${member.user.id}>`,
                                embeds: [welcomeembed],
                            })
                            .catch(() => {});
                    } else {
                        channel
                            .send({
                                content: `<@${member.user.id}>\n${welcomeembed.description}`.substring(0, 2000),
                            })
                            .catch(() => {});
                    }
                }
            }

            async function dm_msg_autoimg(member) {
                try {
                    //define the welcome embed
                    const welcomeembed = new Discord.EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : undefined
                        )
                        .setTimestamp()
                        .setFooter({
                            text: `ID: ${member.user.id}`,
                            iconURL: `${member.user.displayAvatarURL()}`,
                        })
                        .setTitle(eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable12"]))
                        .setDescription(
                            (client.settings.get(member.guild.id, "welcome.dm_msg") || "{user} ¡Bienvenido al servidor!")
                            .replace("{user}", `${member.user}`)
                                .replace("{username}", `${member.user.username}`)
                                .replace("{usertag}", `${member.user.username}`)
                        );
                    if (client.settings.get(member.guild.id, "welcome.invitedm"))
                        welcomeembed.addFields({ name: "\u200b", value: `${invitemessage}` });
                    //member roles add on welcome every single role
                    const buf = await renderConfiguredWelcomeCard(client.settings, member, { dm: true });

                    //send DM with canvas (axios: bypass undici UND_ERR_SOCKET on file uploads)
                    try {
                        welcomeembed.setImage('attachment://welcome-image.png');
                        const dmRes = await axios.post(
                            'https://discord.com/api/v10/users/@me/channels',
                            { recipient_id: member.user.id },
                            { headers: { 'Content-Type': 'application/json', Authorization: `Bot ${client.token}` } }
                        );
                        const form = new FormData();
                        form.append('files[0]', buf, { filename: 'welcome-image.png', contentType: 'image/png' });
                        form.append('payload_json', JSON.stringify({
                            content: `<@${member.user.id}>`,
                            embeds: [welcomeembed.toJSON()],
                            attachments: [{ id: 0, filename: 'welcome-image.png' }],
                        }));
                        await axios.post(
                            `https://discord.com/api/v10/channels/${dmRes.data.id}/messages`,
                            form,
                            { headers: { ...form.getHeaders(), Authorization: `Bot ${client.token}` } }
                        );
                    } catch {}
                    //member roles add on welcome every single role
                } catch {}
            }
            async function msg_autoimg(member) {
                try {
                    let welcomechannel = client.settings.get(member.guild.id, "welcome.channel");
                    if (!welcomechannel) return;
                    let channel = await client.channels.fetch(welcomechannel).catch(() => {});
                    if (!channel) return;
                    //define the welcome embed
                    const welcomeembed = new Discord.EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : undefined
                        )
                        .setTimestamp()
                        .setFooter({
                            text: `ID: ${member.user.id}`,
                            iconURL: `${member.user.displayAvatarURL()}`,
                        })
                        .setTitle(eval(client.la[ls]["handlers"]["welcomejs"]["welcome"]["variable13"]))
                        .setDescription(
                            require("./welcome-message").renderWelcomeMessage(require("./config-service").welcomeMessage(client.settings, member.guild.id) || "{user} ¡Bienvenido a este servidor!", member.user, member.guild)
                        );
                    if (client.settings.get(member.guild.id, "welcome.invite"))
                        welcomeembed.addFields({ name: "\u200b", value: `${invitemessage}` });
                    try {
                        const buf = await renderConfiguredWelcomeCard(client.settings, member);

                        //send the welcome embed to there (axios: bypass undici UND_ERR_SOCKET on file uploads)
                        if (channel.permissionsFor(channel.guild.members.me).has(Discord.PermissionFlagsBits.SendMessages)) {
                            welcomeembed.setImage('attachment://welcome-image.png');
                            const hasEmbed = channel.permissionsFor(channel.guild.members.me).has(Discord.PermissionFlagsBits.EmbedLinks);
                            const form = new FormData();
                            form.append('files[0]', buf, { filename: 'welcome-image.png', contentType: 'image/png' });
                            form.append('payload_json', JSON.stringify({
                                content: `<@${member.user.id}>`,
                                embeds: hasEmbed ? [welcomeembed.toJSON()] : [],
                                attachments: [{ id: 0, filename: 'welcome-image.png' }],
                            }));
                            axios.post(
                                `https://discord.com/api/v10/channels/${channel.id}/messages`,
                                form,
                                { headers: { ...form.getHeaders(), Authorization: `Bot ${client.token}` } }
                            ).catch(() => {});
                        }
                    } catch (e) {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                    }
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                }
            }
        }

        function add_roles(member) {
            let roles = client.settings.get(member.guild.id, "welcome.roles");
            if (roles && roles.length > 0) {
                for (const role of roles) {
                    try {
                        let R = member.guild.roles.cache.get(role);
                        if (R) member.roles.add(R.id).catch(() => {});
                    } catch (e) {}
                }
            }
        }
    });

    /**
     * ANTI-NEW-ACCOUNT Detector
     */
    client.on("guildMemberAdd", async member => {
        if (!member.guild || member.user.bot) return;
        client.settings.ensure(member.guild.id, {
            antinewaccount: {
                enabled: false,
                delay: ms("2 days"),
                action: "kick", // kick / ban
                extra_message: "Please do not join back, unless you meet the requirements!",
            },
        });
        //Return if account system is disabled
        if (!client.settings.get(member.guild.id, "antinewaccount.enabled")) return;
        //get the ms time of the account creationj
        const createdAccount = new Date(member.user.createdAt).getTime();
        const newaccount_delay = client.settings.get(member.guild.id, "antinewaccount.delay");
        //return if account is old enough
        if (newaccount_delay < Date.now() - createdAccount) return;
        const extramessage = client.settings.get(member.guild.id, "antinewaccount.extra_message");
        const action = client.settings.get(member.guild.id, "antinewaccount.action");
        if (action == "ban") {
            await member
                .send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(`You got banned from __${member.guild.name}__`)
                            .setThumbnail(member.guild.iconURL())
                            .setFooter({
                                text: `${member.guild.name} | ${member.guild.id}`,
                                iconURL: `${member.guild.iconURL()}`,
                            })
                            .setDescription(
                                `This is because your Account was Creado ${duration(Date.now() - createdAccount)
                                    .map(a => `\`${a}\``)
                                    .join(", ")} ago, and the minimum Amount of Account-Age should be: ${duration(
                                    newaccount_delay
                                )
                                    .map(a => `\`${a}\``)
                                    .join(", ")}`
                            )
                            .addFields({ name: `**Guild-Message:**`, value: `${extramessage && extramessage.length > 1 ? extramessage : "No Extra Message provided"}`.substring(
                                    0,
                                    1024
                                ) }),
                    ],
                })
                .catch(() => {});
            member.ban({
                reason: `Alt Account Detection | Account created ${duration(Date.now() - createdAccount).join(", ")} ago`,
            });
        } else {
            await member
                .send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(`You got kicked from __${member.guild.name}__`)
                            .setThumbnail(member.guild.iconURL())
                            .setFooter({
                                text: `${member.guild.name} | ${member.guild.id}`,
                                iconURL: `${member.guild.iconURL()}`,
                            })
                            .setDescription(
                                `This is because your Account was Creado ${duration(Date.now() - createdAccount)
                                    .map(a => `\`${a}\``)
                                    .join(", ")} ago, and the minimum Amount of Account-Age should be: ${duration(
                                    newaccount_delay
                                )
                                    .map(a => `\`${a}\``)
                                    .join(", ")}`
                            )
                            .addFields({ name: `**Guild-Message:**`, value: `${extramessage && extramessage.length > 1 ? extramessage : "No Extra Message provided"}`.substring(
                                    0,
                                    1024
                                ) }),
                    ],
                })
                .catch(() => {});
            member.kick({
                reason: `Alt Account Detection | Account created ${duration(Date.now() - createdAccount).join(", ")} ago`,
            });
        }
    });

    /**
     * JOINLIST SYSTEM
     */
    client.on("guildMemberAdd", async member => {
        if (!member.guild || member.user.bot) return;
        client.settings.ensure(member.guild.id, {
            joinlist: {
                username_contain: [
                    /*
          {
            data: "",
            action: "",
            time: TIMESTAMP,
            nickname: NICKNAME/{random}
          }
        */
                ],
                username_equal: [],
                userid: [],
                server_in_common: [],
                server_not_in_common: [],
                noavatar: [],
            },
        });

        const joinlist = client.settings.get(member.guild.id, "joinlist");

        let inthere = false;
        let notInthere = false;

        if (!member.user.avatarURL() && joinlist.noavatar.filter(d => d.data == "enable").length > 0) {
            const reason = "`User not having an Avatar (joinlist)`";
            const datas = joinlist.noavatar.filter(d => d.data == "enable");
            await handleDatas(datas, reason);
        }

        if (
            joinlist.username_contain
                .map(d => d.data)
                .some(d => member.user.username.toLowerCase().includes(d.toLowerCase()))
        ) {
            const reason = "`Username contains ${data.data} (joinlist)`";
            const datas = joinlist.username_contain.filter(d =>
                member.user.username.toLowerCase().includes(d.data.toLowerCase())
            );
            await handleDatas(datas, reason);
        }

        if (joinlist.username_equal.map(d => d.data).some(d => d.toLowerCase() == member.user.username.toLowerCase())) {
            const reason = "`Username is equal to ${data.data} (joinlist)`";
            const datas = joinlist.username_equal.filter(d => d.data.toLowerCase() == member.user.username.toLowerCase());
            await handleDatas(datas, reason);
        }

        if (joinlist.userid.map(d => d.data).some(d => d == member.id)) {
            const reason = "`User ID is equal to ${data.data} (joinlist)`";
            const datas = joinlist.userid.filter(d => d.data == member.id);
            await handleDatas(datas, reason);
        }

        if (joinlist.server_in_common.map(d => d.data).length > 0) {
            const guilds = joinlist.server_in_common.map(d => d.data);
            for (const guild of guilds) {
                const g = client.guilds.cache.get(guild);
                if (g) {
                    let themember = g.members.cache.get(member.id) || (await g.members.fetch(member.id).catch(() => {}));
                    if (themember) {
                        inthere = g;
                        break;
                    }
                }
            }
            const reason = "`You are in the Guild ${inthere.name} (joinlist)`";
            const datas = joinlist.server_in_common.filter(d => d.data == inthere.id);
            await handleDatas(datas, reason, true);
        }

        if (joinlist.server_not_in_common.map(d => d.data).length > 0) {
            const guilds = joinlist.server_not_in_common.map(d => d.data);
            for (const guild of guilds) {
                const g = client.guilds.cache.get(guild);
                if (g) {
                    let themember = g.members.cache.get(member.id) || (await g.members.fetch(member.id).catch(() => {}));
                    if (!themember) {
                        notInthere = g;
                        break;
                    }
                }
            }
            const reason = "`You are not in the Guild ${notInthere.name} (joinlist)`";
            const datas = joinlist.server_not_in_common.filter(d => d.data == notInthere.id);
            await handleDatas(datas, reason);
        }

        function handleDatas(datas, reason = "No reason provided") {
            return new Promise(async (resolve, reject) => {
                if (datas.length > 0) {
                    for (const data of datas) {
                        if (data.action == "kick") {
                            if (member.kickable) {
                                await member
                                    .send(`You got kicked from \`${member.guild.name}\` because:\n> ${eval(reason)}`)
                                    .catch(() => {});
                                await member.kick({ reason: `${eval(reason)}` }).catch(console.warn);
                            }
                        }
                        if (data.action == "ban") {
                            if (member.bannable) {
                                await member
                                    .send(
                                        `You got banned from \`${member.guild.name}\` for ${data.days != 0 ? `${data.days} Days` : `ever`} because:\n> ${eval(reason)}`
                                    )
                                    .catch(() => {});
                                await member.ban({ reason: `${eval(reason)}`, days: data.days }).catch(console.warn);
                            }
                        }
                        if (data.time && data.time > 0 && data.action == "timeout") {
                            if (member.manageable) {
                                await member
                                    .send(
                                        `You got timeouted until <t:${Math.floor((Date.now() + data.time) / 1000)}:F> from \`${member.guild.name}\` because:\n> ${eval(reason)}`
                                    )
                                    .catch(() => {});
                                await member.timeout(data.time, `${eval(reason)}`).catch(console.warn);
                            }
                        }
                        if (
                            data.nickname &&
                            data.nickname.length > 0 &&
                            data.nickname.length < 32 &&
                            data.action == "setnickname"
                        ) {
                            if (member.manageable) {
                                await member.setNickname(data.nickname, `${eval(reason)}`).catch(console.warn);
                            }
                        }
                    }
                    return resolve(true);
                }
                return resolve(true);
            });
        }
    });

    /**
     * INCREASE THE MESSAGECOUNTER
     */
    client.on("messageCreate", message => {
        if (message.guild && message.author.id) {
            // Fetch guild and member data from the db
            client.invitesdb.ensure(message.guild.id + message.author.id, {
                messagesCount: 0,
            });
            client.invitesdb.inc(message.guild.id + message.author.id, "messagesCount");
        }
    });

    function inviteToJson(invite) {
        return {
            code: invite.code,
            uses: invite.uses,
            maxUses: invite.maxUses,
            inviter: invite.inviter,
            deletedTimestamp: invite.deletedTimestamp,
        };
    }

    function generateInvitesCache(invitesCache) {
        const cacheCollection = new Discord.Collection();
        invitesCache.forEach(invite => {
            cacheCollection.set(invite.code, inviteToJson(invite));
        });
        return cacheCollection;
    }

    function isEqual(value, other) {
        const type = Object.prototype.toString.call(value);
        if (type !== Object.prototype.toString.call(other)) return false;
        if (["[object Array]", "[object Object]"].indexOf(type) < 0) return false;
        const valueLen = type === "[object Array]" ? value.length : Object.keys(value).length;
        const otherLen = type === "[object Array]" ? other.length : Object.keys(other).length;
        if (valueLen !== otherLen) return false;
        const compare = (item1, item2) => {
            const itemType = Object.prototype.toString.call(item1);
            if (["[object Array]", "[object Object]"].indexOf(itemType) >= 0) {
                if (!isEqual(item1, item2)) return false;
            } else {
                if (itemType !== Object.prototype.toString.call(item2)) return false;
                if (itemType === "[object Function]") {
                    if (item1.toString() !== item2.toString()) return false;
                } else {
                    if (item1 !== item2) return false;
                }
            }
        };
        if (type === "[object Array]") {
            for (var i = 0; i < valueLen; i++) {
                if (compare(value[i], other[i]) === false) return false;
            }
        } else {
            for (var key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    if (compare(value[key], other[key]) === false) return false;
                }
            }
        }
        return true;
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
