const obeyMeta = require("./presentation/metadata")
const obeyUi = require("./assets/system")
const { asAuthor } = require("./presentation/metadata")
const { registry } = require('./assets/registry');
const { t, localeFor } = require('./i18n');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, Collection, AttachmentBuilder, PermissionFlagsBits,
    ButtonStyle,
    ChannelType
} = require("discord.js");
const Discord = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const moment = require("moment");
const fs = require("fs");
const { dbEnsure, databasing, delay, create_transcript, GetUser, GetRole, create_transcript_buffer } = require(
    `./functions`
);
const { allEmojis } = require("../botconfig/emojiFunctions.js");

module.exports = client => {
    //Event
    client.on("interactionCreate", async interaction => {
        if (!interaction?.isButton()) return;
        var { guild, channel, user, message } = interaction;
        if (!guild || !channel || !message || !user) return;
        if (!interaction?.customId.includes("ticket_")) return;
        if (interaction?.customId.includes("create_a_ticket")) return;
        const temptype = interaction?.customId.replace("ticket_", "");
        const buttonuser = user;

        const member = guild.members.cache.get(user.id) || (await guild.members.fetch(user.id).catch(() => {}));

        const ls = client.settings.get(guild.id, "language");
        const es = client.settings.get(guild.id, "embed");

        if (!member) return interaction?.reply(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable2"]));

        const prefix = client.settings.get(interaction?.guild.id, "prefix");
        const adminroles = client.settings.get(guild.id, "adminroles");
        const cmdroles = client.settings.get(guild.id, "cmdadminroles.ticket");
        const cmdroles2 = client.settings.get(guild.id, "cmdadminroles.close");
        const cmdrole = [];
        try {
            for (const r of cmdroles2) cmdrole.push(r);
        } catch {}

        if (!client.setups.has(channel.id)) {
            if (interaction.customId != "ticket_verify") {
                interaction?.reply({ content: obeyUi.owned("❌ Este canal no es un ticket"), ephemeral: true });
            }
            return;
        }
        interaction?.deferUpdate();
        const Ticketdata = client.setups.get(channel.id, "ticketdata");
        let ticketSystemNumber = String(Ticketdata.type).split("-");
        ticketSystemNumber = ticketSystemNumber[ticketSystemNumber.length - 1];
        const ticket = client.setups.get(
            guild.id,
            `${String(Ticketdata.type).includes("menu") ? "menu" : ""}ticketsystem${ticketSystemNumber}`
        );
        let theadminroles = ticket?.adminroles;
        let closedParent = ticket?.closedParent;
        if (String(Ticketdata.type).includes("menu") && Ticketdata.menutickettype && Ticketdata.menutickettype > 0) {
            const theDB = client.menuticket;
            const settings = theDB.get(guild.id, `menuticket${Ticketdata.menutickettype}`);
            let adminRoles = settings.access;
            if (Ticketdata.menuticketIndex !== undefined) {
                const data = settings.data[Ticketdata.menuticketIndex];
                if (data.access) {
                    console.log("BEFORE:", adminRoles);
                    adminRoles = [...adminRoles, ...data.access];
                    console.log("AFTER:", adminRoles);
                }
            }
            closedParent = settings.closedParent;
            theadminroles = adminRoles;
        }
        if (cmdroles.length > 0) {
            for (const r of cmdroles) {
                if (guild.roles.cache.get(r)) {
                    cmdrole.push(` | <@&${r}>`);
                } else if (guild.members.cache.get(r)) {
                    cmdrole.push(` | <@${r}>`);
                } else {
                    try {
                        client.settings.remove(guild.id, r, `cmdadminroles.ticket`);
                    } catch {}
                    try {
                        client.settings.remove(guild.id, r, `cmdadminroles.close`);
                    } catch {}
                }
            }
        }
        let edited = false;

        if (temptype == "close") {
            let data = client.setups.get(channel.id, "ticketdata");
            if (data.state === "closed") {
                return channel.send({
                    content: `<@${buttonuser.id}>`,
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable5"]), 256))
                            .setColor(es.wrongcolor),
                    ],
                });
            }
            let button_ticket_verify = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId("ticket_verify")
                .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.verify'))).setEmoji(obeyUi.component(registry.emoji('icon.verify')));
            channel
                .send({
                    content: `<@${buttonuser.id}>`,
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable6"]), 256))
                            .setColor(es.color),
                    ],
                    components: [new ActionRowBuilder().addComponents(button_ticket_verify)],
                })
                .then(async msg => {
                    const collector = msg.createMessageComponentCollector( { filter:bb => !bb?.user.bot,
                        time: 30000,
                    }); //collector for 5 seconds
                    collector.on("collect", async b => {
                        if (b?.user.id !== user.id)
                            return b?.reply(
                                `${obeyUi.markup("icon.error")} **Only the one who typed ${prefix}help is allowed to react!**`,
                                true
                            );

                        //page forward
                        if (b?.customId == "ticket_verify") {
                            edited = true;
                            msg.edit({
                                content: `<@${buttonuser.id}>`,
                                embeds: [new Discord.EmbedBuilder().setTitle(obeyUi.limit("¡Verificado!", 256)).setColor(es.color)],
                                components: [new ActionRowBuilder().addComponents(button_ticket_verify.setDisabled(true))],
                            }).catch(e => {
                                console.log(String(e).grey);
                            });

                            let index = String(data.type).slice(-1);
                            if (data.type.includes("apply")) {
                                client.setups.remove("TICKETS", data.user, `applytickets${index}`);
                                client.setups.remove("TICKETS", data.channel, `applytickets${index}`);
                            } else if (data.type.includes("menu")) {
                                client.setups.remove("TICKETS", data.user, `menutickets${index}`);
                                client.setups.remove("TICKETS", data.channel, `menutickets${index}`);
                            } else {
                                client.setups.remove("TICKETS", data.user, `tickets${index}`);
                                client.setups.remove("TICKETS", data.channel, `tickets${index}`);
                            }
                            client.setups.set(msg.channel.id, "closed", "ticketdata.state");
                            data = client.setups.get(msg.channel.id, "ticketdata");

                            if (closedParent) {
                                let ticketCh = msg.guild.channels.cache.get(closedParent);
                                if (ticketCh && ticketCh.type == ChannelType.GuildCategory) {
                                    if (ticketCh.children.size < 50) {
                                        await msg.channel
                                            .setParent(ticketCh.id, { lockPermissions: false })
                                            .catch(async e => {
                                                await msg.channel
                                                    .send(
                                                        `Can't move to: ${ticketCh.name} (\`${ticketCh.id}\`) because an Error occurred:\n> \`\`\`${String(e.message ? e.message : e).substring(0, 100)}\`\`\``
                                                    )
                                                    .catch(() => {});
                                            });
                                    } else {
                                        await msg.channel
                                            .send(
                                                `Ticket Category ${ticketCh.name} (\`${ticketCh.id}\`) is full, can't move!`
                                            )
                                            .catch(() => {});
                                    }
                                } else {
                                    await msg.channel.send(`Could not find ${closedParent} as a parent`).catch(() => {});
                                }
                            }

                            if (msg.channel.permissionsFor(msg.channel.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                await msg.channel.permissionOverwrites.edit(data.user, {
                                    SEND_MESSAGES: false,
                                    VIEW_CHANNEL: false,
                                });
                            }
                            msg.channel.send({
                                content: `<@${buttonuser.id}>`,
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(
                                            obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable7"]), 256)
                                        )
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setDescription(
                                            obeyUi.limit(`Closed the Ticket of <@${data.user}> and removed him from the Canal!`.substring(
                                                0,
                                                2000
                                            ), 4096)
                                        )
                                        .addFields({ name: "User: ", value: `<@${data.user}>` })
                                        .addFields({ name: eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variablex_8"]), value: eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable8"]) })
                                        .addFields({ name: "State: ", value: `${data.state}` })
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                            try {
                                msg.channel
                                    .setName(String(msg.channel.name).replace("ticket", "closed").substring(0, 32))
                                    .catch(e => {
                                        console.log(e);
                                    });
                            } catch (e) {
                                console.log(e);
                            }

                            if (client.settings.get(guild.id, `adminlog`) != "no") {
                                let message = msg; //NEEDED FOR THE EVALUATION!
                                try {
                                    var adminchannel = guild.channels.cache.get(client.settings.get(guild.id, `adminlog`));
                                    if (!adminchannel) return client.settings.set(guild.id, "no", `adminlog`);
                                    adminchannel.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor(es.color)
                                                .setThumbnail(
                                                    es.thumb
                                                        ? es.footericon &&
                                                          (es.footericon.includes("http://") ||
                                                              es.footericon.includes("https://"))
                                                            ? es.footericon
                                                            : client.user.displayAvatarURL()
                                                        : null
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                .setAuthor(
                                                    asAuthor(`ticket --> LOG | ${user.username}`,
                                                    user.displayAvatarURL())
                                                )
                                                .setDescription(
                                                    obeyUi.limit(eval(
                                                        client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                            "variable9"
                                                        ]
                                                    ), 4096)
                                                )
                                                .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable15"]) })
                                                .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable16"]) })
                                                .setTimestamp()
                                                .setFooter(obeyMeta.asFooter({ text: `ID: ${user.id}` })),
                                        ],
                                    });
                                } catch (e) {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                }
                            }
                        } else {
                            edited = true;
                            msg.edit({
                                content: `<@${buttonuser.id}>`,
                                embeds: [new Discord.EmbedBuilder().setTitle(obeyUi.limit("Cancelado!", 256)).setColor(es.wrongcolor)],
                                components: [new ActionRowBuilder().addComponents(button_ticket_verify.setDisabled(true))],
                            }).catch(e => {
                                console.log(String(e).grey);
                            });
                        }
                    });
                    let endedembed = new Discord.EmbedBuilder()
                        .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable12"]), 256))
                        .setColor(es.wrongcolor);
                    collector.on("end", collected => {
                        if (!edited) {
                            edited = true;
                            msg.edit({
                                content: `<@${buttonuser.id}>`,
                                embeds: [endedembed],
                                components: [
                                    new ActionRowBuilder().addComponents(
                                        button_ticket_verify
                                            .setDisabled(true)
                                            .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.verifyFailed'))).setEmoji(obeyUi.component(registry.emoji('icon.error')))
                                            .setStyle(ButtonStyle.Danger)
                                    ),
                                ],
                            }).catch(e => {
                                console.log(String(e).grey);
                            });
                        }
                    });
                });
        } else if (temptype == "delete") {
            let ticketspecific = [];
            if (theadminroles.length == 0) {
                ticketspecific = ["No Ticket Specific Roles/Users specified"];
            } else {
                for (const a of theadminroles) {
                    if (message.guild.roles.cache.has(a)) {
                        ticketspecific.push(`<@&${a}>`);
                    } else if (message.guild.members.cache.has(a)) {
                        ticketspecific.push(`<@${a}>`);
                    }
                }
            }
            if (
                [...member.roles.cache.values()] &&
                !member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(interaction?.user.id) && [...member.roles.cache.values()] &&
                !member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![guild.ownerId, config.ownerid].includes(interaction?.user.id) &&
                !member.permissions.has(Discord.PermissionFlagsBits.Administrator) &&
                !member.roles.cache.some(r => theadminroles.includes(r ? r.id : r)) &&
                !theadminroles.includes(member.id)
            ) {
                return channel.send({
                    content: `<@${buttonuser.id}>`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(obeyUi.owned("<:no:833101993668771842> No tienes permiso para eliminar este ticket"), 256))
                            .setDescription(
                                obeyUi.limit(`${adminroles.length > 0 ? "You need one of those Roles: " + adminroles.map(role => `<@&${role}>`).join(" | ") + cmdrole.join(" | ") + theadminroles.join(" | ") : `No Admin Roles Setupped yet! Do it with: \`${prefix}setup-admin\` You can also add Ticket only Roles with \`${prefix}setup-ticket\``}`, 4096)
                            )
                            .addFields({ name: "Ticket Specific Role(s)/User(s):", value: `${ticketspecific.join(", ")}`.substring(0, 1024) }),
                    ],
                });
            }
            let button_ticket_verify = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId("ticket_verify")
                .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.verify'))).setEmoji(obeyUi.component(registry.emoji('icon.verify')));
            let msg = await channel.send({
                content: `<@${buttonuser.id}>`,
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable13"]), 256))
                        .setColor(es.color),
                ],
                components: [new ActionRowBuilder().addComponents(button_ticket_verify)],
            });
            const collector = msg.createMessageComponentCollector( { filter:bb => !bb?.user.bot,
                time: 30000,
            }); //collector for 5 seconds
            collector.on("collect", async b => {
                if (b?.user.id !== user.id)
                    return b?.reply(
                        `${obeyUi.markup("icon.error")} **Only the one who typed ${prefix}help is allowed to react!**`,
                        true
                    );

                //page forward
                if (b?.customId == "ticket_verify") {
                    edited = true;
                    b.update({
                        content: `<@${buttonuser.id}>`,
                        embeds: [new Discord.EmbedBuilder().setTitle(obeyUi.limit("¡Verificado!", 256)).setColor(es.color)],
                        components: [new ActionRowBuilder().addComponents(button_ticket_verify.setDisabled(true))],
                    }).catch(e => {
                        console.log(String(e).grey);
                    });
                    let data = client.setups.get(msg.channel.id, "ticketdata");

                    let index = String(data.type).slice(-1);
                    if (data.type.includes("apply")) {
                        client.setups.remove("TICKETS", data.user, `applytickets${index != "-" ? index : ""}`);
                        client.setups.remove("TICKETS", data.channel, `applytickets${index != "-" ? index : ""}`);
                    } else if (data.type.includes("menu")) {
                        client.setups.remove("TICKETS", data.user, `menutickets${index != "-" ? index : ""}`);
                        client.setups.remove("TICKETS", data.channel, `menutickets${index != "-" ? index : ""}`);
                    } else {
                        client.setups.remove("TICKETS", data.user, `tickets${index != "-" ? index : ""}`);
                        client.setups.remove("TICKETS", data.channel, `tickets${index != "-" ? index : ""}`);
                    }
                    try {
                        client.setups.delete(msg.channel.id);
                    } catch {}
                    if (ticket?.ticketlogid && ticket?.ticketlogid.length > 5) {
                        try {
                            let logChannel = guild.channels.cache.get(ticket?.ticketlogid);
                            if (logChannel) {
                                msglimit = 1000;
                                //The text content collection
                                let messageCollection = new Collection(); //make a new collection
                                let channelMessages = await channel.messages
                                    .fetch({
                                        //fetch the last 100 messages
                                        limit: 100,
                                    })
                                    .catch(() => {}); //catch any error
                                messageCollection = messageCollection.concat(channelMessages); //add them to the Collection
                                let tomanymsgs = 1; //some calculation for the messagelimit
                                if (Number(msglimit) === 0) msglimit = 100; //if its 0 set it to 100
                                let messagelimit = Number(msglimit) / 100; //devide it by 100 to get a counter
                                if (messagelimit < 1) messagelimit = 1; //set the counter to 1 if its under 1
                                while (channelMessages.size === 100) {
                                    //make a loop if there are more then 100 messages in this channel to fetch
                                    if (tomanymsgs === messagelimit) break; //if the counter equals to the limit stop the loop
                                    tomanymsgs += 1; //add 1 to the counter
                                    let lastMessageId = channelMessages.lastKey(); //get key of the already fetched messages above
                                    channelMessages = await channel.messages
                                        .fetch({
                                            limit: 100,
                                            before: lastMessageId,
                                        })
                                        .catch(() => {}); //Fetch again, 100 messages above the already fetched messages
                                    if (channelMessages)
                                        //if its true
                                        messageCollection = messageCollection.concat(channelMessages); //add them to the collection
                                }
                                //reverse the array to have it listed like the discord chat
                                create_transcript_buffer([...messageCollection.values()], channel, guild)
                                    .then(async path => {
                                        try {
                                            // try to send the file
                                            const attachment = new AttachmentBuilder(path); //send it as an attachment
                                            //send the Transcript Into the Channel and then Deleting it again from the FOLDER
                                            let sendembed = new EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(
                                                        client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                            "variable20"
                                                        ]
                                                    ), 256)
                                                )
                                                .setColor(ee.color)
                                                .setFooter(obeyMeta.asFooter({ text: `${ee.footertext}`, iconURL: `${ee.footericon}` }));
                                            try {
                                                let user = guild.members.cache.get(data.user);
                                                sendembed.setDescription(
                                                    obeyUi.limit(eval(
                                                        client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                            "variable21"
                                                        ]
                                                    ), 4096)
                                                );
                                                sendembed.setThumbnail(
                                                    user.user.displayAvatarURL()
                                                );
                                            } catch {
                                                sendembed.setDescription(obeyUi.limit(channel.topic, 4096));
                                            }
                                            await logChannel
                                                .send({
                                                    content: `<@${buttonuser.id}>`,
                                                    embeds: [sendembed],
                                                })
                                                .catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey));
                                            await logChannel
                                                .send({
                                                    files: [attachment],
                                                })
                                                .catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey));
                                            //await tmmpmsg.delete().catch(e=>console.log(e.stack ? String(e.stack).grey : String(e).grey))
                                            await fs.unlinkSync(path);
                                        } catch (error) {
                                            //if the file is to big to be sent, then catch it!
                                            console.log(error);
                                        }
                                    })
                                    .catch(e => {
                                        console.log(String(e).grey);
                                    });
                            }
                        } catch (e) {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        }
                    }

                    await msg.channel.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable14"]), 256))
                                .setColor(es.color)
                                .setThumbnail(
                                    es.thumb
                                        ? es.footericon &&
                                          (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                            ? es.footericon
                                            : client.user.displayAvatarURL()
                                        : null
                                )
                                .setDescription(
                                    obeyUi.limit(`Deleting Ticket in less then **\`3 Seconds\`** ....\n\n*If not you can do it manually*`.substring(
                                        0,
                                        2000
                                    ), 4096)
                                )
                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                        ],
                    });
                    setTimeout(() => {
                        msg.channel.delete().catch(e => {
                            console.log(String(e).grey);
                        });
                    }, 3500);

                    if (client.settings.get(guild.id, `adminlog`) != "no") {
                        let message = msg; //NEEDED FOR THE EVALUATION!
                        try {
                            var adminchannel = guild.channels.cache.get(client.settings.get(guild.id, `adminlog`));
                            if (!adminchannel) return client.settings.set(guild.id, "no", `adminlog`);
                            adminchannel.send({
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
                                        .setAuthor(
                                            asAuthor(`ticket --> LOG | ${user.username}`,
                                            user.displayAvatarURL())
                                        )
                                        .setDescription(
                                            obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable15"]), 4096)
                                        )
                                        .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable15"]) })
                                        .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable16"]) })
                                        .setTimestamp()
                                        .setFooter(obeyMeta.asFooter({ text: `ID: ${user.id}` })),
                                ],
                            });
                        } catch (e) {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        }
                    }
                } else {
                    edited = true;
                    b.update({
                        content: `<@${buttonuser.id}>`,
                        embeds: [new Discord.EmbedBuilder().setTitle(obeyUi.limit("Cancelado!", 256)).setColor(es.wrongcolor)],
                        components: [new ActionRowBuilder().addComponents(button_ticket_verify.setDisabled(true))],
                    }).catch(e => {
                        console.log(String(e).grey);
                    });
                }
            });
            let endedembed = new Discord.EmbedBuilder()
                .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable18"]), 256))
                .setColor(es.wrongcolor);
            collector.on("end", collected => {
                if (!edited) {
                    edited = true;
                    msg.edit({
                        content: `<@${buttonuser.id}>`,
                        embeds: [endedembed],
                        components: [
                            new ActionRowBuilder().addComponents(
                                button_ticket_verify
                                    .setDisabled(true)
                                    .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.verifyFailed'))).setEmoji(obeyUi.component(registry.emoji('icon.error')))
                                    .setStyle(ButtonStyle.Danger)
                            ),
                        ],
                    }).catch(e => {
                        console.log(String(e).grey);
                    });
                }
            });
        } else if (temptype == "log" || temptype == "transcript") {
            msglimit = 1000;
            let data = client.setups.get(channel.id, "ticketdata");
            //The text content collection
            let messageCollection = new Collection(); //make a new collection
            let channelMessages = await channel.messages
                .fetch({
                    //fetch the last 100 messages
                    limit: 100,
                })
                .catch(() => {}); //catch any error
            messageCollection = messageCollection.concat(channelMessages); //add them to the Collection
            let tomanymsgs = 1; //some calculation for the messagelimit
            if (Number(msglimit) === 0) msglimit = 100; //if its 0 set it to 100
            let messagelimit = Number(msglimit) / 100; //devide it by 100 to get a counter
            if (messagelimit < 1) messagelimit = 1; //set the counter to 1 if its under 1
            while (channelMessages.size === 100) {
                //make a loop if there are more then 100 messages in this channel to fetch
                if (tomanymsgs === messagelimit) break; //if the counter equals to the limit stop the loop
                tomanymsgs += 1; //add 1 to the counter
                let lastMessageId = channelMessages.lastKey(); //get key of the already fetched messages above
                channelMessages = await channel.messages
                    .fetch({
                        limit: 100,
                        before: lastMessageId,
                    })
                    .catch(() => {}); //Fetch again, 100 messages above the already fetched messages
                if (channelMessages)
                    //if its true
                    messageCollection = messageCollection.concat(channelMessages); //add them to the collection
            }
            //reverse the array to have it listed like the discord chat
            create_transcript_buffer([...messageCollection.values()], channel, guild)
                .then(async path => {
                    try {
                        // try to send the file
                        const attachment = new AttachmentBuilder(path); //send it as an attachment
                        //send the Transcript Into the Channel and then Deleting it again from the FOLDER
                        let sendembed = new EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable20"]), 256))
                            .setColor(ee.color)
                            .setFooter(obeyMeta.asFooter({ text: `${ee.footertext}`, iconURL: `${ee.footericon}` }));
                        try {
                            let user = guild.members.cache.get(data.user);
                            sendembed.setDescription(
                                obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable21"]), 4096)
                            );
                            sendembed.setThumbnail(
                                user.user.displayAvatarURL()
                            );
                        } catch {
                            sendembed.setDescription(obeyUi.limit(channel.topic, 4096));
                        }
                        await channel.send({
                            content: `<@${buttonuser.id}>`,
                            embeds: [sendembed],
                        });
                        await channel.send({
                            files: [attachment],
                        });
                        //await tmmpmsg.delete().catch(e=>console.log(e.stack ? String(e.stack).grey : String(e).grey))
                        await fs.unlinkSync(path);
                        if (client.settings.get(guild.id, `adminlog`) != "no") {
                            try {
                                var adminchannel = guild.channels.cache.get(client.settings.get(guild.id, `adminlog`));
                                if (!adminchannel) return client.settings.set(guild.id, "no", `adminlog`);
                                adminchannel.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(es.color)
                                            .setThumbnail(
                                                es.thumb
                                                    ? es.footericon &&
                                                      (es.footericon.includes("http://") ||
                                                          es.footericon.includes("https://"))
                                                        ? es.footericon
                                                        : client.user.displayAvatarURL()
                                                    : null
                                            )
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                            .setAuthor(
                                                obeyMeta.asAuthor(client.getAuthor(
                                                    `ticket --> LOG | ${user.username}`,
                                                    user.displayAvatarURL()
                                                ))
                                            )
                                            .setDescription(
                                                obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable22"]), 4096)
                                            )
                                            .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable15"]) })
                                            .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable16"]) })
                                            .setTimestamp()
                                            .setFooter(obeyMeta.asFooter({ text: `ID: ${user.id}` })),
                                    ],
                                });
                            } catch (e) {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                            }
                        }
                    } catch (error) {
                        //if the file is to big to be sent, then catch it!
                        console.log(error);
                        channel.send({
                            content: `<@${buttonuser.id}>`,
                            embeds: [
                                new EmbedBuilder()
                                    .setAuthor(
                                        asAuthor("ERROR! Transcript is to big, to be sent into the Channel!",
                                        user.displayAvatarURL())
                                    )
                                    .setFooter(obeyMeta.asFooter({
                                        text: `${eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable25"])}`,
                                    })),
                            ],
                        });
                    }
                })
                .catch(e => {
                    console.log(String(e).grey);
                });
        } else if (temptype == "user") {
            if (
                [...member.roles.cache.values()] &&
                !member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(interaction?.user.id) && [...member.roles.cache.values()] &&
                !member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![guild.ownerId, config.ownerid].includes(interaction?.user.id) &&
                !member.permissions.has(Discord.PermissionFlagsBits.Administrator) &&
                !member.roles.cache.some(r => theadminroles.includes(r ? r.id : r))
            ) {
                return channel.send({
                    content: `<@${buttonuser.id}>`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(obeyUi.owned("<:no:833101993668771842> No tienes permiso para añadir/eliminar usuarios de este ticket"), 256))
                            .setDescription(
                                obeyUi.limit(`${adminroles.length > 0 ? "You need one of those Roles: " + adminroles.map(role => `<@&${role}>`).join(" | ") + cmdrole.join(" | ") + theadminroles.join(" | ") : `No Admin Roles Setupped yet! Do it with: \`${prefix}setup-admin\` You can also add Ticket only Roles with \`${prefix}setup-ticket\``}`, 4096)
                            ),
                    ],
                });
            }
            channel
                .send({
                    content: `<@${buttonuser.id}>`,
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable32"]), 256))
                            .setColor(es.color)
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : null
                            )
                            .setDescription(
                                obeyUi.limit(`Either with <@USERID> or with the USERNAME, or with the USERID`.substring(0, 2000), 4096)
                            )
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                })
                .then(async msg => {
                    msg.channel
                        .awaitMessages({ filter: m => m.author.id === buttonuser.id, max: 1, time: 90000, errors: ["time"] })
                        .then(async collected => {
                            var message = collected.first();
                            var args = message.content.split(" ");
                            var user;
                            try {
                                user = await GetUser(message, args);
                            } catch (e) {
                                if (!e)
                                    return channel.send(
                                        eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable33"])
                                    );
                                return channel.send(e);
                            }
                            if (!user || user == null || user.id == null || !user.id)
                                channel.send(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable34"]));
                            var mapped = msg.channel.permissionOverwrites.cache.map(p => {
                                if (p.type == "member") {
                                    var obj = {
                                        id: "",
                                        allow: [],
                                    };
                                    obj.id = p.id;
                                    obj.allow = p.allow ? p.allow.toArray() : [];
                                    return obj;
                                }
                                return {
                                    id: "",
                                    allow: [],
                                };
                            });
                            var oldmapped = mapped;
                            var undermapped = mapped.map(p => p.id);
                            if (undermapped.includes(user.id)) {
                                oldmapped.forEach(element => {
                                    if (element.id == user.id) {
                                        if (!element.allow.includes("VIEW_CHANNEL")) {
                                            if (
                                                !channel
                                                    .permissionsFor(channel.guild.members.me)
                                                    .has(PermissionFlagsBits.ManageChannels)
                                            ) {
                                                return channel.send(
                                                    `${obeyUi.markup("icon.error")} **I am missing the PermissionFlagsBits MANAGE_CHANNELS for: \`${channel.name}\`**`
                                                );
                                            }
                                            channel.permissionOverwrites
                                                .edit(user.id, {
                                                    SEND_MESSAGES: true,
                                                    VIEW_CHANNEL: true,
                                                })
                                                .then(channel => {
                                                    channel.send({
                                                        content: `<@${buttonuser.id}>`,
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor(es.color)
                                                                .setThumbnail(
                                                                    es.thumb
                                                                        ? es.footericon &&
                                                                          (es.footericon.includes("http://") ||
                                                                              es.footericon.includes("https://"))
                                                                            ? es.footericon
                                                                            : client.user.displayAvatarURL()
                                                                        : null
                                                                )
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable35"]
                                                                    ), 256)
                                                                ),
                                                        ],
                                                    });
                                                    if (client.settings.get(guild.id, `adminlog`) != "no") {
                                                        try {
                                                            var adminchannel = guild.channels.cache.get(
                                                                client.settings.get(guild.id, `adminlog`)
                                                            );
                                                            if (!adminchannel)
                                                                return client.settings.set(guild.id, "no", `adminlog`);
                                                            adminchannel.send({
                                                                embeds: [
                                                                    new EmbedBuilder()
                                                                        .setColor(es.color)
                                                                        .setThumbnail(
                                                                            es.thumb
                                                                                ? es.footericon &&
                                                                                  (es.footericon.includes("http://") ||
                                                                                      es.footericon.includes("https://"))
                                                                                    ? es.footericon
                                                                                    : client.user.displayAvatarURL()
                                                                                : null
                                                                        )
                                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                        .setAuthor(
                                                                            asAuthor(`ticket --> LOG | ${user.username}`,
                                                                            user.displayAvatarURL())
                                                                        )
                                                                        .setDescription(
                                                                            obeyUi.limit(eval(
                                                                                client.la[ls]["handlers"]["ticketeventjs"][
                                                                                    "ticketevent"
                                                                                ]["variable36"]
                                                                            ), 4096)
                                                                        )
                                                                        .addFields({ name: eval(
                                                                                client.la[ls]["cmds"]["administration"][
                                                                                    "ban"
                                                                                ]["variablex_15"]
                                                                            ), value: eval(
                                                                                client.la[ls]["cmds"]["administration"][
                                                                                    "ban"
                                                                                ]["variable15"]
                                                                            ) })
                                                                        .addFields({ name: eval(
                                                                                client.la[ls]["cmds"]["administration"][
                                                                                    "ban"
                                                                                ]["variablex_16"]
                                                                            ), value: eval(
                                                                                client.la[ls]["cmds"]["administration"][
                                                                                    "ban"
                                                                                ]["variable16"]
                                                                            ) })
                                                                        .setTimestamp()
                                                                        .setFooter(obeyMeta.asFooter({ text: `ID: ${user.id}` })),
                                                                ],
                                                            });
                                                        } catch (e) {
                                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                                        }
                                                    }
                                                })
                                                .catch(e => {
                                                    return channel.send({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor(es.wrongcolor)
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable39"]
                                                                    ), 256)
                                                                )
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable40"]
                                                                    ), 4096)
                                                                ),
                                                        ],
                                                    });
                                                });
                                        } else {
                                            if (
                                                !channel
                                                    .permissionsFor(channel.guild.members.me)
                                                    .has(PermissionFlagsBits.ManageChannels)
                                            ) {
                                                return channel.send(
                                                    `${obeyUi.markup("icon.error")} **I am missing the PermissionFlagsBits MANAGE_CHANNELS for: \`${channel.name}\`**`
                                                );
                                            }
                                            channel.permissionOverwrites
                                                .edit(user.id, {
                                                    SEND_MESSAGES: false,
                                                    VIEW_CHANNEL: false,
                                                })
                                                .then(channel => {
                                                    return channel.send({
                                                        content: `<@${buttonuser.id}>`,
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor(es.color)
                                                                .setThumbnail(
                                                                    es.thumb
                                                                        ? es.footericon &&
                                                                          (es.footericon.includes("http://") ||
                                                                              es.footericon.includes("https://"))
                                                                            ? es.footericon
                                                                            : client.user.displayAvatarURL()
                                                                        : null
                                                                )
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable41"]
                                                                    ), 256)
                                                                ),
                                                        ],
                                                    });
                                                })
                                                .catch(e => {
                                                    return channel.send({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor(es.wrongcolor)
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable42"]
                                                                    ), 256)
                                                                )
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable43"]
                                                                    ), 4096)
                                                                ),
                                                        ],
                                                    });
                                                });
                                        }
                                    }
                                });
                            } else {
                                if (!channel.permissionsFor(channel.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                    return channel.send(
                                        `${obeyUi.markup("icon.error")} **I am missing the PermissionFlagsBits MANAGE_CHANNELS for: \`${channel.name}\`**`
                                    );
                                }
                                channel.permissionOverwrites
                                    .edit(user.id, {
                                        SEND_MESSAGES: true,
                                        VIEW_CHANNEL: true,
                                    })
                                    .then(channel => {
                                        channel.send({
                                            content: `<@${buttonuser.id}>`,
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(es.color)
                                                    .setThumbnail(
                                                        es.thumb
                                                            ? es.footericon &&
                                                              (es.footericon.includes("http://") ||
                                                                  es.footericon.includes("https://"))
                                                                ? es.footericon
                                                                : client.user.displayAvatarURL()
                                                            : null
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setTitle(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                                "variable44"
                                                            ]
                                                        ), 256)
                                                    ),
                                            ],
                                        });
                                        if (client.settings.get(guild.id, `adminlog`) != "no") {
                                            try {
                                                var adminchannel = guild.channels.cache.get(
                                                    client.settings.get(guild.id, `adminlog`)
                                                );
                                                if (!adminchannel) return client.settings.set(guild.id, "no", `adminlog`);
                                                adminchannel.send({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor(es.color)
                                                            .setThumbnail(
                                                                es.thumb
                                                                    ? es.footericon &&
                                                                      (es.footericon.includes("http://") ||
                                                                          es.footericon.includes("https://"))
                                                                        ? es.footericon
                                                                        : client.user.displayAvatarURL()
                                                                    : null
                                                            )
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                            .setAuthor(
                                                                asAuthor(`ticket --> LOG | ${user.username}`,
                                                                user.displayAvatarURL())
                                                            )
                                                            .setDescription(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["handlers"]["ticketeventjs"][
                                                                        "ticketevent"
                                                                    ]["variable45"]
                                                                ), 4096)
                                                            )
                                                            .addFields({ name: eval(
                                                                    client.la[ls]["cmds"]["administration"]["ban"][
                                                                        "variablex_15"
                                                                    ]
                                                                ), value: eval(
                                                                    client.la[ls]["cmds"]["administration"]["ban"][
                                                                        "variable15"
                                                                    ]
                                                                ) })
                                                            .addFields({ name: eval(
                                                                    client.la[ls]["cmds"]["administration"]["ban"][
                                                                        "variablex_16"
                                                                    ]
                                                                ), value: eval(
                                                                    client.la[ls]["cmds"]["administration"]["ban"][
                                                                        "variable16"
                                                                    ]
                                                                ) })
                                                            .setTimestamp()
                                                            .setFooter(obeyMeta.asFooter({ text: `ID: ${user.id}` })),
                                                    ],
                                                });
                                            } catch (e) {
                                                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            }
                                        }
                                    })
                                    .catch(e => {
                                        return channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setTitle(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                                "variable48"
                                                            ]
                                                        ), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                                "variable49"
                                                            ]
                                                        ), 4096)
                                                    ),
                                            ],
                                        });
                                    })
                                    .catch(e => {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                        return channel.send({
                                            content: `<@${buttonuser.id}>`,
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                                "variable50"
                                                            ]
                                                        ), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setDescription(obeyUi.limit(`"Cancelado"`.substring(0, 2000), 4096))
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    });
                            }
                        })
                        .catch(e => {
                            console.log(String(e).grey);
                        });
                });
        } else if (temptype == "role") {
            if (
                [...member.roles.cache.values()] &&
                !member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(interaction?.user.id) && [...member.roles.cache.values()] &&
                !member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![guild.ownerId, config.ownerid].includes(interaction?.user.id) &&
                !member.permissions.has(Discord.PermissionFlagsBits.Administrator) &&
                !member.roles.cache.some(r => theadminroles.includes(r ? r.id : r))
            ) {
                return channel.send({
                    content: `<@${buttonuser.id}>`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(obeyUi.owned("<:no:833101993668771842> No tienes permiso para añadir/eliminar roles de este ticket"), 256))
                            .setDescription(
                                obeyUi.limit(`${adminroles.length > 0 ? "You need one of those Roles: " + adminroles.map(role => `<@&${role}>`).join(" | ") + cmdrole.join(" | ") + theadminroles.join(" | ") : `No Admin Roles Setupped yet! Do it with: \`${prefix}setup-admin\` You can also add Ticket only Roles with \`${prefix}setup-ticket\``}`, 4096)
                            ),
                    ],
                });
            }
            channel
                .send({
                    content: `<@${buttonuser.id}>`,
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable51"]), 256))
                            .setColor(es.color)
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : null
                            )
                            .setDescription(
                                obeyUi.limit(`Either with <@&ROLEID> or with the ROLEID or with the ROLENAME`.substring(0, 2000), 4096)
                            )
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                })
                .then(async msg => {
                    msg.channel
                        .awaitMessages({ filter: m => m.author.id === buttonuser.id, max: 1, time: 90000, errors: ["time"] })
                        .then(async collected => {
                            var message = collected.first();
                            var args = message.content.split(" ");
                            var user;
                            try {
                                user = await GetRole(message, args);
                            } catch (e) {
                                if (!e)
                                    return channel.send(
                                        eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable52"])
                                    );
                                return channel.send("ERROR" + e);
                            }
                            if (!user || user == null || user.id == null || !user.id)
                                channel.send(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable53"]));
                            var mapped = msg.channel.permissionOverwrites.cache.map(p => {
                                if (p.type == "role") {
                                    var obj = {
                                        id: "",
                                        allow: [],
                                    };
                                    obj.id = p.id;
                                    obj.allow = p.allow ? p.allow.toArray() : [];
                                    return obj;
                                }
                                return {
                                    id: "",
                                    allow: [],
                                };
                            });
                            var oldmapped = mapped;
                            var undermapped = mapped.map(p => p.id);
                            if (undermapped.includes(user.id)) {
                                oldmapped.forEach(element => {
                                    if (element.id == user.id) {
                                        if (!element.allow.includes("VIEW_CHANNEL")) {
                                            if (
                                                !channel
                                                    .permissionsFor(channel.guild.members.me)
                                                    .has(PermissionFlagsBits.ManageChannels)
                                            ) {
                                                return channel.send(
                                                    `${obeyUi.markup("icon.error")} **I am missing the PermissionFlagsBits MANAGE_CHANNELS for: \`${channel.name}\`**`
                                                );
                                            }
                                            channel.permissionOverwrites
                                                .edit(user.id, {
                                                    SEND_MESSAGES: true,
                                                    VIEW_CHANNEL: true,
                                                })
                                                .then(channel => {
                                                    channel.send({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor(es.color)
                                                                .setThumbnail(
                                                                    es.thumb
                                                                        ? es.footericon &&
                                                                          (es.footericon.includes("http://") ||
                                                                              es.footericon.includes("https://"))
                                                                            ? es.footericon
                                                                            : client.user.displayAvatarURL()
                                                                        : null
                                                                )
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable54"]
                                                                    ), 256)
                                                                ),
                                                        ],
                                                    });
                                                    if (client.settings.get(guild.id, `adminlog`) != "no") {
                                                        try {
                                                            var adminchannel = guild.channels.cache.get(
                                                                client.settings.get(guild.id, `adminlog`)
                                                            );
                                                            if (!adminchannel)
                                                                return client.settings.set(guild.id, "no", `adminlog`);
                                                            adminchannel.send({
                                                                embeds: [
                                                                    new EmbedBuilder()
                                                                        .setColor(es.color)
                                                                        .setThumbnail(
                                                                            es.thumb
                                                                                ? es.footericon &&
                                                                                  (es.footericon.includes("http://") ||
                                                                                      es.footericon.includes("https://"))
                                                                                    ? es.footericon
                                                                                    : client.user.displayAvatarURL()
                                                                                : null
                                                                        )
                                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                        .setAuthor(
                                                                            asAuthor(`ticket --> LOG | ${user.username}`,
                                                                            user.displayAvatarURL())
                                                                        )
                                                                        .setDescription(
                                                                            obeyUi.limit(eval(
                                                                                client.la[ls]["handlers"]["ticketeventjs"][
                                                                                    "ticketevent"
                                                                                ]["variable55"]
                                                                            ), 4096)
                                                                        )
                                                                        .addFields({ name: eval(
                                                                                client.la[ls]["cmds"]["administration"][
                                                                                    "ban"
                                                                                ]["variablex_15"]
                                                                            ), value: eval(
                                                                                client.la[ls]["cmds"]["administration"][
                                                                                    "ban"
                                                                                ]["variable15"]
                                                                            ) })
                                                                        .addFields({ name: eval(
                                                                                client.la[ls]["cmds"]["administration"][
                                                                                    "ban"
                                                                                ]["variablex_16"]
                                                                            ), value: eval(
                                                                                client.la[ls]["cmds"]["administration"][
                                                                                    "ban"
                                                                                ]["variable16"]
                                                                            ) })
                                                                        .setTimestamp()
                                                                        .setFooter(obeyMeta.asFooter({ text: `ID: ${user.id}` })),
                                                                ],
                                                            });
                                                        } catch (e) {
                                                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                                        }
                                                    }
                                                })
                                                .catch(e => {
                                                    return channel.send({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor(es.wrongcolor)
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable58"]
                                                                    ), 256)
                                                                )
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable59"]
                                                                    ), 4096)
                                                                ),
                                                        ],
                                                    });
                                                });
                                        } else {
                                            if (
                                                !channel
                                                    .permissionsFor(channel.guild.members.me)
                                                    .has(PermissionFlagsBits.ManageChannels)
                                            ) {
                                                return channel.send(
                                                    `${obeyUi.markup("icon.error")} **I am missing the PermissionFlagsBits MANAGE_CHANNELS for: \`${channel.name}\`**`
                                                );
                                            }
                                            channel.permissionOverwrites
                                                .edit(user.id, {
                                                    SEND_MESSAGES: false,
                                                    VIEW_CHANNEL: false,
                                                })
                                                .then(channel => {
                                                    return channel.send({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor(es.color)
                                                                .setThumbnail(
                                                                    es.thumb
                                                                        ? es.footericon &&
                                                                          (es.footericon.includes("http://") ||
                                                                              es.footericon.includes("https://"))
                                                                            ? es.footericon
                                                                            : client.user.displayAvatarURL()
                                                                        : null
                                                                )
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable60"]
                                                                    ), 256)
                                                                ),
                                                        ],
                                                    });
                                                })
                                                .catch(e => {
                                                    return channel.send({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor(es.wrongcolor)
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable61"]
                                                                    ), 256)
                                                                )
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["handlers"]["ticketeventjs"][
                                                                            "ticketevent"
                                                                        ]["variable62"]
                                                                    ), 4096)
                                                                ),
                                                        ],
                                                    });
                                                });
                                        }
                                    }
                                });
                            } else {
                                if (!channel.permissionsFor(channel.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                                    return channel.send(
                                        `${obeyUi.markup("icon.error")} **I am missing the PermissionFlagsBits MANAGE_CHANNELS for: \`${channel.name}\`**`
                                    );
                                }
                                channel.permissionOverwrites
                                    .edit(user.id, {
                                        SEND_MESSAGES: true,
                                        VIEW_CHANNEL: true,
                                    })
                                    .then(channel => {
                                        channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(es.color)
                                                    .setThumbnail(
                                                        es.thumb
                                                            ? es.footericon &&
                                                              (es.footericon.includes("http://") ||
                                                                  es.footericon.includes("https://"))
                                                                ? es.footericon
                                                                : client.user.displayAvatarURL()
                                                            : null
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setTitle(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                                "variable63"
                                                            ]
                                                        ), 256)
                                                    ),
                                            ],
                                        });
                                        if (client.settings.get(guild.id, `adminlog`) != "no") {
                                            try {
                                                var adminchannel = guild.channels.cache.get(
                                                    client.settings.get(guild.id, `adminlog`)
                                                );
                                                if (!adminchannel) return client.settings.set(guild.id, "no", `adminlog`);
                                                adminchannel.send({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor(es.color)
                                                            .setThumbnail(
                                                                es.thumb
                                                                    ? es.footericon &&
                                                                      (es.footericon.includes("http://") ||
                                                                          es.footericon.includes("https://"))
                                                                        ? es.footericon
                                                                        : client.user.displayAvatarURL()
                                                                    : null
                                                            )
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                            .setAuthor(
                                                                asAuthor(`ticket --> LOG | ${user.username}`,
                                                                user.displayAvatarURL())
                                                            )
                                                            .setDescription(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["handlers"]["ticketeventjs"][
                                                                        "ticketevent"
                                                                    ]["variable64"]
                                                                ), 4096)
                                                            )
                                                            .addFields({ name: eval(
                                                                    client.la[ls]["cmds"]["administration"]["ban"][
                                                                        "variablex_15"
                                                                    ]
                                                                ), value: eval(
                                                                    client.la[ls]["cmds"]["administration"]["ban"][
                                                                        "variable15"
                                                                    ]
                                                                ) })
                                                            .addFields({ name: eval(
                                                                    client.la[ls]["cmds"]["administration"]["ban"][
                                                                        "variablex_16"
                                                                    ]
                                                                ), value: eval(
                                                                    client.la[ls]["cmds"]["administration"]["ban"][
                                                                        "variable16"
                                                                    ]
                                                                ) })
                                                            .setTimestamp()
                                                            .setFooter(obeyMeta.asFooter({ text: `ID: ${user.id}` })),
                                                    ],
                                                });
                                            } catch (e) {
                                                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                            }
                                        }
                                    })
                                    .catch(e => {
                                        return channel.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                    .setTitle(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                                "variable67"
                                                            ]
                                                        ), 256)
                                                    )
                                                    .setDescription(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"][
                                                                "variable68"
                                                            ]
                                                        ), 4096)
                                                    ),
                                            ],
                                        });
                                    });
                            }
                        })
                        .catch(e => {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                            return channel.send({
                                content: `<@${buttonuser.id}>`,
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(
                                            obeyUi.limit(eval(client.la[ls]["handlers"]["ticketeventjs"]["ticketevent"]["variable69"]), 256)
                                        )
                                        .setColor(es.wrongcolor)
                                        .setDescription(obeyUi.limit(`"Cancelado"`.substring(0, 2000), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                        });
                });
        } else if (temptype == "claim") {
            if (
                [...member.roles.cache.values()] &&
                !member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(interaction?.user.id) && [...member.roles.cache.values()] &&
                !member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![guild.ownerId, config.ownerid].includes(interaction?.user.id) &&
                !member.permissions.has(Discord.PermissionFlagsBits.Administrator) &&
                !member.roles.cache.some(r => theadminroles.includes(r ? r.id : r))
            ) {
                return channel.send({
                    content: `<@${buttonuser.id}>`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(obeyUi.owned("<:no:833101993668771842> No tienes permiso para reclamar este ticket"), 256))
                            .setDescription(
                                obeyUi.limit(`${adminroles.length > 0 ? "You need one of those Roles: " + adminroles.map(role => `<@&${role}>`).join(" | ") + cmdrole.join(" | ") + theadminroles.join(" | ") : `No Admin Roles Setupped yet! Do it with: \`${prefix}setup-admin\` You can also add Ticket only Roles with \`${prefix}setup-ticket\``}`, 4096)
                            ),
                    ],
                });
            }
            let data = client.setups.get(channel.id, "ticketdata");
            if (!channel.permissionsFor(member).has(Discord.PermissionFlagsBits.SendMessages)) {
                if (!channel.permissionsFor(channel.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                    return channel.send(`${obeyUi.markup("icon.error")} **I am missing the PermissionFlagsBits MANAGE_CHANNELS for: \`${channel.name}\`**`);
                }
                channel.permissionOverwrites
                    .edit(member.user, {
                        SEND_MESSAGES: true,
                    })
                    .catch(e => {
                        return interaction?.reply({
                            ephemeral: true,
                            content: obeyUi.owned("❌ **¡No se pueden cambiar tus permisos!**"),
                        });
                    });
            }
            message
                .edit({ content: message.content, embeds: [message.embeds[0]], components: message.components })
                .catch(e => {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                });
            let messageClaim = "";
            if (String(Ticketdata.type).includes("menu")) {
                messageClaim = client[`menuticket${Ticketdata.menutickettype}`].get(guild.id, "claim.messageClaim");
            } else {
                messageClaim = ticket?.claim.messageClaim;
            }
            channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.color)
                            .setAuthor(obeyMeta.asAuthor({ name: member.user.username, iconURL: member.displayAvatarURL() }))
                            .setDescription(
                                obeyUi.limit(messageClaim
                                    .replace(/\{claimer\}/gi, `${member.user}`)
                                    .replace(/\{user\}/gi, `<@${data.user}>`), 4096)
                            ),
                    ],
                })
                .catch(e => {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                });
        }
    });

    //menu Ticket
    client.on("interactionCreate", interaction => {
        if (
            interaction?.guildId &&
            interaction?.isStringSelectMenu() &&
            interaction?.message &&
            interaction?.message.author.id == client.user.id
        ) {
            let { user, message, channelId, values, guild } = interaction;
            let DBindex = false;
            for (let i = 1; i <= 100; i++) {
                let pre = `menuticket${i}`;
                let d = client.menuticket;
                if (
                    d?.has(guild.id) &&
                    d?.has(guild.id, pre) &&
                    message.id === d?.get(guild.id, pre + ".messageId") &&
                    (channelId === d?.get(guild.id, pre + ".channelId") ||
                        message.channelId === d?.get(guild.id, pre + ".channelId"))
                )
                    DBindex = i;
            }
            if (!DBindex) {
                if (interaction.placeholder) {
                    if (!interaction.placeholder.includes("Menu-Apply System!")) return;
                }
                if (interaction.replied)
                    return interaction?.editReply(obeyUi.owned("❌ Could not find the Database for your Application!"));
                return;
            }
            let pre = `menuticket${DBindex}`;
            let theDB = client.menuticket;
            dbEnsure(
                theDB,
                message.guild.id,
                {
                    messageId: "",
                    channelId: "",
                    claim: {
                        enabled: false,
                        messageOpen: "Dear {user}!\n> *Please wait until a Staff Member, claimed your Ticket!*",
                        messageClaim: "{claimer} **has claimed the Ticket!**\n> He will now give {user} support!",
                    },
                    access: [],
                    data: [
                        /*
                    {
                      value: "",
                      description: "",
                      category: null,
                      replyMsg: "{user} Welcome to the Support!",
                    }
                  */
                    ],
                },
                pre
            );
            let settings = theDB.get(guild.id, pre);
            if (
                message.id == settings.messageId &&
                (channelId == settings.channelId || message.channelId == settings.channelId)
            ) {
                let index = settings.data.findIndex(v => v.value == values[0]);
                if (index < 0) {
                    return interaction?.reply({
                        ephemeral: true,
                        content: obeyUi.owned("❌ **No se pudo encontrar la configuración del ticket para esta opción**"),
                    });
                }
                let data = settings.data[index];
                let replyMsg = data.replyMsg;

                let systempath = `menuticketsystem${index}`;
                let ticketspath = `menutickets${index}`;
                let idpath = `menuticketid${index}`;
                let tickettypepath = `menu-ticket-setup-${index}`;

                dbEnsure(
                    client.setups,
                    guild.id,
                    {
                        enabled: false,
                        guildid: guild.id,
                        messageid: "",
                        channelid: "",
                        parentid: "",
                        message: "Hey {user}, thanks for opening an ticket! Someone will help you soon!",
                        adminroles: [],
                    },
                    systempath
                );
                if (client.setups.get("TICKETS", ticketspath).includes(user.id)) {
                    try {
                        var ticketchannel = guild.channels.cache.get(client.setups.get(user.id, idpath));
                        if (!ticketchannel || ticketchannel == null || !ticketchannel.id || ticketchannel.id == null)
                            throw {
                                message: "NO TICKET CHANNEL FOUND AKA NO ANTISPAM",
                            };
                        if (client.setups.has(ticketchannel.id) && client.setups.has(ticketchannel.id, "ticketdata")) {
                            let data = client.setups.get(ticketchannel.id, "ticketdata");
                            if (data.state != "closed" && data.menutickettype == 3) {
                                return interaction?.reply({
                                    content: `${obeyUi.markup("icon.error")} **You already have an Ticket!** <#${ticketchannel.id}>`,
                                    ephemeral: true,
                                });
                            }
                        }
                    } catch {
                        client.setups.remove("TICKETS", user.id, ticketspath);
                    }
                }

                dbEnsure(client.stats, guild.id, {
                    ticketamount: 0,
                });
                client.stats.inc(guild.id, "ticketamount");
                let ticketamount = client.stats.get(guild.id, "ticketamount");

                if (!data.defaultname) data.defaultname = obeyUi.owned("ticket-{count}-{member}");

                let channelname = data.defaultname
                    .replace("{member}", user.username)
                    .replace("{count}", ticketamount)
                    .replace(/\s/giu, "-")
                    .substring(0, 31);
                let optionsData = {
                    topic: `${obeyUi.markup("icon.send")} Ticket for: ${user.username} (${user.id}) | ${values[0]} | ${obeyUi.markup("icon.success")} Created at: ${moment().format("LLLL")}`,
                    type: ChannelType.GuildText,
                    reason: `Menu Ticket System for: ${user.username}`,
                };
                guild.channels.create({ name: channelname.substring(0, 31), ...optionsData }).then(async ch => {
                    await interaction?.reply({
                        content: `${obeyUi.markup("motion.cargando")} **Creating your ticket?...** (Usually takes 0-2 Seconds)`,
                        ephemeral: true,
                    });
                    try {
                        var cat = guild.channels.cache.get(settings.data[index].category);
                        if (cat) {
                            if (cat.type == ChannelType.GuildCategory) {
                                if (cat.children.size < 50) {
                                    await ch.setParent(String(cat.id)).catch(() => {});
                                }
                            }
                        } else {
                            if (ch.parent) {
                                if (ch.parent.children.size < 50) {
                                    await ch.setParent(String(ch.parent.id), { lockPermissions: false }).catch(() => {});
                                }
                            }
                        }
                    } catch (e) {
                        if (ch.parent) {
                            if (ch.parent.children.size < 50) {
                                await ch.setParent(String(ch.parent.id), { lockPermissions: false }).catch(() => {});
                            }
                        }
                    }

                    if (!settings.data[index].category || settings.data[index].category.length < 5) {
                        await ch.permissionOverwrites
                            .create(guild.id, {
                                SEND_MESSAGES: false,
                                VIEW_CHANNEL: false,
                                EMBED_LINKS: false,
                                ADD_REACTIONS: false,
                                ATTACH_FILES: false,
                            })
                            .catch(() => {});
                    } else {
                        var cat = guild.channels.cache.get(settings.data[index].category);
                        if (!cat) {
                            await ch.permissionOverwrites
                                .create(guild.id, {
                                    SEND_MESSAGES: false,
                                    VIEW_CHANNEL: false,
                                    EMBED_LINKS: false,
                                    ADD_REACTIONS: false,
                                    ATTACH_FILES: false,
                                })
                                .catch(() => {});
                        }
                    }

                    await ch.permissionOverwrites
                        .create(user, {
                            SEND_MESSAGES: true,
                            VIEW_CHANNEL: true,
                            EMBED_LINKS: true,
                            ADD_REACTIONS: true,
                            ATTACH_FILES: true,
                        })
                        .catch(() => {});

                    await message.guild.members.fetch().catch(() => {});
                    let realaccess = [];
                    for (const a of settings.access) {
                        if (message.guild.roles.cache.has(a)) {
                            realaccess.push(a);
                        } else if (message.guild.members.cache.has(a)) {
                            realaccess.push(a);
                        }
                    }
                    for (const a of realaccess) {
                        if (a == ch.guild.id) continue;
                        await ch.permissionOverwrites
                            .create(a, {
                                SEND_MESSAGES: true,
                                VIEW_CHANNEL: true,
                                EMBED_LINKS: true,
                                ADD_REACTIONS: true,
                                ATTACH_FILES: true,
                            })
                            .catch(() => {});
                    }
                    if (settings.claim.enabled) {
                        let ids = ch.permissionOverwrites.cache
                            .filter(p => p.type == "role" && !p.deny.toArray().includes("SEND_MESSAGES"))
                            .map(d => d.id);
                        for (const id of ids) {
                            if (id == ch.guild.id) continue;
                            await ch.permissionOverwrites
                                .edit(id, {
                                    SEND_MESSAGES: false,
                                    VIEW_CHANNEL: true,
                                    EMBED_LINKS: true,
                                    ADD_REACTIONS: true,
                                    ATTACH_FILES: true,
                                })
                                .catch(console.warn);
                            await delay(client.ws.ping);
                        }
                    }
                    let es = client.settings.get(guild.id, "embed");
                    client.setups.push("TICKETS", user.id, ticketspath);
                    client.setups.push("TICKETS", ch.id, ticketspath);
                    client.setups.set(user.id, ch.id, idpath);
                    client.setups.set(
                        ch.id,
                        {
                            user: user.id,
                            channel: ch.id,
                            guild: guild.id,
                            menutickettype: DBindex,
                            menuticketIndex: index,
                            type: tickettypepath,
                            state: "open",
                            date: Date.now(),
                        },
                        "ticketdata"
                    );

                    let extrastring = "";
                    for (const a of realaccess) {
                        if (message.guild.roles.cache.has(a)) {
                            extrastring += ` | <@&${a}>`;
                        } else if (message.guild.members.cache.has(a)) {
                            extrastring += ` | <@${a}>`;
                        }
                    }

                    var ticketembed = new EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setFooter(obeyMeta.asFooter(client.getFooter(
                                `To close/manage this ticket react with the buttons\nYou can also type: ${client.settings.get(guild.id, "prefix" )}ticket`,
                                es.footericon
                            ))
                        )
                        .setAuthor(
                            obeyMeta.asAuthor(client.getAuthor(
                                `Ticket for: ${user.username}`,
                                user.displayAvatarURL(),
                                "https://github.com/melodiabl"
                            ))
                        )
                        .setDescription(obeyUi.limit(replyMsg.replace(/\{user\}/giu, `${user}`).substring(0, 2000), 4096));
                    var ticketembeds = [ticketembed];
                    if (settings.claim.enabled) {
                        var claimEmbed = new EmbedBuilder()
                            .setColor("#E67E22")
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : null
                            )
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setAuthor(
                                obeyMeta.asAuthor(client.getAuthor(
                                    `A Staff Member will claim the Ticket soon!`,
                                    registry.imageURL('motion.cargando'),
                                    "https://github.com/melodiabl"
                                ))
                            )
                            .setDescription(obeyUi.limit(settings.claim.messageOpen.replace(/\{user\}/giu, `${user}`).substring(0, 2000), 4096));
                        ticketembeds.push(claimEmbed);
                    }
                    const { ButtonBuilder } = require("discord.js");
                    let button_close = new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("ticket_close")
                        .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.close'))).setEmoji(obeyUi.component(registry.emoji('icon.close')));
                    let button_delete = new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId("ticket_delete")
                        .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.delete')))
                        .setEmoji(obeyUi.component(registry.emoji('icon.delete')));
                    let button_transcript = new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("ticket_transcript")
                        .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.transcript'))).setEmoji(obeyUi.component(registry.emoji('icon.transcript')));
                    let button_user = new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("ticket_user")
                        .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.users'))).setEmoji(obeyUi.component(registry.emoji('icon.profile')));
                    let button_role = new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("ticket_role")
                        .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.roles'))).setEmoji(obeyUi.component(registry.emoji('icon.roles')));
                    const allbuttons = [
                        new ActionRowBuilder().addComponents([
                            button_close,
                            button_delete,
                            button_transcript,
                            button_user,
                            button_role,
                        ]),
                    ];
                    if (settings.claim.enabled) {
                        allbuttons.push(
                            new ActionRowBuilder().addComponents([
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setCustomId("ticket_claim")
                                    .setLabel(obeyUi.plain(t(localeFor(client, guild.id), 'tickets.claim'))).setEmoji(obeyUi.component(registry.emoji('icon.claim'))),
                            ])
                        );
                    }
                    if (ch.permissionsFor(ch.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                        if (ch.permissionsFor(ch.guild.members.me).has(PermissionFlagsBits.EmbedLinks)) {
                            await ch
                                .send({
                                    content: `<@${user.id}>${extrastring}`,
                                    embeds: ticketembeds,
                                    components: allbuttons,
                                })
                                .catch(O => {
                                    console.log(String(O).grey);
                                })
                                .then(msg => {
                                    if (msg.channel.permissionsFor(msg.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
                                        msg.pin().catch(O => {
                                            console.log(String(O).grey);
                                        });
                                    }
                                });
                        } else {
                            await ch
                                .send({
                                    content: `<@${user.id}>${extrastring}\n${ticketembeds[0].description}`.substring(
                                        0,
                                        2000
                                    ),
                                    components: allbuttons,
                                })
                                .catch(O => {
                                    console.log(String(O).grey);
                                })
                                .then(msg => {
                                    if (msg.channel.permissionsFor(msg.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
                                        msg.pin().catch(O => {
                                            console.log(String(O).grey);
                                        });
                                    }
                                });
                        }
                    }
                    await interaction?.editReply({
                        content: `${allEmojis.msg.SUCCESS} **Your Ticket is created!** <#${ch.id}>`,
                        ephemeral: true,
                    });
                });
            }
        }
    });

    //auto support System
    client.on("interactionCreate", interaction => {
        if (
            interaction?.guildId &&
            interaction?.isStringSelectMenu() &&
            interaction?.message &&
            interaction?.message.author.id == client.user.id
        ) {
            let { user, message, channelId, values, guild } = interaction;
            let DBindex = false;
            for (let i = 1; i <= 100; i++) {
                let pre = `autosupport${i}`;
                let d = client.autosupport;
                if (
                    d?.has(guild.id) &&
                    d?.has(guild.id, pre) &&
                    message.id === d?.get(guild.id, pre + ".messageId") &&
                    (channelId === d?.get(guild.id, pre + ".channelId") ||
                        message.channelId === d?.get(guild.id, pre + ".channelId"))
                )
                    DBindex = i;
            }
            if (!DBindex) {
                if (interaction.placeholder) {
                    if (!interaction.placeholder.includes("Menu-Apply System!")) return;
                }
                if (interaction.replied)
                    return interaction?.editReply(obeyUi.owned("❌ Could not find the Database for your Application!"));
                return;
            }
            let theDB = client.autosupport;
            let pre = `autosupport${DBindex}`;
            dbEnsure(
                theDB,
                guild.id,
                {
                    messageId: "",
                    channelId: "",
                    data: [
                        //all menus in there
                        /*
                        {
                            value: "",
                            description: "",
                            sendEmbed: true,
                            replyMsg: "Welcome to the Support!"
                        }
                    */
                    ],
                },
                pre
            );
            let settings = theDB.get(guild.id, pre);
            let es = client.settings.get(guild.id, "embed");
            if (
                message.id == settings.messageId &&
                (channelId == settings.channelId || message.channelId == settings.channelId)
            ) {
                let index = settings.data.findIndex(v => v.value == values[0]);
                if (index < 0) {
                    return interaction?.reply({
                        ephemeral: true,
                        content: obeyUi.owned("❌ **No se pudo encontrar la configuración de auto-soporte para esta opción**"),
                    });
                }
                let data = settings.data[index];
                let { sendEmbed, replyMsg } = data;
                if (sendEmbed) {
                    interaction?.reply({
                        ephemeral: true,
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.color)
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setThumbnail(
                                    es.thumb
                                        ? es.footericon &&
                                          (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                            ? es.footericon
                                            : client.user.displayAvatarURL()
                                        : null
                                )
                                .setDescription(
                                    obeyUi.limit(String(replyMsg)
                                        .replace(/\{user\}/giu, `<@${user.id}>`)
                                        .substring(0, 2000), 4096)
                                ),
                        ],
                    });
                } else {
                    interaction?.reply({
                        ephemeral: true,
                        content: String(replyMsg)
                            .replace(/\{user\}/giu, `<@${user.id}>`)
                            .substring(0, 2000),
                    });
                }
            }
        }
    });

    //menu apply
    client.on("interactionCreate", interaction => {
        if (
            interaction?.guildId &&
            interaction?.isStringSelectMenu() &&
            interaction?.message &&
            interaction?.message.author.id == client.user.id
        ) {
            let { user, message, channelId, values, guild } = interaction;
            let DBindex = false;
            for (let i = 1; i <= 100; i++) {
                let pre = `menuapply${i}`;
                let d = client.menuapply;
                if (
                    d?.has(guild.id) &&
                    d?.has(guild.id, pre) &&
                    message.id === d?.get(guild.id, pre + ".messageId") &&
                    (channelId === d?.get(guild.id, pre + ".channelId") ||
                        message.channelId === d?.get(guild.id, pre + ".channelId"))
                )
                    DBindex = i;
            }
            if (!DBindex) {
                if (interaction.placeholder) {
                    if (!interaction.placeholder.includes("Menu-Apply System!")) return;
                }
                if (interaction.replied)
                    return interaction?.editReply(obeyUi.owned("❌ Could not find the Database for your Application!"));
                return;
            }
            let pre = `menuapply${DBindex}`;
            let theDB = client.menuapply;
            dbEnsure(
                theDB,
                guild.id,
                {
                    messageId: "",
                    channelId: "",
                    data: [
                        //all menus in there
                        /*
                        {
                            value: "",
                            description: "",
                            applySystemExecution: "",
                        }
                    */
                    ],
                },
                pre
            );
            const es = client.settings.get(guild.id, "embed");
            const ls = client.settings.get(guild.id, "language");
            const settings = theDB.get(guild.id, pre);
            const index = settings.data.findIndex(v => v.value == values[0]);
            if (index < 0) {
                return interaction?.reply({
                    ephemeral: true,
                    content: obeyUi.owned("❌ **No se pudo encontrar la configuración del ticket para esta opción**"),
                });
            }
            const data = settings.data[index];
            if (!data)
                return interaction?.reply({ ephemeral: true, content: obeyUi.owned("❌ **No se pudo encontrar los datos de este sistema**") });
            require(`./apply.js`).ApplySystem({
                guild: guild,
                channel: message.channel,
                user: user,
                message: message,
                interaction: interaction,
                es: es,
                ls: ls,
                preindex: Number(data.applySystemExecution),
            });
        }
    });
};
