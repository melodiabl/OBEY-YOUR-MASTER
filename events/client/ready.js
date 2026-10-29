//here the event starts
let config = require(`${process.cwd()}/botconfig/config.json`);
const Discord = require("discord.js");
const { botStatusRuntime } = require('../../handlers/bot-status-runtime');
module.exports = client => {
    //SETTING ALL GUILD DATA FOR THE DJ ONLY COMMANDS for the DEFAULT
    //client.guilds.cache.forEach(guild=>client.settings.set(guild.id, ["autoplay", "clearqueue", "forward", "loop", "jump", "loopqueue", "loopsong", "move", "pause", "resume", "removetrack", "removedupe", "restart", "rewind", "seek", "shuffle", "skip", "stop", "volume"], "djonlycmds"))
    try {
        try {
            const stringlength = 69;
            console.log("\n");
            console.log(`     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`.bold.brightGreen);
            console.log(`     ┃ `.bold.brightGreen + " ".repeat(-1 + stringlength - ` ┃ `.length) + "┃".bold.brightGreen);
            console.log(
                `     ┃ `.bold.brightGreen +
                    `Discord Bot is online!`.bold.brightGreen +
                    " ".repeat(-1 + stringlength - ` ┃ `.length - `Discord Bot is online!`.length) +
                    "┃".bold.brightGreen
            );
            console.log(
                `     ┃ `.bold.brightGreen +
                    ` /--/ ${client.user.username} /--/ `.bold.brightGreen +
                    " ".repeat(-1 + stringlength - ` ┃ `.length - ` /--/ ${client.user.username} /--/ `.length) +
                    "┃".bold.brightGreen
            );
            console.log(`     ┃ `.bold.brightGreen + " ".repeat(-1 + stringlength - ` ┃ `.length) + "┃".bold.brightGreen);
            console.log(`     ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`.bold.brightGreen);
        } catch {
            /* */
        }

        console.table({
            "Bot User:": `${client.user.username}`,
            "Guild(s):": `${client.guilds.cache.size} Servers`,
            "Watching:": `${client.guilds.cache.reduce((a, b) => a + b?.memberCount, 0)} Members`,
            "Prefix:": `${config.prefix}`,
            "Commands:": `${client.commands.size}`,
            "Discord.js:": `v${Discord.version}`,
            "Node.js:": `${process.version}`,
            "Plattform:": `${process.platform} ${process.arch}`,
            "Memory:": `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        });

        botStatusRuntime(client).start();

        // Auto-deploy slash commands globales al iniciar
        if (client.allCommands && client.allCommands.length > 0) {
            client.application.commands.set(client.allCommands)
                .then(d => console.log(`[Slash] ${d.size} slash commands desplegados globalmente.`.cyan))
                .catch(e => console.warn('[Slash] No se pudo desplegar:', e.message))
        }
    } catch (e) {
        console.log(String(e.stack).grey.bgRed);
    }
};
