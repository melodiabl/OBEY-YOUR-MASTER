//Import Modules
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const settings = require(`../../botconfig/settings.json`);
const { onCoolDown, escapeRegex, delay, simple_databasing, databasing, handlemsg, check_if_dj } = require(
    `${process.cwd()}/handlers/functions`
);
const Discord = require("discord.js");
module.exports = async (client, interaction) => {
    console.log(`[EVENT-FIRE] interactionCreate triggered — type: ${interaction?.type} | user: ${interaction?.user?.tag} | guild: ${interaction?.guild?.name}`);
    // Autocomplete handler
    if (interaction?.isAutocomplete()) {
        const CategoryName = interaction?.commandName
        const subCmd = interaction?.options.getSubcommand(false)
        let cmd = false
        if (subCmd && client.slashCommands.has(CategoryName + subCmd)) cmd = client.slashCommands.get(CategoryName + subCmd)
        else if (client.slashCommands.has('normal' + CategoryName)) cmd = client.slashCommands.get('normal' + CategoryName)
        if (cmd?.autocomplete) {
            try { await cmd.autocomplete(client, interaction) } catch {}
        }
        return
    }
    if (!interaction?.isChatInputCommand()) return;
    const {
        member,
        channelId,
        guildId,
        applicationId,
        commandName,
        deferred,
        replied,
        ephemeral,
        options,
        id,
        createdTimestamp,
    } = interaction;
    const { guild } = member;
    if (!guild) {
        return interaction
            ?.reply({ content: "❌ ¡Las interacciones solo funcionan dentro de servidores!", ephemeral: true })
            .catch(() => {});
    }
    const CategoryName = interaction?.commandName;
    simple_databasing(client, guild.id, member.id);
    var not_allowed = false;
    const guild_settings = client.settings.get(guild.id) || {};
    let es = guild_settings.embed || { color: '#fffff9', wrongcolor: '#e01e01', thumb: false, footertext: '', footericon: '' };
    let ls = guild_settings.language && client.la[guild_settings.language] ? guild_settings.language : 'es';
    let prefix = guild_settings.prefix || config.prefix;
    let botchannel = guild_settings.botchannel || [];
    let unkowncmdmessage = guild_settings.unkowncmdmessage ?? false;
    let command = false;
    const subCmd = interaction?.options.getSubcommand(false); // false = don't throw if no subcommand
    if (subCmd && client.slashCommands.has(CategoryName + subCmd)) {
        command = client.slashCommands.get(CategoryName + subCmd);
    } else if (client.slashCommands.has("normal" + CategoryName)) {
        command = client.slashCommands.get("normal" + CategoryName);
    }
    if (command) {
        if (!command.category?.toLowerCase().includes("nsfw") && botchannel.toString() !== "") {
            if (!botchannel.includes(channelId) && !member.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
                for (const channelId of botchannel) {
                    let channel = guild.channels.cache.get(channelId);
                    if (!channel) {
                        client.settings.remove(guild.id, channelId, `botchannel`);
                    }
                }
                not_allowed = true;
                return interaction?.reply({
                    ephemeral: true,
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(client.getFooter(es))
                            .setTitle(client.la[ls].common.botchat.title)
                            .setDescription(
                                `${client.la[ls].common.botchat.description}\n> ${botchannel.map(c => `<#${c}>`).join(", ")}`
                            ),
                    ],
                });
            }
        }
        if (!client.cooldowns.has(command.name)) {
            //if its not in the cooldown, set it too there
            client.cooldowns.set(command.name, new Discord.Collection());
        }
        const now = Date.now(); //get the current time
        const timestamps = client.cooldowns.get(command.name); //get the timestamp of the last used commands
        const cooldownAmount = (command.cooldown || 1) * 1000; //get the cooldownamount of the command, if there is no cooldown there will be automatically 1 sec cooldown, so you cannot spam it^^
        if (timestamps.has(member.id)) {
            //if the user is on cooldown
            const expirationTime = timestamps.get(member.id) + cooldownAmount; //get the amount of time he needs to wait until he can run the cmd again
            if (now < expirationTime) {
                //if he is still on cooldonw
                const timeLeft = (expirationTime - now) / 1000; //get the lefttime
                not_allowed = true;
                return interaction?.reply({
                    ephemeral: true,
                    embeds: [
                        new Discord.EmbedBuilder().setColor(es.wrongcolor).setTitle(
                            handlemsg(client.la[ls].common.cooldown, {
                                time: timeLeft.toFixed(1),
                                commandname: command.name,
                            })
                        ),
                    ],
                }); //send an information message
            }
        }
        timestamps.set(member.id, now); //if he is not on cooldown, set it to the cooldown
        setTimeout(() => timestamps.delete(member.id), cooldownAmount); //set a timeout function with the cooldown, so it gets deleted later on again
        client.stats.inc(guild.id, "commands"); //counting our Database stats for SERVER
        client.stats.inc("global", "commands"); //counting our Database Stats for GLOBAL
        //if Command has specific permission return error
        if (
            command.memberpermissions &&
            command.memberpermissions.length > 0
        ) {
            const permMap = { 'Administrador': 'Administrator' };
            const resolvedPerms = command.memberpermissions.map(p => permMap[p] || p);
            if (!interaction?.member.permissions.has(resolvedPerms)) {
                return interaction?.reply({
                    ephemeral: true,
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(client.getFooter(es))
                            .setTitle(client.la[ls].common.permissions.title)
                            .setDescription(
                                `${client.la[ls].common.permissions.description}\n> \`${command.memberpermissions.join("`, ``")}\``
                            ),
                    ],
                });
            }
        }

        const player = client.shoukaku?.players?.get(guild.id) ?? null;
        const mstate = client.music?.getState(guild.id) ?? null;

        if (player?.node && !player.node.connected) player.node.connect();

        if (command.parameters) {
            if (command.parameters.type == "music") {
                //get the channel instance
                const { channel } = member.voice;
                const mechannel = guild.members.me.voice.channel;
                //if not in a voice Channel return error
                if (!channel) {
                    not_allowed = true;
                    return interaction?.reply({
                        ephemeral: true,
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(client.getFooter(es))
                                .setTitle(client.la[ls].common.join_vc),
                        ],
                    });
                }
                //If there is no player, then kick the bot out of the channel, if connected to
                if (!player && mechannel) {
                    await guild.members.me.voice.disconnect().catch(e => {});
                    await delay(350);
                }
                if (mstate?.currentTrack && command.parameters.check_dj) {
                    if (check_if_dj(client, interaction?.member, mstate.currentTrack?.info || mstate.currentTrack)) {
                        return interaction?.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(ee.wrongcolor)
                                    .setFooter({ text: `${ee.footertext}`, iconURL: `${ee.footericon}` })
                                    .setTitle(` <:no:833101993668771842> **¡No eres DJ ni el solicitante de la canción!**`)
                                    .setDescription(` **ROLES DE DJ:**\n${check_if_dj(client, interaction?.member, mstate.currentTrack?.info || mstate.currentTrack)}`),
                            ],
                            ephemeral: true,
                        });
                    }
                }
                //if no player available return error | aka not playing anything
                if (command.parameters.activeplayer) {
                    if (!player || !mstate?.currentTrack) {
                        not_allowed = true;
                        return interaction?.reply({
                            ephemeral: true,
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(client.getFooter(es))
                                    .setTitle(client.la[ls].common.nothing_playing),
                            ],
                        });
                    }
                    if (!mechannel) {
                        try { await client.shoukaku?.leaveVoiceChannel(guild.id); await delay(350); } catch {}
                        not_allowed = true;
                        return interaction?.reply({
                            ephemeral: true,
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(client.getFooter(es))
                                    .setTitle(client.la[ls].common.not_connected),
                            ],
                        });
                    }
                }
                //if no previoussong
                if (command.parameters.previoussong) {
                    if (!mstate?.history?.length) {
                        not_allowed = true;
                        return interaction?.reply({
                            ephemeral: true,
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(es.wrongcolor)
                                    .setFooter(client.getFooter(es))
                                    .setTitle(client.la[ls].common.nothing_playing),
                            ],
                        });
                    }
                }
                // check same voice channel using Shoukaku state
                const botVcId = mstate?.voiceChannelId || mechannel?.id
                if (botVcId && channel.id !== botVcId && !command.parameters.notsamechannel) {
                    return interaction?.reply({
                        ephemeral: true,
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(client.getFooter(es))
                                .setTitle(client.la[ls].common.wrong_vc)
                                .setDescription(`Canal: <#${botVcId}>`),
                        ],
                    });
                }
            }
        }
        ///////////////////////////////
        ///////////////////////////////
        ///////////////////////////////
        ///////////////////////////////
        //run the command with the parameters:  client, message, args, user, text, prefix,
        if (not_allowed) return;
        let message = {
            applicationId: interaction?.applicationId,
            attachments: [],
            author: member.user,
            channel: guild.channels.cache.get(interaction?.channelId),
            channelId: interaction?.channelId,
            member: member,
            client: interaction?.client,
            components: [],
            content: null,
            createdAt: new Date(interaction?.createdTimestamp),
            createdTimestamp: interaction?.createdTimestamp,
            embeds: [],
            id: null,
            guild: interaction?.member.guild,
            guildId: interaction?.guildId,
        };
        //Execute the Command
        command.run(client, interaction, interaction?.member.user, es, ls, prefix, player, message);
    }
};
