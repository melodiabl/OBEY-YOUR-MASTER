const { EmbedBuilder } = require("discord.js");
const https = require("https");
const path = require("path");

function fetchFact() {
  return new Promise((resolve, reject) => {
    https.get("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en", (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("parse error"));
        }
      });
    }).on("error", reject);
  });
}

module.exports = {
  name: path.parse(__filename).name,
  category: "Fun",
  usage: `${path.parse(__filename).name}`,
  type: "user",
  description: "*Obtén un dato curioso aleatorio*",
  run: async (client, message, args, cmduser, text, prefix) => {
    let es = client.settings.get(message.guild.id, "embed");
    let ls = client.settings.get(message.guild.id, "language");
    if (!client.settings.get(message.guild.id, "FUN")) {
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
      const data = await fetchFact();
      const fact = new EmbedBuilder()
        .setTitle(":postal_horn: **" + eval(client.la[ls]["cmds"]["fun"]["fact"]["variable1"]) + "**")
        .setDescription(">>> *" + (data.text || "Sin dato disponible") + "*")
        .setColor(es.color)
        .setFooter(client.getFooter(es));
      message.reply({ embeds: [fact] }).catch(() => {});
    } catch (e) {
      console.log(String(e.stack).grey.bgRed);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(es.wrongcolor)
            .setFooter(client.getFooter(es))
            .setTitle(client.la[ls].common.erroroccur)
            .setDescription(eval(client.la[ls]["cmds"]["fun"]["fact"]["variable2"])),
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
