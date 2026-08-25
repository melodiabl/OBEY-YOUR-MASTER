/*const {
  EmbedBuilder
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
module.exports = {
  name: "reactions",
  category: "🔰 Info",
  aliases: ["reacts"],
  cooldown: 5,
  usage: "reactions",
  description: "Gives you Information, which reaction dues what",
  run: async (client, message, args, cmduser, text, prefix) => {
    
    let es = client.settings.get(message.guild.id, "embed");let ls = client.settings.get(message.guild.id, "language")
    try {
      
      message.reply({embeds: [new EmbedBuilder()
        .setColor(es.color).setThumbnail(es.thumb ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://")) ? es.footericon : client.user.displayAvatarURL() : undefined)
        .setTitle(eval(client.la[ls]["cmds"]["info"]["reactions"]["variable1"]))
        .setFooter(client.getFooter(es))
        .addFields({ name: `\u200b`, value: '\u200b' })
*/