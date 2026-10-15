const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder,
    ButtonStyle
} = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var radios = require(`../../botconfig/radiostations.json`);
var { stations, databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-music",
    category: "Setup",
    aliases: ["setupmusic"],
    cooldown: 10,
    usage: "setup-music #Canal",
    description: "Configuración de un Canal de Solicitud de Música",
    memberpermissions: ['Administrador'],
    type: "fun",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            //I AM NOW MAKING A MUSIC REQUEST SYSTEM FOR A BOT!
            client.musicsettings.ensure(message.guild.id, {
                channel: "",
                message: "",
            });
            //first declare all embeds
            var embeds = [
                new EmbedBuilder()
                    .setColor(es.color)
                    .setTitle(obeyUi.limit(`📃 Cola of __${message.guild.name}__`, 256))
                    .setDescription(obeyUi.limit(`**Currently there are __0 Songs__ in the Cola**`, 4096))
                    .setThumbnail(message.guild.iconURL()),
                new EmbedBuilder()
                    .setColor(es.color)
                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                    .setImage(
                        message.guild.banner ? message.guild.bannerURL({ size: 4096 }) : "https://imgur.com/jLvYdb4.png"
                    )
                    .setTitle(
                        obeyUi.limit(`Start Listening to Music, by connecting to a Voice Canal and sending either the **SONG LINK** or **SONG NAME** in this Canal!`, 256)
                    )
                    .setDescription(
                        obeyUi.limit(`> *I support ${allEmojis.msg.youtube} Youtube, ${allEmojis.msg.spotify} Spotify, ${allEmojis.msg.soundcloud} Soundcloud and direct MP3 Links!*`, 4096)
                    ),
            ];
            //now we add the components!
            var components = [
                new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("Join")
                        .setEmoji(obeyUi.component(`👌`))
                        .setLabel(obeyUi.plain(`Join`))
                        .setDisabled(false),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId("Leave")
                        .setEmoji(obeyUi.component(`👋`))
                        .setLabel(obeyUi.plain(`Leave`))
                        .setDisabled(),
                ]),
                new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("Skip")
                        .setEmoji(obeyUi.component(`⏭`))
                        .setLabel(obeyUi.plain(`Skip`))
                        .setDisabled(),
                    new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId("Stop").setEmoji(obeyUi.component(`🏠`)).setLabel(obeyUi.plain(`Stop`)).setDisabled(),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId("Pause")
                        .setEmoji(obeyUi.component("⏸"))
                        .setLabel(obeyUi.plain(`Pause`))
                        .setDisabled(),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("Autoplay")
                        .setEmoji(obeyUi.component("🔁"))
                        .setLabel(obeyUi.plain(`Autoplay`))
                        .setDisabled(),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("Shuffle")
                        .setEmoji(obeyUi.component("🔀"))
                        .setLabel(obeyUi.plain(`Shuffle`))
                        .setDisabled(),
                ]),
                new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("Song")
                        .setEmoji(obeyUi.component(`🔁`))
                        .setLabel(obeyUi.plain(`Song`))
                        .setDisabled(),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("Queue")
                        .setEmoji(obeyUi.component(`🔂`))
                        .setLabel(obeyUi.plain(`Queue`))
                        .setDisabled(),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("Forward")
                        .setEmoji(obeyUi.component("⏩"))
                        .setLabel(obeyUi.plain(`+10 Sec`))
                        .setDisabled(),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("Rewind")
                        .setEmoji(obeyUi.component("⏪"))
                        .setLabel(obeyUi.plain(`-10 Sec`))
                        .setDisabled(),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("Lyrics")
                        .setEmoji(obeyUi.component("📝"))
                        .setLabel(obeyUi.plain(`Lyrics`))
                        .setDisabled(),
                ]),
            ];
            let channel = message.mentions.channels.first();
            if (!channel) return message.reply(obeyUi.owned("❌ **¡Olvidaste mencionar un canal de texto!**"));
            //send the data in the channel
            channel.send({ embeds, components }).then(msg => {
                client.musicsettings.set(message.guild.id, channel.id, "channel");
                client.musicsettings.set(message.guild.id, msg.id, "message");
                //send a success message
                return message.reply(`${obeyUi.markup("icon.success")} **Successfully setupped the Music System in:** <#${channel.id}>`);
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-radio"]["variable9"]), 4096)),
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
