var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var radios = require(`../../botconfig/radiostations.json`);
var { stations, databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-radio",
    category: "💪 Setup",
    aliases: [
        "setupradio",
        "setup-waitingroom",
        "setupwaitingroom",
        "radio-setup",
        "radiosetup",
        "waitingroom-setup",
        "waitingroomsetup",
    ],
    cooldown: 10,
    usage: "setup-radio <RadioStation Num.>   -->    while beeing in a radio station",
    description: "Gestiona el Sistema de Sala de Espera / Sistema de Radio 24/7",
    memberpermissions: ['Administrador'],
    type: "fun",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            var adminroles = client.settings.get(message.guild.id, "adminroles");
            var { guild } = message;
            //get the channel instance from the Member
            var { channel } = message.member.voice;
            //if the member is not in a channel, return
            if (!channel)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-radio"]["variable1"])),
                    ],
                });
            //get the player instance
            var player = client.shoukaku?.players?.get(message.guild.id) ?? null;
            //if there is an active player, disconnect it before starting the radio
            if (player) { try { await client.shoukaku.leaveVoiceChannel(message.guild.id); } catch {} }
            //if no args send all stations
            if (!args[0]) return stations(client, config.prefix, message);
            //if not a number error
            if (isNaN(args[0])) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter({ text: client.user.username,
                                iconURL: es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                            })
                            .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-radio"]["variable2"]))
                            .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-radio"]["variable3"])),
                    ],
                });
            }
            //if the volume number is not valid
            if (Number(args[1]) > 150 || Number(args[1]) < 1)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter({ text: client.user.username,
                                iconURL: es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                            })
                            .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-radio"]["variable4"]))
                            .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-radio"]["variable5"])),
                    ],
                });
            //define the volume
            var volume;
            //if its not a number for volume, set it to 50
            if (isNaN(args[1])) {
                volume = 50;
            }
            //otherwise set it to the args
            else {
                volume = args[1];
            }
            //define args 2 of each single input
            var args2;
            function lengthUntil(array) {
                let lastitem = array[array.length - 1];
                let flatObject = [
                    ,
                    ...Object.values(radios.REYFM),
                    ...Object.values(radios.ILOVERADIO),
                    ...Object.values(radios.EU),
                    ...Object.values(radios.OTHERS),
                ];
                let allArray = [];
                for (const element of flatObject) {
                    if (Array.isArray(element)) for (const e of element) allArray.push(e);
                    else allArray.push(element);
                }
                return allArray.indexOf(lastitem);
            }

            if (Number([args[0]]) > 0 && Number([args[0]]) <= lengthUntil(radios.REYFM))
                args2 = radios.REYFM[Number([args[0]]) - 1].split(` `);
            else if (Number([args[0]]) > lengthUntil(radios.REYFM) && Number([args[0]]) <= lengthUntil(radios.ILOVERADIO))
                args2 = radios.ILOVERADIO[Number([args[0]]) - 1 - lengthUntil(radios.REYFM)].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.ILOVERADIO) &&
                Number([args[0]]) <= lengthUntil(radios.EU.United_Kingdom)
            )
                args2 = radios.EU.United_Kingdom[Number([args[0]]) - 1 - lengthUntil(radios.ILOVERADIO)].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.United_Kingdom) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Austria)
            )
                args2 = radios.EU.Austria[Number([args[0]]) - 1 - lengthUntil(radios.EU.United_Kingdom)].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Austria) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Belgium)
            )
                args2 = radios.EU.Belgium[Number([args[0]]) - lengthUntil(radios.EU.Austria) - 1].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Belgium) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Bosnia)
            )
                args2 = radios.EU.Bosnia[Number([args[0]]) - lengthUntil(radios.EU.Belgium) - 1].split(` `);
            else if (Number([args[0]]) > lengthUntil(radios.EU.Bosnia) && Number([args[0]]) <= lengthUntil(radios.EU.Czech))
                args2 = radios.EU.Czech[Number([args[0]]) - lengthUntil(radios.EU.Bosnia) - 1].split(` `);
            else if (Number([args[0]]) > lengthUntil(radios.EU.Czech) && Number([args[0]]) <= lengthUntil(radios.EU.Denmark))
                args2 = radios.EU.Denmark[Number([args[0]]) - lengthUntil(radios.EU.Czech) - 1].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Denmark) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Germany)
            )
                args2 = radios.EU.Germany[Number([args[0]]) - lengthUntil(radios.EU.Denmark) - 1].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Germany) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Hungary)
            )
                args2 = radios.EU.Hungary[Number([args[0]]) - lengthUntil(radios.EU.Germany) - 1].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Hungary) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Ireland)
            )
                args2 = radios.EU.Ireland[Number([args[0]]) - lengthUntil(radios.EU.Hungary) - 1].split(` `);
            else if (Number([args[0]]) > lengthUntil(radios.EU.Ireland) && Number([args[0]]) <= lengthUntil(radios.EU.Italy))
                args2 = radios.EU.Italy[Number([args[0]]) - lengthUntil(radios.EU.Ireland) - 1].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Italy) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Luxembourg)
            )
                args2 = radios.EU.Luxembourg[Number([args[0]]) - lengthUntil(radios.EU.Italy) - 1].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Luxembourg) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Romania)
            )
                args2 = radios.EU.Romania[Number([args[0]]) - lengthUntil(radios.EU.Luxembourg) - 1].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Romania) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Serbia)
            )
                args2 = radios.EU.Serbia[Number([args[0]]) - lengthUntil(radios.EU.Romania) - 1].split(` `);
            else if (Number([args[0]]) > lengthUntil(radios.EU.Serbia) && Number([args[0]]) <= lengthUntil(radios.EU.Spain))
                args2 = radios.EU.Spain[Number([args[0]]) - lengthUntil(radios.EU.Serbia) - 1].split(` `);
            else if (Number([args[0]]) > lengthUntil(radios.EU.Spain) && Number([args[0]]) <= lengthUntil(radios.EU.Sweden))
                args2 = radios.EU.Sweden[Number([args[0]]) - lengthUntil(radios.EU.Spain) - 1].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Sweden) &&
                Number([args[0]]) <= lengthUntil(radios.EU.Ukraine)
            )
                args2 = radios.EU.Ukraine[Number([args[0]]) - lengthUntil(radios.EU.Sweden) - 1].split(` `);
            else if (
                Number([args[0]]) > lengthUntil(radios.EU.Ukraine) &&
                Number([args[0]]) <= lengthUntil(radios.OTHERS.request)
            )
                args2 = radios.OTHERS.request[Number([args[0]]) - lengthUntil(radios.EU.Ukraine) - 1].split(` `);
            //if not found send an error
            else
                return message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setTitle(`${emoji.msg.ERROR} Error | Radio Station not found`)
                            .setDescription(
                                `Por favor use a Station between \`1\` and \`${lengthUntil(radios.OTHERS.request)}\``
                            ),
                    ],
                });
            //get song information of it
            var song = { title: args2[0].replace(`-`, ` `), url: args2[1] };
            //define an embed
            var embed = new EmbedBuilder()
                .setColor(es.color)
                .setFooter(client.getFooter(es))
                .setTitle(`Searching: ${emoji?.msg.search}` + song.title);
            try {
                embed.setURL(song.url);
            } catch {}
            //send the message of the searching
            message.reply(
                new Discord.EmbedBuilder()
                    .setTitle(`${allEmojis.msg.notes} Configuración Complete for Radio Station:  ` + song.title)
                    .setColor("#7fafe3")
                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-radio"]["variable8"]))
                    .setURL(song.url)
                    .setFooter({ text: client.user.username,
                        iconURL: es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                    })
            );

            client.settings.set(message.guild.id, channel.id, `channel`);
            client.settings.set(message.guild.id, song.url, `song`);
            client.settings.set(message.guild.id, volume, `volume`);
            //play the radio via client.music (Shoukaku)
            await client.music.play(
                message.guild.id,
                channel.id,
                message.channel.id,
                client.settings.get(message.guild.id, `song`),
                message.author
            );
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-radio"]["variable9"])),
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
