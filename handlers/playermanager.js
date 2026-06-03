const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
ee = require(`${process.cwd()}/botconfig/embed.json`);
const { format, delay, arrayMove } = require(`./functions`);
module.exports = async (client, message, args, type, slashCommand = false, extras = false) => {
    let method = type.includes(":") ? type.split(":") : Array(type);
    if (!message.guild) return;

    //just visual for the console

    ee = client.settings.get(message.guild.id, "embed");
    var es = client.settings.get(message.guild.id, "embed");
    if (!client.settings.has(message.guild.id, "language")) client.settings.ensure(message.guild.id, { language: "es" });
    let ls = client.settings.get(message.guild.id, "language");

    let { channel } = message.member.voice;
    let botchannel = message.guild.members.me.voice.channel;
    const permissions = channel.permissionsFor(client.user);

    if (!permissions.has("CONNECT")) {
        if (slashCommand)
            return slashCommand
                .reply({
                    ephemeral: true,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(ee.wrongcolor)
                            .setFooter(client.getFooter(ee))
                            .setTitle(eval(client.la[ls]["handlers"]["playermanagerjs"]["playermanager"]["variable1"])),
                    ],
                })
                .catch(e => console.log(String(e).grey));
        return message
            .reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(ee.wrongcolor)
                        .setFooter(client.getFooter(ee))
                        .setTitle(eval(client.la[ls]["handlers"]["playermanagerjs"]["playermanager"]["variable1"])),
                ],
            })
            .catch(e => console.log(String(e).grey));
    }
    if (!permissions.has("SPEAK")) {
        if (slashCommand)
            return slashCommand
                .reply({
                    ephemeral: true,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(ee.wrongcolor)
                            .setFooter(client.getFooter(ee))
                            .setTitle(eval(client.la[ls]["handlers"]["playermanagerjs"]["playermanager"]["variable2"])),
                    ],
                })
                .catch(e => console.log(String(e).grey));
        return message
            .reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(ee.wrongcolor)
                        .setFooter(client.getFooter(ee))
                        .setTitle(eval(client.la[ls]["handlers"]["playermanagerjs"]["playermanager"]["variable2"])),
                ],
            })
            .catch(e => console.log(String(e).grey));
    }
    if (!botchannel && channel.userLimit != 0 && channel.full) {
        if (slashCommand)
            return slashCommand
                .reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("❌ Your Voice Channel is full!")
                            .setColor(es.wrongcolor)
                            .setFooter(client.getFooter(es)),
                    ],
                })
                .catch(() => {});
        return message
            .reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Your Voice Channel is full!")
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es)),
                ],
            })
            .catch(() => {});
    }
    // Todos los tipos enrutan a song.js que usa Shoukaku directamente
    require("./playermanagers/song")(client, message, args, type, slashCommand, extras);
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://discord.gg/milrato
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention him / Milrato Development, when using this Code!
 * @INFO
 */
