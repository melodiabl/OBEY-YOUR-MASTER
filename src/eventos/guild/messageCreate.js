module.exports = async (client, message) => {
  if (!message.guild || !message.channel || message.author.bot) return
  const GUILD_DATA = client.dbGuild.getGuildData(message.guild.id)

  // Sistema de Chatbot con IA
  const GuildSchema = require('../../database/schemas/GuildSchema');
  const guildConfig = await GuildSchema.findOne({ guildID: message.guild.id });
  
  if (guildConfig && guildConfig.aiChannel === message.channel.id) {
    if (process.env.OPENAI_API_KEY) {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      try {
        await message.channel.sendTyping();
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Eres OBEY YOUR MASTER, un bot de Discord útil y amigable. Responde de forma concisa en español." },
            { role: "user", content: message.content }
          ],
          max_tokens: 300,
        });
        return message.reply(response.choices[0].message.content);
      } catch (err) {
        console.error('Error en Chatbot IA:', err);
      }
    }
  }

  if (!message.content.startsWith(GUILD_DATA.prefix)) return

  const ARGS = message.content.slice(GUILD_DATA.prefix.length).trim().split(/ +/)
  const CMD = ARGS?.shift()?.toLowerCase()

  const COMANDO = client.commands.get(CMD) || client.commands.find(c => c.ALIASES && c.ALIASES.includes(CMD))

  if (COMANDO) {
    if (COMANDO.OWNER) {
      if (!process.env.OWNER_IDS.split(' ').includes(message.author.id)) return message.reply(`❌ **Solo los dueños de este bot pueden ejecutar este comando!**\n**Dueños del bot:** ${process.env.OWNER_IDS.split(' ').map(OWNER_ID => `<@${OWNER_ID}>`)}`)
    }

    if (COMANDO.BOT_PERMISSIONS) {
      if (!message.guild.members.me.permissions.has(COMANDO.BOT_PERMISSIONS)) return message.reply(`❌ **No tengo suficientes permisos para ejecutar este comando!**\nNecesito los siguientes permisos ${COMANDO.BOT_PERMISSIONS.map(PERMISO => `\`${PERMISO}\``).join(', ')}`)
    }

    if (COMANDO.PERMISSIONS) {
      if (!message.member.permissions.has(COMANDO.PERMISSIONS)) return message.reply(`❌ **No tienes suficientes permisos para ejecutar este comando!**\nNecesitas los siguientes permisos ${COMANDO.PERMISSIONS.map(PERMISO => `\`${PERMISO}\``).join(', ')}`)
    }

    try {
      // ejecutar el comando
      COMANDO.execute(client, message, ARGS, GUILD_DATA.prefix, GUILD_DATA)
    } catch (e) {
      message.reply(`**Ha ocurrido un error al ejecutar el comando \`${COMANDO.NAME}\`**\n*Mira la consola para más detalle.*`)
      console.log(e)
    }
  }
}
