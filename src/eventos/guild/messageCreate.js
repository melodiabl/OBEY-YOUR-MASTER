module.exports = async (client, message) => {
  if (!message.guild || !message.channel || message.author.bot) return
  const GUILD_DATA = client.dbGuild.getGuildData(message.guild.id)

  // Sistema de Niveles (XP)
  const UserSchema = require('../../database/schemas/UserSchema');
  let userData = await UserSchema.findOne({ userID: message.author.id });
  if (!userData) {
    userData = new UserSchema({ userID: message.author.id });
  }

  const xpGain = Math.floor(Math.random() * 10) + 5;
  userData.xp += xpGain;

  const nextLevelXP = userData.level * userData.level * 100;
  if (userData.xp >= nextLevelXP) {
    userData.level++;
    userData.xp = 0;
    message.reply(`🎉 ¡Felicidades ${message.author}! Has subido al **Nivel ${userData.level}**.`);
  }
  await userData.save();

  // Lógica de Múltiples Prefijos
  // 1. Obtener prefijos del .env (separados por espacio)
  // 2. Incluir el prefijo de la DB si existe
  // 3. Incluir la mención del bot como prefijo
  const envPrefixes = process.env.PREFIX ? process.env.PREFIX.split(' ') : ['!'];
  const dbPrefix = GUILD_DATA.prefix;
  const mentionPrefix = `<@!${client.user.id}> `;
  const mentionPrefixAlt = `<@${client.user.id}> `;
  
  const allPrefixes = [...new Set([...envPrefixes, dbPrefix, mentionPrefix, mentionPrefixAlt])].filter(p => p);

  // Encontrar cuál de los prefijos se usó
  const prefix = allPrefixes.find(p => message.content.startsWith(p));
  
  if (!prefix) return

  const ARGS = message.content.slice(prefix.length).trim().split(/ +/)
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
      COMANDO.execute(client, message, ARGS, prefix, GUILD_DATA)
    } catch (e) {
      message.reply(`**Ha ocurrido un error al ejecutar el comando \`${COMANDO.NAME}\`**\n*Mira la consola para más detalle.*`)
      console.log(e)
    }
  }
}
