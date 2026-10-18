const { ActionRowBuilder,
    ChannelType
} = require("discord.js");
module.exports = client => {
    client.disableComponentMessage = C => {
        if (C && C.message && C.message.components.length > 0) {
            if (C.replied) {
                C.edit({
                    components: client.getDisabledComponents(C.message.components),
                }).catch(() => null);
            } else {
                C.update({
                    components: client.getDisabledComponents(C.message.components),
                }).catch(() => null);
            }
            return true;
        }
        return;
    };
    client.getDisabledComponents = MessageComponents => {
        if (!MessageComponents) return []; // Returning so it doesn't crash

        return MessageComponents.map(({ components }) => {
            return new ActionRowBuilder().addComponents(components.map(c => c.setDisabled(true)));
        });
    };
    client.getFooter = (es, stringurl = null) => {
        //allow inputs: ({footericon, footerurl}) and (footericon, footerurl);
        let embedData = {};
        if (typeof es !== "object") embedData = { footertext: es, footericon: stringurl };
        else embedData = es;

        let text = embedData.footertext;
        let iconURL = embedData.footericon;
        if (!text || text.length < 1) text = `${client.user.username}`;
        if (!iconURL || iconURL.length < 1) iconURL = `${client.user.displayAvatarURL()}`;

        //Change the lengths
        iconURL = iconURL.trim();
        text = text.trim().substring(0, 2048);

        //verify the iconURL
        if (!iconURL.startsWith("https://") && !iconURL.startsWith("http://")) iconURL = client.user.displayAvatarURL();
        if (![".png", ".jpg", ".wpeg", ".webm", ".gif"].some(d => iconURL.toLowerCase().endsWith(d)))
            iconURL = client.user.displayAvatarURL();
        //return the footerobject
        return { text, iconURL };
    };

    client.getAuthor = (authorname = null, authoricon = null, authorurl = null) => {
        //allow inputs: ({footericon, footerurl}) and (footericon, footerurl);
        let name = authorname;
        let iconURL = authoricon;
        let url = authorurl;

        if (!name || name.length < 1) name = `${client.user.username}`;
        if (!iconURL || iconURL.length < 1) iconURL = `${client.user.displayAvatarURL()}`;
        if (!url || url.length < 1) url = `https://github.com/melodiabl`;

        //Change the lengths
        iconURL = iconURL.trim();
        name = name.trim().substring(0, 2048);

        //verify the iconURL
        if (!url.startsWith("https://") && !url.startsWith("http://")) url = `https://github.com/melodiabl`;
        if (!iconURL.startsWith("https://") && !iconURL.startsWith("http://")) iconURL = client.user.displayAvatarURL();
        if (![".png", ".jpg", ".wpeg", ".webm", ".gif"].some(d => iconURL.toLowerCase().endsWith(d)))
            iconURL = client.user.displayAvatarURL();
        //return the footerobject
        return { name, iconURL, url };
    };

    process.on("unhandledRejection", (reason, p) => {
        console.log("\n\n\n\n\n=== unhandled Rejection ===".toUpperCase().yellow.dim);
        console.log("Reason: ", reason.stack ? String(reason.stack).gray : String(reason).gray);
        console.log("=== unhandled Rejection ===\n\n\n\n\n".toUpperCase().yellow.dim);
    });
    process.on("uncaughtException", (err, origin) => {
        console.log("\n\n\n\n\n\n=== uncaught Exception ===".toUpperCase().yellow.dim);
        console.log("Exception: ", err.stack ? err.stack : err);
        console.log("=== uncaught Exception ===\n\n\n\n\n".toUpperCase().yellow.dim);
    });
    process.on("uncaughtExceptionMonitor", (err, origin) => {
        console.log("=== uncaught Exception Monitor ===".toUpperCase().yellow.dim);
    });
    process.on("multipleResolves", (type, promise, reason) => {
        /* console.log('\n\n\n\n\n=== multiple Resolves ==='.toUpperCase().yellow.dim);
    console.log(type, promise, reason);
    console.log('=== multiple Resolves ===\n\n\n\n\n'.toUpperCase().yellow.dim);
  */
    });

    client.on("messageCreate", message => {
        if (!message.guild || message.guild.available === false) return;
        if (message.guild && message.author.id == client.user.id && message.embeds.length > 0) {
            if (message.channel.type == ChannelType.GuildAnnouncement) {
                setTimeout(() => {
                    if (message.crosspostable) {
                        message
                            .crosspost()
                            .then(msg => console.log("Message got Crossposted".green))
                            .catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey));
                    }
                }, client.ws.ping);
            }
        }
    });
    //ALWAYS SERVER DEAF THE BOT WHEN JOING
    client.on("voiceStateUpdate", (oldState, newState) => {
        try {
            //skip if not the bot
            if (client.user.id != newState.id) return;
            if (
                (!oldState.streaming && newState.streaming) ||
                (oldState.streaming && !newState.streaming) ||
                (!oldState.serverDeaf && newState.serverDeaf) ||
                (oldState.serverDeaf && !newState.serverDeaf) ||
                (!oldState.serverMute && newState.serverMute) ||
                (oldState.serverMute && !newState.serverMute) ||
                (!oldState.selfDeaf && newState.selfDeaf) ||
                (oldState.selfDeaf && !newState.selfDeaf) ||
                (!oldState.selfMute && newState.selfMute) ||
                (oldState.selfMute && !newState.selfMute) ||
                (!oldState.selfVideo && newState.selfVideo) ||
                (oldState.selfVideo && !newState.selfVideo)
            )
                if ((!oldState.channelId && newState.channelId) || (oldState.channelId && newState.channelId)) {
                    try {
                        newState.setDeaf(true);
                    } catch {}
                    return;
                }
        } catch {}
    });
    //ANTI UNMUTE THING
    client.on("voiceStateUpdate", async (oldState, newState) => {
        if (newState.id === client.user.id && oldState.serverDeaf === true && newState.serverDeaf === false) {
            try {
                newState.setDeaf(true).catch(() => {});
            } catch (e) {
                //console.log(e)
            }
        }
    });

    return;
};
