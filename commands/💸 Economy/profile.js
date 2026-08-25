const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { parseMilliseconds, duration, GetUser, nFormatter, ensure_economy_user } = require(
    `${process.cwd()}/handlers/functions`
);
module.exports = {
    name: "profile",
    category: "💸 Economy",
    aliases: ["ecoprofile"],
    description: "Shows the Profile of a Usuario",
    usage: "profile [@USER]",
    type: "info",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        const isSpanish = ls === "es";
        if (!client.settings.get(message.guild.id, "ECONOMY")) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.disabled.title)
                        .setDescription(
                            require(`${process.cwd()}/handlers/functions`).handlemsg(
                                client.la[ls].common.disabled.description,
                                { prefix: prefix }
                            )
                        ),
                ],
            });
        }
        try {
            //command
            var user;
            if (args[0]) {
                try {
                    user = await GetUser(message, args);
                } catch (e) {
                    if (!e) return message.reply(isSpanish
                        ? "<:no:833101993668771842> NO SE PUDO ENCONTRAR AL USUARIO"
                        : "<:no:833101993668771842> UNABLE TO FIND THE USER");
                    return message.reply({
                        content: `\`\`\`${String(e?.message || e).substring(0, 1900)}\`\`\``,
                    });
                }
            } else {
                user = message.author;
            }
            if (!user || user == null || user.id == null || !user.id) user = message.author;
            if (user.bot) return message.reply(isSpanish
                ? "<:no:833101993668771842> **Un bot de Discord no puede tener economía.**"
                : "<:no:833101993668771842> **A Discord bot cannot have an economy profile.**");

            //ensure the economy data
            ensure_economy_user(client, message.guild.id, user.id);
            //get the economy data
            const data = client.economy.get(`${message.guild.id}-${user.id}`);
            var items = 0;
            var itemsvalue = 0;
            var theitems = [];
            for (const itemarray in data.items) {
                items += data.items[`${itemarray}`];
                var prize = 0;
                switch (itemarray.toLowerCase()) {
                    case "yacht":
                        prize = 75000;
                        break;
                    case "lamborghini":
                        prize = 50000;
                        break;
                    case "car":
                        prize = 6400;
                        break;
                    case "motorbike":
                        prize = 1500;
                        break;
                    case "bicycle":
                        prize = 500;
                        break;

                    case "nike":
                        prize = 300;
                        break;
                    case "tshirt":
                        prize = 60;
                        break;

                    case "mansion":
                        prize = 45000;
                        break;
                    case "house":
                        prize = 8000;
                        break;
                    case "dirthut":
                        prize = 150;
                        break;

                    case "pensil":
                        prize = 20;
                        break;
                    case "pen":
                        prize = 10;
                        break;
                    case "condom":
                        prize = 30;
                        break;
                    case "bottle":
                        prize = 50;
                        break;

                    case "fish":
                        prize = 1000;
                        break;
                    case "hamster":
                        prize = 1500;
                        break;
                    case "dog":
                        prize = 2000;
                        break;
                    case "cat":
                        prize = 2000;
                        break;
                }
                itemsvalue += Number(prize) * Number(data.items[`${itemarray}`]);
            }
            for (const itemarray in data.items) {
                if (data.items[`${itemarray}`] == 0) continue;
                switch (itemarray.toLowerCase()) {
                    case "yacht":
                        theitems.push(
                            `🛥️ ${data.items[`${itemarray}`]} Yacht${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(75000 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "lamborghini":
                        theitems.push(
                            `🏎️ ${data.items[`${itemarray}`]} Lamborghini${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(50000 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "car":
                        theitems.push(
                            `🚗 ${data.items[`${itemarray}`]} Car${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(6400 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "motorbike":
                        theitems.push(
                            `🏍️ ${data.items[`${itemarray}`]} Motorbike${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(1500 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "bicycle":
                        theitems.push(
                            `🚲 ${data.items[`${itemarray}`]} Bicycle${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(500 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;

                    case "nike":
                        theitems.push(
                            `👟 ${data.items[`${itemarray}`]} Nike${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(300 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "tshirt":
                        theitems.push(
                            `👕 ${data.items[`${itemarray}`]} T-Shirt${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(60 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;

                    case "mansion":
                        theitems.push(
                            `🏘️ ${data.items[`${itemarray}`]} Mansion${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(45000 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "house":
                        theitems.push(
                            `🏠 ${data.items[`${itemarray}`]} House${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(8000 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "dirthut":
                        theitems.push(
                            `🟫 ${data.items[`${itemarray}`]} Dirthut${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(150 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;

                    case "pensil":
                        theitems.push(
                            `✏️ ${data.items[`${itemarray}`]} Pensil${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(20 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "pen":
                        theitems.push(
                            `🖊️ ${data.items[`${itemarray}`]} Pen${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(10 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "condom":
                        theitems.push(
                            `🟪 ${data.items[`${itemarray}`]} Condom${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(30 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "bottle":
                        theitems.push(
                            `🍼 ${data.items[`${itemarray}`]} Bottle${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(50 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;

                    case "fish":
                        theitems.push(
                            `🐟 ${data.items[`${itemarray}`]} Fish${data.items[`${itemarray}`] > 1 ? "es" : ""} | \`${nFormatter(1000 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "hamster":
                        theitems.push(
                            `🐹 ${data.items[`${itemarray}`]} Hamster${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(1500 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "dog":
                        theitems.push(
                            `🐕 ${data.items[`${itemarray}`]} Dog${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(2000 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                    case "cat":
                        theitems.push(
                            `😺 ${data.items[`${itemarray}`]} Cat${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(2000 * data.items[`${itemarray}`])} 💸\``
                        );
                        break;
                }
            }
            const viewingSelf = user.id === message.author.id;
            const subject = viewingSelf ? (isSpanish ? "Tú" : "You") : user.username;
            const profileTitle = isSpanish
                ? `🧸 **${subject}** ${viewingSelf ? "tienes" : "tiene"} \`${nFormatter(items)} artículos\` con un valor de \`${nFormatter(itemsvalue)} 💸\``
                : `🧸 **${subject}** ${viewingSelf ? "have" : "has"} \`${nFormatter(items)} items\` worth \`${nFormatter(itemsvalue)} 💸\``;
            const emptyInventory = isSpanish
                ? `\`${nFormatter(Math.floor(data.balance))} 💸\` ${viewingSelf ? "Aún no tienes" : "Aún no tiene"} artículos.`
                : `\`${nFormatter(Math.floor(data.balance))} 💸\` ${viewingSelf ? "You have" : "They have"} no items yet.`;
            const profileDescription = isSpanish
                ? `👛 **${subject}** ${viewingSelf ? "tienes" : "tiene"} \`${nFormatter(Math.floor(data.balance))} 💸\` en el bolsillo\n**🏦 ${subject} ${viewingSelf ? "tienes" : "tiene"} \`${nFormatter(data.bank)} 💸\` en el banco**\n\`\`\` \`\`\`**ARTÍCULOS:**\n${theitems.length ? ">>> " + theitems.join("\n\n") : emptyInventory}`
                : `👛 **${subject}** ${viewingSelf ? "have" : "has"} \`${nFormatter(Math.floor(data.balance))} 💸\` in the pocket\n**🏦 ${subject} ${viewingSelf ? "have" : "has"} \`${nFormatter(data.bank)} 💸\` in the bank**\n\`\`\` \`\`\`**ITEMS:**\n${theitems.length ? ">>> " + theitems.join("\n\n") : emptyInventory}`;
            //return some message!
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setFooter({ text: user.username, iconURL: user.displayAvatarURL() })
                        .setTitle(profileTitle)
                        .setDescription(profileDescription),
                ],
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(`\`\`\`${String(e?.message || e?.stack || e).substring(0, 1900)}\`\`\``),
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
