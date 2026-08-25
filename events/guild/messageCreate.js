/**
 * @INFO
 * Loading all needed File Information Parameters
 */
const config = require(`${process.cwd()}/botconfig/config.json`); //loading config file with token and prefix, and settings
const ee = require(`${process.cwd()}/botconfig/embed.json`); //Loading all embed settings like color footertext and icon ...
const Discord = require("discord.js"); //this is the official discord.js wrapper for the Discord Api, which we use!
const { EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js"); //this is the official discord.js wrapper for the Discord Api, which we use!
const { escapeRegex, delay, simple_databasing, databasing, handlemsg, check_if_dj } = require(
    `${process.cwd()}/handlers/functions`
); //Loading all needed functions
//here the event starts
module.exports = async (client, message) => {
    console.log(`[EVENT-FIRE] messageCreate triggered — author: ${message?.author?.tag} | guild: ${message?.guild?.name} | content: "${message?.content?.substring(0, 80)}"`);
    try {
        //if the message is not in a guild (aka in dms), return aka ignore the inputs
        if (!message.guild || message.guild.available === false || !message.channel || message.webhookId) return;
        //if the channel is on partial fetch it
        if (message.channel?.partial) await message.channel.fetch().catch(() => {});
        if (message.member?.partial) await message.member.fetch().catch(() => {});
        //ensure all databases for this server/user from the databasing function
        simple_databasing(client, message.guild.id, message.author.id);
        var not_allowed = false;
        const guild_settings = client.settings.get(message.guild.id) || {};
        let es = guild_settings.embed || { color: '#fffff9', wrongcolor: '#e01e01', thumb: false, footertext: '', footericon: '' };
        let ls = guild_settings.language && client.la[guild_settings.language] ? guild_settings.language : 'es';
        let prefix = guild_settings.prefix || config.prefix;
        let botchannel = guild_settings.botchannel || [];
        let unkowncmdmessage = guild_settings.unkowncmdmessage ?? false;
        // if the message  author is a bot, return aka ignore the inputs
        if (message.author.bot) return;
        // Canal de peticiones de música (Setup v2): cualquier mensaje = reproducir
        try {
            const _setup = require('../../handlers/music/setup');
            if (_setup.isSetupChannel(message.guild.id, message.channel.id)) return _setup.handleSetupMessage(client, message);
        } catch {}
        //if not in the database for some reason use the default prefix
        if (prefix === null) prefix = config.prefix;
        //the prefix can be a Mention of the Bot / The defined Prefix of the Bot
        const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
        //if its not that then return
        if (!prefixRegex.test(message.content)) return;
        //now define the right prefix either ping or not ping
        const [, matchedPrefix] = message.content.match(prefixRegex);
        //CHECK PERMISSIONS — only EmbedLinks is critical
        if (!message.guild.members.me.permissions.has(Discord.PermissionFlagsBits.EmbedLinks)) {
            return message
                .reply(`No tengo el permiso de **Insertar Enlaces**. ¡Por favor, pide a un administrador que lo otorgue!`)
                .catch(() => {});
        }

        //CHECK IF IN A BOT CHANNEL OR NOT
        if (botchannel.toString() !== "") {
            //if its not in a BotChannel, and user not an ADMINISTRATOR
            if (!botchannel.includes(message.channel.id) && !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
                for (const channelId of botchannel) {
                    let channel = message.guild.channels.cache.get(channelId);
                    if (!channel) {
                        client.settings.remove(message.guild.id, channelId, `botchannel`);
                    }
                }
                try {
                    message.react("833101993668771842").catch(() => {});
                } catch {}
                not_allowed = true;
                return message
                    .reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(client.getFooter(es))
                                .setTitle(client.la[ls].common.botchat.title)
                                .setDescription(
                                    `${client.la[ls].common.botchat.description}\n> ${botchannel.map(c => `<#${c}>`).join(", ")}`
                                ),
                        ],
                    })
                    .then(async msg => {
                        setTimeout(() => {
                            try {
                                msg.delete().catch(() => {});
                            } catch {}
                        }, 5000);
                    })
                    .catch(() => {});
            }
        }
        //create the arguments with sliceing of of the rightprefix length
        const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
        //creating the cmd argument by shifting the args by 1
        const cmd = args.shift()?.toLowerCase();
        //if no cmd added return error
        if (!cmd || cmd.length === 0) {
            if (matchedPrefix.includes(client.user.id))
                return message
                    .reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.color)
                                .setTitle(handlemsg(client.la[ls].common.ping, { prefix: prefix })),
                        ],
                    })
                    .catch(() => {});
            return;
        }
        //get the command from the collection
        let command = client.commands.get(cmd);
        //if the command does not exist, try to get it by his alias
        if (!command) command = client.commands.get(client.aliases.get(cmd));
        // DEBUG: trace command lookup
        if (!command && !message.author.bot) {
            console.log(`[CMD] NOT FOUND: "${cmd}" | guild: ${message.guild.id} | channel: ${message.channel.id}`);
        }
        var customcmd = false;
        var cuc = client.customcommands.get(message.guild.id, "commands") || [];
        for (const cmd of cuc) {
            if (cmd.name.toLowerCase() === message.content.slice(prefix.length).split(" ")[0]) {
                customcmd = true;
                if (cmd.embed) {
                    return message.reply({
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
                                .setFooter(client.getFooter(es))
                                .setDescription(cmd.output),
                        ],
                    });
                }
                message.reply(cmd.output);
            }
        }
        //if the command is now valid
        if (command && !customcmd) {
            var musicData = client.musicsettings.get(message.guild.id);
            if (musicData.channel && musicData.channel == message.channel.id) {
                return message
                    .reply("<:no:833101993668771842> **¡Por favor usa un comando en otro lugar!**")
                    .then(msg => {
                        setTimeout(() => {
                            try {
                                msg.delete().catch(() => {});
                            } catch (e) {}
                        }, 3000);
                    })
                    .catch(() => {});
            }
            if (command.length == 0) {
                if (unkowncmdmessage) {
                    message
                        .reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(client.getFooter(es))
                                    .setTitle(handlemsg(client.la[ls].common.unknowncmd.title, { prefix: prefix }))
                                    .setDescription(
                                        handlemsg(client.la[ls].common.unknowncmd.description, { prefix: prefix })
                                    ),
                            ],
                        })
                        .then(async msg => {
                            setTimeout(() => {
                                try {
                                    msg.delete().catch(() => {});
                                } catch {}
                            }, 5000);
                        })
                        .catch(() => {});
                }
                //RETURN
                return;
            }
            if (!client.cooldowns.has(command.name)) {
                //if its not in the cooldown, set it too there
                client.cooldowns.set(command.name, new Discord.Collection());
            }
            const now = Date.now(); //get the current time
            const timestamps = client.cooldowns.get(command.name); //get the timestamp of the last used commands
            const cooldownAmount = (command.cooldown || 1) * 1000; //get the cooldownamount of the command, if there is no cooldown there will be automatically 1 sec cooldown, so you cannot spam it^^
            if (timestamps.has(message.author.id)) {
                //if the user is on cooldown
                let expirationTime = timestamps.get(message.author.id) + cooldownAmount; //get the amount of time he needs to wait until he can run the cmd again
                if (now < expirationTime) {
                    //if he is still on cooldonw
                    let timeLeft = (expirationTime - now) / 1000; //get the lefttime
                    if (timeLeft < 1) timeLeft = Math.round(timeLeft);
                    if (timeLeft && timeLeft != 0) {
                        not_allowed = true;
                        return message
                            .reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.wrongcolor)
                                        .setTitle(
                                            handlemsg(client.la[ls].common.cooldown, {
                                                time: timeLeft.toFixed(1),
                                                commandname: command.name,
                                            })
                                        ),
                                ],
                            })
                            .catch(() => {}); //send an information message
                    }
                }
            }
            timestamps.set(message.author.id, now); //if he is not on cooldown, set it to the cooldown
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); //set a timeout function with the cooldown, so it gets deleted later on again
            try {
                client.stats.inc(message.guild.id, "commands"); //counting our Database stats for SERVER
                client.stats.inc("global", "commands"); //counting our Database Stats for GLOBA
                //if Command has specific permission return error
                if (command.memberpermissions) {
                    const permMap = { 'Administrador': 'Administrator' };
                    const resolvedPerms = command.memberpermissions.map(p => permMap[p] || p);
                    if (!message.member.permissions.has(resolvedPerms)) {
                        not_allowed = true;
                        try {
                            message.react("833101993668771842").catch(() => {});
                        } catch {}
                        message
                            .reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.wrongcolor)
                                        .setFooter(client.getFooter(es))
                                        .setTitle(client.la[ls].common.permissions.title)
                                        .setDescription(
                                            `${client.la[ls].common.permissions.description}\n> \`${command.memberpermissions.join("`, ``")}\``
                                        ),
                                ],
                            })
                            .then(async msg => {
                                setTimeout(() => {
                                    try {
                                        msg.delete().catch(() => {});
                                    } catch {}
                                }, 5000);
                            })
                            .catch(() => {});
                    }
                }
                //if Command has specific permission return error

                ///////////////////////////////
                ///////////////////////////////
                ///////////////////////////////
                ///////////////////////////////

                const player = client.shoukaku?.players?.get(message.guild.id) ?? null;
                const mstate = player ? (client.music?.getState(message.guild.id) ?? null) : null;

                if (player?.node && !player.node.connected) player.node.connect();

                if (command.parameters) {
                    if (command.parameters.type == "music") {
                        const { channel } = message.member.voice;
                        const mechannel = message.guild.members.me.voice.channel;

                        if (!channel) {
                            not_allowed = true;
                            return message.reply({
                                embeds: [new EmbedBuilder().setColor(es.wrongcolor).setFooter(client.getFooter(es)).setTitle(client.la[ls].common.join_vc)],
                            }).catch(() => {});
                        }

                        if (!player && mechannel) {
                            await message.guild.members.me.voice.disconnect().catch(() => {});
                            await delay(350);
                        }

                        if (mstate?.currentTrack && command.parameters.check_dj) {
                            const djResult = check_if_dj(client, message.member, mstate.currentTrack?.info || mstate.currentTrack);
                            if (djResult) {
                                return message.reply({
                                    embeds: [new EmbedBuilder().setColor(ee.wrongcolor).setFooter(client.getFooter(es))
                                        .setTitle(`<:no:833101993668771842> **¡No eres DJ ni el solicitante de la canción!**`)
                                        .setDescription(`**ROLES DE DJ:**\n${djResult}`)],
                                }).catch(() => {});
                            }
                        }

                        if (command.parameters.activeplayer) {
                            if (!player || !mstate?.currentTrack) {
                                not_allowed = true;
                                return message.reply({
                                    embeds: [new EmbedBuilder().setColor(es.wrongcolor).setFooter(client.getFooter(es)).setTitle(client.la[ls].common.nothing_playing)],
                                }).catch(() => {});
                            }
                            if (!mechannel) {
                                try { await client.shoukaku?.leaveVoiceChannel(message.guild.id); await delay(350); } catch {}
                                not_allowed = true;
                                return message.reply({
                                    embeds: [new EmbedBuilder().setColor(es.wrongcolor).setFooter(client.getFooter(es)).setTitle(client.la[ls].common.not_connected)],
                                }).catch(() => {});
                            }
                        }

                        if (command.parameters.previoussong) {
                            if (!mstate?.history?.length) {
                                not_allowed = true;
                                return message.reply({
                                    embeds: [new EmbedBuilder().setColor(es.wrongcolor).setFooter(client.getFooter(es)).setTitle(client.la[ls].common.nothing_playing)],
                                }).catch(() => {});
                            }
                        }

                        const vcId = mstate?.voiceChannelId || mechannel?.id;
                        if (vcId && channel.id !== vcId && !command.parameters.notsamechannel) {
                            return message.reply({
                                embeds: [new EmbedBuilder().setColor(es.wrongcolor).setFooter(client.getFooter(es))
                                    .setTitle(client.la[ls].common.wrong_vc).setDescription(`Canal: <#${vcId}>`)],
                            }).catch(() => {});
                        }
                    }
                }
                ///////////////////////////////
                ///////////////////////////////
                ///////////////////////////////
                ///////////////////////////////
                //run the command with the parameters:  client, message, args, user, text, prefix,
                if (not_allowed) return;
                //Ensure the Complete Databasing Setup, only if the it's a Setup Command (PERFORMANCE IMPROVENEMTNS)
                if (command.category === "💪 Setup") {
                    databasing(client, message.guild.id, message.author.id);
                }
                //Execute the Command
                command.run(client, message, args, message.member, args.join(" "), prefix, player);
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                return message
                    .reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(client.getFooter(es))
                                .setTitle(client.la[ls].common.somethingwentwrong)
                                .setDescription(
                                    `\`\`\`${e.message ? e.message : e.stack ? String(e.stack).grey.substring(0, 2000) : String(e).grey.substring(0, 2000)}\`\`\``
                                ),
                        ],
                    })
                    .then(async msg => {
                        setTimeout(() => {
                            try {
                                msg.delete().catch(() => {});
                            } catch {}
                        }, 5000);
                    })
                    .catch(() => {});
            }
        } else if (!customcmd) {
            if (unkowncmdmessage) {
                message
                    .reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(client.getFooter(es))
                                .setTitle(handlemsg(client.la[ls].common.unknowncmd.title, { prefix: prefix }))
                                .setDescription(handlemsg(client.la[ls].common.unknowncmd.description, { prefix: prefix })),
                        ],
                    })
                    .then(async msg => {
                        setTimeout(() => {
                            try {
                                msg.delete().catch(() => {});
                            } catch {}
                        }, 5000);
                    })
                    .catch(() => {});
            }
            return;
        }
    } catch (e) {
        console.log(e.stack ? String(e.stack).grey : String(e).grey);
        return message
            .reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ED4245")
                        .setTitle("❌ Ocurrió un error")
                        .setDescription(`\`\`\`${e.message ? e.message : String(e).grey.substring(0, 2000)}\`\`\``),
                ],
            })
            .catch(() => {});
    }
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
