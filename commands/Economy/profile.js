const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { parseMilliseconds, duration, GetUser, nFormatter, ensure_economy_user } = require(
    `${process.cwd()}/handlers/functions`
);
module.exports = {
    name: "profile",
    category: "Economy",
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
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.disabled.title, 256))
                        .setDescription(
                            obeyUi.limit(require(`${process.cwd()}/handlers/functions`).handlemsg(
                                client.la[ls].common.disabled.description,
                                { prefix: prefix }
                            ), 4096)
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
                        ? obeyUi.owned("<:no:833101993668771842> NO SE PUDO ENCONTRAR AL USUARIO")
                        : obeyUi.owned("<:no:833101993668771842> UNABLE TO FIND THE USER"));
                    return message.reply({
                        content: `\`\`\`${String(e?.message || e).substring(0, 1900)}\`\`\``,
                    });
                }
            } else {
                user = message.author;
            }
            if (!user || user == null || user.id == null || !user.id) user = message.author;
            if (user.bot) return message.reply(isSpanish
                ? obeyUi.owned("<:no:833101993668771842> **Un bot de Discord no puede tener economía.**")
                : obeyUi.owned("<:no:833101993668771842> **A Discord bot cannot have an economy profile.**"));

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
                            `${obeyUi.markup("icon.boat")} ${data.items[`${itemarray}`]} Yacht${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(75000 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "lamborghini":
                        theitems.push(
                            `${obeyUi.markup("icon.car")} ${data.items[`${itemarray}`]} Lamborghini${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(50000 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "car":
                        theitems.push(
                            `${obeyUi.markup("icon.car")} ${data.items[`${itemarray}`]} Car${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(6400 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "motorbike":
                        theitems.push(
                            `${obeyUi.markup("icon.car")} ${data.items[`${itemarray}`]} Motorbike${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(1500 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "bicycle":
                        theitems.push(
                            `${obeyUi.markup("icon.bike")} ${data.items[`${itemarray}`]} Bicycle${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(500 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;

                    case "nike":
                        theitems.push(
                            `${obeyUi.markup("icon.shoe")} ${data.items[`${itemarray}`]} Nike${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(300 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "tshirt":
                        theitems.push(
                            `${obeyUi.markup("icon.shirt")} ${data.items[`${itemarray}`]} T-Shirt${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(60 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;

                    case "mansion":
                        theitems.push(
                            `${obeyUi.markup("icon.home")} ${data.items[`${itemarray}`]} Mansion${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(45000 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "house":
                        theitems.push(
                            `${obeyUi.markup("icon.home")} ${data.items[`${itemarray}`]} House${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(8000 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "dirthut":
                        theitems.push(
                            `${obeyUi.markup("icon.game-empty")} ${data.items[`${itemarray}`]} Dirthut${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(150 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;

                    case "pensil":
                        theitems.push(
                            `${obeyUi.markup("icon.edit")} ${data.items[`${itemarray}`]} Pensil${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(20 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "pen":
                        theitems.push(
                            `${obeyUi.markup("icon.edit")} ${data.items[`${itemarray}`]} Pen${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(10 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "condom":
                        theitems.push(
                            `${obeyUi.markup("icon.piece-purple")} ${data.items[`${itemarray}`]} Condom${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(30 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "bottle":
                        theitems.push(
                            `${obeyUi.markup("icon.baby")} ${data.items[`${itemarray}`]} Bottle${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(50 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;

                    case "fish":
                        theitems.push(
                            `${obeyUi.markup("icon.fish")} ${data.items[`${itemarray}`]} Fish${data.items[`${itemarray}`] > 1 ? "es" : ""} | \`${nFormatter(1000 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "hamster":
                        theitems.push(
                            `${obeyUi.markup("icon.hamster")} ${data.items[`${itemarray}`]} Hamster${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(1500 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "dog":
                        theitems.push(
                            `${obeyUi.markup("icon.dog")} ${data.items[`${itemarray}`]} Dog${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(2000 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                    case "cat":
                        theitems.push(
                            `${obeyUi.markup("icon.cat")} ${data.items[`${itemarray}`]} Cat${data.items[`${itemarray}`] > 1 ? "s" : ""} | \`${nFormatter(2000 * data.items[`${itemarray}`])} ${obeyUi.markup("icon.wallet")}\``
                        );
                        break;
                }
            }
            const viewingSelf = user.id === message.author.id;
            const subject = viewingSelf ? (isSpanish ? "Tú" : "You") : user.username;
            const profileTitle = isSpanish
                ? `${obeyUi.markup("icon.bear")} **${subject}** ${viewingSelf ? "tienes" : "tiene"} \`${nFormatter(items)} artículos\` con un valor de \`${nFormatter(itemsvalue)} ${obeyUi.markup("icon.wallet")}\``
                : `${obeyUi.markup("icon.bear")} **${subject}** ${viewingSelf ? "have" : "has"} \`${nFormatter(items)} items\` worth \`${nFormatter(itemsvalue)} ${obeyUi.markup("icon.wallet")}\``;
            const emptyInventory = isSpanish
                ? `\`${nFormatter(Math.floor(data.balance))} ${obeyUi.markup("icon.wallet")}\` ${viewingSelf ? "Aún no tienes" : "Aún no tiene"} artículos.`
                : `\`${nFormatter(Math.floor(data.balance))} ${obeyUi.markup("icon.wallet")}\` ${viewingSelf ? "You have" : "They have"} no items yet.`;
            const profileDescription = isSpanish
                ? `${obeyUi.markup("icon.wallet")} **${subject}** ${viewingSelf ? "tienes" : "tiene"} \`${nFormatter(Math.floor(data.balance))} ${obeyUi.markup("icon.wallet")}\` en el bolsillo\n**${obeyUi.markup("icon.bank")} ${subject} ${viewingSelf ? "tienes" : "tiene"} \`${nFormatter(data.bank)} ${obeyUi.markup("icon.wallet")}\` en el banco**\n\`\`\` \`\`\`**ARTÍCULOS:**\n${theitems.length ? ">>> " + theitems.join("\n\n") : emptyInventory}`
                : `${obeyUi.markup("icon.wallet")} **${subject}** ${viewingSelf ? "have" : "has"} \`${nFormatter(Math.floor(data.balance))} ${obeyUi.markup("icon.wallet")}\` in the pocket\n**${obeyUi.markup("icon.bank")} ${subject} ${viewingSelf ? "have" : "has"} \`${nFormatter(data.bank)} ${obeyUi.markup("icon.wallet")}\` in the bank**\n\`\`\` \`\`\`**ITEMS:**\n${theitems.length ? ">>> " + theitems.join("\n\n") : emptyInventory}`;
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
                        .setFooter(obeyMeta.asFooter({ text: user.username, iconURL: user.displayAvatarURL() }))
                        .setTitle(obeyUi.limit(profileTitle, 256))
                        .setDescription(obeyUi.limit(profileDescription, 4096)),
                ],
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(`\`\`\`${String(e?.message || e?.stack || e).substring(0, 1900)}\`\`\``, 4096)),
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
