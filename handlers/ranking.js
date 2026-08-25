const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const canvacord = require("canvacord");
const Discord = require("discord.js");
const Canvas = require("@napi-rs/canvas");
const { GetUser, duration, nFormatter } = require(`./functions`);
const { clipRounded, drawWaveAccents, drawSparkles } = require('./canvasUtils')
try {
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/Genta.ttf", "Genta");
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/UbuntuMono.ttf", "UbuntuMono");
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/DMSans-Bold.ttf", "DM Sans");
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/DMSans-Regular.ttf", "DM Sans");
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/STIXGeneral.ttf", "STIXGeneral");
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/Arial.ttf", "Arial");
} catch {}
const Fonts = 'Genta, UbuntuMono, "DM Sans", STIXGeneral, Arial, sans-serif';
let _levelupBg = null; // fondo estático level-up, cargado una sola vez
module.exports = function (client) {
    //log that the module is loaded
    client.on("messageCreate", async message => {
        try {
            if (message.author.bot || !message.guild) return;

            const guildLangSettings = client.settings.get(message.guild.id) || {};
            let ls = guildLangSettings.language && client.la[guildLangSettings.language] ? guildLangSettings.language : 'es';

            client.setups.ensure(message.guild.id, {
                ranking: {
                    enabled: true,
                    backgroundimage: "null",
                },
            });
            client.settings.ensure(message.guild.id, {
                embed: {
                    color: ee?.color || '#fffff9',
                    thumb: true,
                    wrongcolor: ee?.wrongcolor || '#e01e01',
                    footertext: client.guilds.cache.get(message.guild.id)
                        ? client.guilds.cache.get(message.guild.id).name
                        : (ee?.footertext || ''),
                    footericon: client.guilds.cache.get(message.guild.id)
                        ? client.guilds.cache.get(message.guild.id).iconURL()
                        : (ee?.footericon || ''),
                },
            });
            let guildsettings = client.settings.get(message.guild.id);
            const prefix = guildsettings?.prefix;
            const embedcolor = guildsettings?.embed?.color || "#5865F2";

            let ranking = client.setups.get(message.guild.id, "ranking");

            if (!ranking?.enabled) return;
            const key = `${message.guild.id}-${message.author.id}`;

            function databasing(rankuser) {
                //if(rankuser && rankuser.bot) return console.log("GOTTA IGNORE BOT")
                client.points.ensure(
                    rankuser ? `${message.guild.id}-${rankuser.id}` : `${message.guild.id}-${message.author.id}`,
                    {
                        user: rankuser ? rankuser.id : message.author.id,
                        usertag: rankuser ? rankuser.tag : message.author.username,
                        xpcounter: 1,
                        guild: message.guild.id,
                        points: 0,
                        neededpoints: 400,
                        level: 1,
                        voicepoints: 0,
                        neededvoicepoints: 400,
                        voicelevel: 1,
                        voicetime: 0,
                        oldmessage: "",
                    }
                );
                client.points.set(
                    rankuser ? `${message.guild.id}-${rankuser.id}` : `${message.guild.id}-${message.author.id}`,
                    rankuser ? rankuser.tag : message.author.username,
                    `usertag`
                ); //set the usertag with EVERY message, if he has nitro his tag might change ;)
                client.points.ensure(message.guild.id, { setglobalxpcounter: 1 });
                client.points.ensure(message.guild.id, {
                    channel: false,
                    disabled: false,
                });
            }
            databasing(message.author);

            const args = message.content.slice(prefix.length).trim().split(/ +/g);
            let command = args.shift();
            if (!command || command.length == 0) return;
            command = command.toLowerCase();
            let not_allowed = false;

            if (message.content.startsWith(prefix)) {
                let cmd = client.commands.get(command);
                //if the command does not exist, try to get it by his alias
                if (!cmd) cmd = client.commands.get(client.aliases.get(cmd));
                //if the command is on cooldown, return
                if (client.cooldowns.has(cmd)) {
                    const now = Date.now(); //get the current time
                    const timestamps = client.cooldowns.get(cmd); //get the timestamp of the last used commands
                    const cooldownAmount = (cmd.cooldown || 1) * 1000; //get the cooldownamount of the command, if there is no cooldown there will be automatically 1 sec cooldown, so you cannot spam it^^
                    if (timestamps.has(message.author.id)) {
                        //if the user is on cooldown
                        const expirationTime = timestamps.get(message.author.id) + cooldownAmount; //get the amount of time he needs to wait until he can run the cmd again
                        if (now < expirationTime) {
                            //if he is still on cooldonw
                            return (not_allowed = true);
                        }
                    }
                }
                if (not_allowed) return;
                //execute the Command
                switch (command) {
                    case `textrank`:
                    case `ranktext`:
                    case `rank`:
                        try {
                            await message.guild.members.fetch().catch(() => {});
                            let user = await GetUser(message, args);
                            console.log("GETTING RANK...");
                            rank(user, "text");
                        } catch (e) {
                            message.reply({
                                content: String(
                                    "```" + e.message ? String(e.message).substring(0, 1900) : String(e) + "```"
                                ),
                            });
                        }
                        break;
                    case `rankvoice`:
                    case `voicerank`:
                        try {
                            await message.guild.members.fetch().catch(() => {});
                            let user = await GetUser(message, args);
                            rank(user, "voice");
                        } catch (e) {
                            message.reply({
                                content: String(
                                    "```" + e.message ? String(e.message).substring(0, 1900) : String(e) + "```"
                                ),
                            });
                        }
                        break;
                    /////////////////////////////////
                    case `leaderboard`:
                    case `lb`:
                    case `top`:
                        if (args[0]) {
                            if (args[0].toLowerCase() === "all") {
                                leaderboard();
                            } else {
                                newleaderboard();
                            }
                        } else newleaderboard();
                        break;
                    /////////////////////////////////
                    case `voiceleaderboard`:
                    case `voicelb`:
                    case `voicetop`:
                    case `topvoice`:
                        if (args[0]) {
                            if (args[0].toLowerCase() === "all") {
                                leaderboard("voice");
                            } else {
                                newleaderboard("voice");
                            }
                        } else newleaderboard("voice");
                        break;
                    /////////////////////////////////
                    case `setxpcounter`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable1"]));
                        setxpcounter();
                        break;
                    /////////////////////////////////
                    case `setglobalxpcounter`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable2"]));
                        setglobalxpcounter();
                        break;
                    /////////////////////////////////
                    case `addpoints`:
                        if (message.author.id == "1087034447825735741") return addpoints();
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable3"]));
                        addpoints();
                        break;
                    /////////////////////////////////
                    case `setpoints`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable4"]));

                        setpoints();
                        break;
                    /////////////////////////////////
                    case `removepoints`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable5"]));

                        removepoints();
                        break;
                    /////////////////////////////////
                    case `addlevel`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable6"]));

                        addlevel();
                        break;
                    /////////////////////////////////
                    case `setlevel`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable7"]));

                        setlevel();
                        break;
                    /////////////////////////////////
                    case `removelevel`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable8"]));

                        removelevel();
                        break;
                    /////////////////////////////////
                    case `resetranking`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable9"]));

                        resetranking();
                        break;
                    /////////////////////////////////
                    case `registerall`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable10"]));

                        registerall();
                        break;
                    /////////////////////////////////
                    case `addrandomall`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable11"]));

                        addrandomall();
                        break;
                    /////////////////////////////////
                    case `resetrankingall`:
                        if (
                            !message.member.permissions.has(Discord.PermissionFlagsBits.Administrator) ||
                            !message.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                        )
                            return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable12"]));

                        resetrankingall();
                        break;
                    /////////////////////////////////
                    case `levelhelp`:
                    case `rankinghelp`:
                    case `levelinghelp`:
                    case `rankhelp`:
                        levelinghelp();
                        break;
                    /////////////////////////////////
                    default:
                        //message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable13"]))
                        break;
                }
                return;
            }

            function anti_double_messages() {
                const oldmessage = client.points.get(key, `oldmessage`);
                if (oldmessage.toLowerCase() === message.content.toLowerCase().replace(/\s+/g, "")) {
                    return;
                }
                client.points.set(key, message.content.toLowerCase().replace(/\s+/g, ""), `oldmessage`); //setting the new old message
            }
            anti_double_messages();

            function Giving_Ranking_Points(thekey, maxnumber) {
                if (!thekey && message.author.bot) return;
                let setglobalxpcounter = client.points.get(message.guild.id, "setglobalxpcounter");
                if (!maxnumber) maxnumber = 5;
                var randomnum = (Math.floor(Math.random() * Number(maxnumber)) + 1) * setglobalxpcounter;
                randomnum *= Number(client.points.get(key, `xpcounter`));
                randomnum = Number(Math.floor(randomnum));

                const curPoints = client.points.get(thekey ? thekey : key, `points`);
                const neededPoints = client.points.get(thekey ? thekey : key, `neededpoints`);
                let leftpoints = neededPoints - curPoints;

                let toaddpoints = randomnum;
                addingpoints(toaddpoints, leftpoints);

                function addingpoints(toaddpoints, leftpoints) {
                    if (toaddpoints >= leftpoints) {
                        client.points.set(thekey ? thekey : key, 0, `points`); //set points to 0
                        client.points.inc(thekey ? thekey : key, `level`); //add 1 to level
                        //HARDING UP!
                        const newLevel = client.points.get(thekey ? thekey : key, `level`); //get current NEW level
                        if (newLevel % 4 === 0) client.points.math(thekey ? thekey : key, `+`, 100, `neededpoints`);

                        const newneededPoints = client.points.get(thekey ? thekey : key, `neededpoints`); //get NEW needed Points
                        const newPoints = client.points.get(thekey ? thekey : key, `points`); //get current NEW points

                        addingpoints(toaddpoints - leftpoints, newneededPoints); //Ofc there is still points left to add so... lets do it!
                        LEVELUP();
                    } else {
                        client.points.math(thekey ? thekey : key, `+`, Number(toaddpoints), `points`);
                    }
                }
            }
            Giving_Ranking_Points();

            async function LEVELUP() {
                const newLevel = client.points.get(key, `level`); //get current NEW level
                const newPoints = client.points.get(key, `points`); //get current NEW points
                const newneededPoints = client.points.get(key, `neededpoints`);
                //send ping and embed message
                try {
                    client.points.ensure(message.guild.id, {
                        rankroles: {},
                    });
                    let RankRoles = client.points.get(message.guild.id, "rankroles");
                    if (RankRoles[Number(newLevel)]) {
                        await message.member.roles.add(RankRoles[Number(newLevel)]).catch(() => {});
                    }
                } catch (e) {}
                if (client.points.get(message.guild.id, "disabled")) return;

                const filtered = client.points
                    .filter(p => p.guild === message.guild.id)
                    .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                const sorted = filtered
                    .sort((a, b) => {
                        if (b?.points) return b?.level - a.level || b?.points - a.points;
                        return b?.level - a.level || -1;
                    })
                    .sort((a, b) => b?.level - a.level || b?.points - a.points);
                const top10 = sorted.splice(0, message.guild.memberCount);

                let i = 0;
                //count server rank sometimes an error comes
                for (const data of top10) {
                    try {
                        i++;
                        if (data.user === message.author.id) break; //if its the right one then break it ;)
                    } catch {
                        i = `X`;
                        break;
                    }
                }
                const canvas = Canvas.createCanvas(1802, 430);
                const ctx = canvas.getContext("2d");
                const ACCENT = "#5865F2";
                clipRounded(ctx, 1802, 430, 20)

                // Fondo estático pre-renderizado (gradiente+glow+overlay+waves+sparkles), 1 sola carga
                if (_levelupBg === null) { try { _levelupBg = await Canvas.loadImage("./assets/cards/levelup-bg.png") } catch { _levelupBg = false } }
                if (_levelupBg) ctx.drawImage(_levelupBg, 0, 0, 1802, 430)
                else {
                    const grd = ctx.createLinearGradient(0, 0, 1802, 430);
                    grd.addColorStop(0, "#171232"); grd.addColorStop(1, "#0a0a14");
                    ctx.fillStyle = grd; ctx.fillRect(0, 0, 1802, 430);
                    const ag = ctx.createRadialGradient(227, 215, 20, 227, 215, 620);
                    ag.addColorStop(0, "rgba(88,101,242,0.40)"); ag.addColorStop(1, "transparent");
                    ctx.fillStyle = ag; ctx.fillRect(0, 0, 1802, 430);
                    const ro = ctx.createLinearGradient(380, 0, 1802, 0);
                    ro.addColorStop(0, "rgba(0,0,0,0)"); ro.addColorStop(0.3, "rgba(0,0,0,0.42)"); ro.addColorStop(1, "rgba(0,0,0,0.52)");
                    ctx.fillStyle = ro; ctx.fillRect(0, 0, 1802, 430);
                    drawWaveAccents(ctx, 1802, 430, ACCENT); drawSparkles(ctx, 1802, 430, ACCENT)
                }

                // Avatar with gradient ring + ambient glow
                const avCX = 227, avCY = 215, avR = 170;
                const avatar = await Canvas.loadImage(
                    message.author.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true })
                );
                ctx.save();
                const glowGrd = ctx.createRadialGradient(avCX, avCY, avR * 0.6, avCX, avCY, avR * 2.2);
                glowGrd.addColorStop(0, ACCENT + "55"); glowGrd.addColorStop(1, "transparent");
                ctx.fillStyle = glowGrd; ctx.fillRect(avCX - avR * 2.5, avCY - avR * 2.5, avR * 5, avR * 5); ctx.restore();

                ctx.save();
                const ringGrd = ctx.createLinearGradient(avCX - avR, avCY - avR, avCX + avR, avCY + avR);
                ringGrd.addColorStop(0, ACCENT); ringGrd.addColorStop(0.5, "#7c8cff"); ringGrd.addColorStop(1, ACCENT);
                ctx.beginPath(); ctx.arc(avCX, avCY, avR + 10, 0, Math.PI * 2); ctx.closePath();
                ctx.fillStyle = ringGrd; ctx.fill(); ctx.restore();

                ctx.save();
                ctx.beginPath(); ctx.arc(avCX, avCY, avR + 3, 0, Math.PI * 2); ctx.closePath();
                ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fill(); ctx.restore();

                ctx.save();
                ctx.beginPath(); ctx.arc(avCX, avCY, avR, 0, Math.PI * 2, true); ctx.closePath(); ctx.clip();
                ctx.drawImage(avatar, avCX - avR, avCY - avR, avR * 2, avR * 2); ctx.restore();

                // Text
                const TX = 466;
                ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

                let username = `${message.author.username}`.trim();
                let ufs = 86;
                ctx.font = `bold ${ufs}px Genta, "DM Sans", Arial, sans-serif`;
                while (ctx.measureText(username).width > 940 && ufs > 34) {
                    ufs -= 2; ctx.font = `bold ${ufs}px Genta, "DM Sans", Arial, sans-serif`;
                }
                ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
                ctx.fillStyle = "#FFFFFF"; ctx.fillText(username, TX, 135); ctx.restore();

                const unameW = ctx.measureText(username).width;
                ctx.font = `32px "DM Sans", Arial, sans-serif`;
                ctx.fillStyle = "rgba(255,255,255,0.40)";
                ctx.fillText("  subió de nivel", TX + unameW, 133);

                // Separator line
                ctx.save(); ctx.shadowColor = ACCENT + "90"; ctx.shadowBlur = 10;
                const sep = ctx.createLinearGradient(TX, 0, TX + 840, 0);
                sep.addColorStop(0, ACCENT); sep.addColorStop(0.6, ACCENT + "55"); sep.addColorStop(1, "transparent");
                ctx.strokeStyle = sep; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(TX, 158); ctx.lineTo(TX + 840, 158); ctx.stroke(); ctx.restore();

                // Level — Genta, large, glowing gradient
                const levelText = `NIVEL  ${newLevel}`;
                ctx.font = `bold 138px Genta, "DM Sans", Arial, sans-serif`;
                const lvlW = ctx.measureText(levelText).width;
                const lvlGrd = ctx.createLinearGradient(TX, 0, TX + lvlW, 0);
                lvlGrd.addColorStop(0, ACCENT); lvlGrd.addColorStop(0.45, "#7c8cff"); lvlGrd.addColorStop(1, "#9aa3ff");
                ctx.save(); ctx.shadowColor = ACCENT; ctx.shadowBlur = 44;
                ctx.fillStyle = lvlGrd; ctx.fillText(levelText, TX, 308); ctx.restore();

                // Rank
                ctx.font = `38px "DM Sans", Arial, sans-serif`;
                ctx.fillStyle = "rgba(255,255,255,0.36)";
                ctx.fillText(`Rank #${i} en el servidor`, TX, 374);

                // Bot.png watermark
                try {
                    const botImg = await Canvas.loadImage("./assets/bot.png");
                    ctx.save(); ctx.globalAlpha = 0.28;
                    ctx.drawImage(botImg, 1802 - 108, 430 - 64, 88, 58);
                    ctx.globalAlpha = 1; ctx.restore();
                } catch {}

                const attachment = new Discord.AttachmentBuilder(canvas.toBuffer("image/webp"), "ranking-image.png");

                if (!client.points.get(message.guild.id, "channel"))
                    return message.channel.send({ content: `${message.author}`, files: [attachment] });
                try {
                    let channel = message.guild.channels.cache.get(client.points.get(message.guild.id, "channel"));
                    if (!channel) {
                        return message.channel.send({ content: `${message.author}`, files: [attachment] }).catch(() => {});
                    }
                    channel.send({ content: `${message.author}`, files: [attachment] });
                } catch (e) {
                    message.channel.send({ content: `${message.author}`, files: [attachment] }).catch(() => {});
                }
            }

            async function rank(the_rankuser, type = "text") {
                /**
                 * GET the Rank User
                 * @info you can tag him
                 */
                try {
                    let rankuser = the_rankuser || message.author;
                    if (!rankuser)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable14"]));
                    let rankMember =
                        message.guild.members.cache.get(rankuser.id) ||
                        (await message.guild.members.fetch(rankuser.id).catch(() => {}));

                    const key = `${message.guild.id}-${rankuser.id}`;
                    await databasing(rankuser);
                    let theDbDatas = [
                        ["level", "points", "neededpoints"],
                        ["voicelevel", "voicepoints", "neededvoicepoints"],
                    ];
                    let tempmessage = await message.channel.send(`📊 *Getting the RANK-DATA of: **${rankuser.tag}** ...*`);

                    /**
                     * TEXT RANK
                     */
                    const filteredText = client.points
                        .filter(p => p.guild === message.guild.id)
                        .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                    const sortedText = filteredText.sort((a, b) => {
                        if (b[`${theDbDatas[0][1]}`])
                            return (
                                b[`${theDbDatas[0][0]}`] - a[`${theDbDatas[0][0]}`] ||
                                b[`${theDbDatas[0][1]}`] - a[`${theDbDatas[0][1]}`]
                            );
                        return b[`${theDbDatas[0][0]}`] - a[`${theDbDatas[0][0]}`] || -1;
                    });
                    let RankText = sortedText.splice(0, message.guild.memberCount).findIndex(d => d.user == rankuser.id) + 1;

                    if (!client.points.get(key, `${theDbDatas[0][1]}`)) client.points.set(key, 1, `${theDbDatas[0][1]}`);
                    if (!client.points.get(key, `${theDbDatas[0][2]}`)) client.points.set(key, 1, `${theDbDatas[0][2]}`);

                    let curLevelText = Number(await client.points.get(key, `${theDbDatas[0][0]}`));
                    let curpointsText = Number(await client.points.get(key, `${theDbDatas[0][1]}`)?.toFixed(2));
                    let curnextlevelText = Number(await client.points.get(key, `${theDbDatas[0][2]}`)?.toFixed(2));
                    if (curLevelText === undefined) RankText = `NaN`;

                    /**
                     * VOICE RANK
                     */
                    const filteredVoice = client.points
                        .filter(p => p.guild === message.guild.id)
                        .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                    const sortedVoice = filteredVoice.sort((a, b) => {
                        if (b[`${theDbDatas[1][1]}`])
                            return (
                                b[`${theDbDatas[1][0]}`] - a[`${theDbDatas[1][0]}`] ||
                                b[`${theDbDatas[1][1]}`] - a[`${theDbDatas[1][1]}`]
                            );
                        return b[`${theDbDatas[1][0]}`] - a[`${theDbDatas[1][0]}`] || -1;
                    });
                    let RankVoice =
                        sortedVoice.splice(0, message.guild.memberCount).findIndex(d => d.user == rankuser.id) + 1;

                    if (!(await client.points.get(key, `${theDbDatas[1][1]}`)))
                        await client.points.set(key, 1, `${theDbDatas[1][1]}`);
                    if (!(await client.points.get(key, `${theDbDatas[1][2]}`)))
                        await client.points.set(key, 1, `${theDbDatas[1][2]}`);
                    let curLevelVoice = Number(await client.points.get(key, `${theDbDatas[1][0]}`));
                    let curpointsVoice = Number(await client.points.get(key, `${theDbDatas[1][1]}`)?.toFixed(2));
                    let curnextlevelVoice = Number(await client.points.get(key, `${theDbDatas[1][2]}`)?.toFixed(2));
                    if (curLevelVoice === undefined) RankVoice = `NaN`;

                    var xp_data = {
                        avatar:
                            rankMember && rankMember.avatar
                                ? rankMember.displayAvatarURL({ dynamic: false, size: 4096 })
                                : rankuser.displayAvatarURL({ dynamic: false, size: 4096 }),
                        text: {
                            cur_level: Number(curLevelText),
                            rank: Number(RankText),
                            current: Number(curpointsText.toFixed(2)),
                            needed: Number(curnextlevelText.toFixed(2)),
                            percent: Number(
                                (Number(curpointsText.toFixed(2)) / Number(curnextlevelText.toFixed(2))) * 100
                            ).toFixed(2),
                        },
                        voice: {
                            cur_level: Number(curLevelVoice),
                            rank: Number(RankVoice),
                            current: Number(curpointsVoice.toFixed(2)),
                            needed: Number(curnextlevelVoice.toFixed(2)),
                            percent: Number(
                                (Number(curpointsVoice.toFixed(2)) / Number(curnextlevelVoice.toFixed(2))) * 100
                            ).toFixed(2),
                        },
                    };

                    return tempmessage.edit({
                        content: `${tempmessage.content}${
                            type == "voice"
                                ? `\n**Connected Time:** ${duration(client.points.get(key, "voicetime") * 60 * 1000)
                                      .map(i => `\`${i}\``)
                                      .join(", ")}\n**Note:** *\`You only gain Points, if you leave the Channel!\`*`
                                : ""
                        }`,
                        files: [new Discord.AttachmentBuilder(await require('./cards/rankcard')({ ...xp_data, username: (rankMember && rankMember.displayName) || (rankuser && rankuser.username) }), "card.png")],
                    });
                } catch (error) {
                    console.log(error);
                    message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable17"]));
                }
            }

            function leaderboardembed(type = "text") {
                let theDbDatas = ["level", "points", "neededpoints"];
                if (type == "voice") theDbDatas = ["voicelevel", "voicepoints", "neededvoicepoints"];
                const filtered = client.points
                    .filter(p => p.guild === message.guild.id)
                    .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                let orilent;
                const sorted = filtered.sort(
                    (a, b) => b[`${theDbDatas[0]}`] - a[`${theDbDatas[0]}`] || b[`${theDbDatas[1]}`] - a[`${theDbDatas[1]}`]
                );
                let embeds = [];
                let j = 0;
                let maxnum = sorted.length;
                orilent = sorted.length;
                if (isNaN(maxnum)) {
                    maxnum = 50;
                }
                if (maxnum > sorted.length) maxnum = sorted.length + (25 - Number(String(sorted.length / 25).slice(2)));
                if (maxnum < 25) maxnum = 25;

                //do some databasing
                var userrank = 0;
                const filtered1 = client.points
                    .filter(p => p.guild === message.guild.id)
                    .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                const sorted1 = filtered1.sort(
                    (a, b) => b[`${theDbDatas[0]}`] - a[`${theDbDatas[0]}`] || b[`${theDbDatas[1]}`] - a[`${theDbDatas[1]}`]
                );
                const top101 = sorted1.splice(0, message.guild.memberCount);
                for (const data of top101) {
                    try {
                        userrank++;
                        if (data.user === message.author.id) break; //if its the right one then break it ;)
                    } catch {
                        userrank = `X`;
                        break;
                    }
                }

                for (let i = 25; i <= maxnum; i += 25) {
                    const top = sorted.splice(0, 25);
                    const embed = new Discord.EmbedBuilder()
                        .setTitle(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable18"]))
                        .setTimestamp()
                        .setColor(embedcolor);
                    var string = "";
                    for (const data of top) {
                        j++;
                        try {
                            if (j == 1)
                                string += `:first_place: **${data.usertag}**: \`Level: ${data[`${theDbDatas[0]}`]} | Points: ${shortenLargeNumber(data[`${theDbDatas[1]}`], 2)}\`\n`;
                            else if (j == 2)
                                string += `:second_place: **${data.usertag}**: \`Level: ${data[`${theDbDatas[0]}`]} | Points: ${shortenLargeNumber(data[`${theDbDatas[1]}`], 2)}\`\n`;
                            else if (j == 3)
                                string += `:third_place: **${data.usertag}**: \`Level: ${data[`${theDbDatas[0]}`]} | Points: ${shortenLargeNumber(data[`${theDbDatas[1]}`], 2)}\`\n`;
                            else
                                string += `\`${j}\`. **${data.usertag}**: \`Level: ${data[`${theDbDatas[0]}`]} | Points: ${shortenLargeNumber(data[`${theDbDatas[1]}`], 2)}\`\n`;
                        } catch {}
                    }
                    embed.setDescription(string.substring(0, 2048));
                    embed.setFooter({ text: eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable19"]) });
                    embeds.push(embed);
                }
                return embeds;
            }
            async function leaderboard(type = "text") {
                let theDbDatas = ["level", "points", "neededpoints"];
                if (type == "voice") theDbDatas = ["voicelevel", "voicepoints", "neededvoicepoints"];
                let currentPage = 0;
                const embeds = leaderboardembed();
                if (embeds.length == 1) {
                    return message.channel.send({ embeds: embeds }).catch(() => {});
                }
                const lbembed = await message.channel
                    .send({
                        content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
                        embeds: [embeds[currentPage]],
                    })
                    .catch(() => {});

                try {
                    await lbembed.react("⏪");
                    await lbembed.react("⏹");
                    await lbembed.react("⏩");
                } catch (error) {
                    console.error(error);
                }

                const filter = (reaction, user) =>
                    ["⏪", "⏹", "⏩"].includes(reaction.emoji?.name) && message.author.id === user.id;
                const collector = lbembed.createReactionCollector({ filter, time: 60000 });

                collector.on("collect", async (reaction, user) => {
                    try {
                        if (reaction.emoji?.name === "⏩") {
                            if (currentPage < embeds.length - 1) {
                                currentPage++;
                                lbembed.edit({
                                    content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
                                    embeds: [embeds[currentPage]],
                                });
                            } else {
                                currentPage = 0;
                                lbembed.edit({
                                    content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
                                    embeds: [embeds[currentPage]],
                                });
                            }
                        } else if (reaction.emoji?.name === "⏪") {
                            if (currentPage !== 0) {
                                --currentPage;
                                lbembed.edit({
                                    content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
                                    embeds: [embeds[currentPage]],
                                });
                            } else {
                                currentPage = embeds.length - 1;
                                lbembed.edit({
                                    content: `**Current Page - ${currentPage + 1}/${embeds.length}**`,
                                    embeds: [embeds[currentPage]],
                                });
                            }
                        } else {
                            collector.stop();
                            reaction.message.reactions.removeAll();
                        }
                        await reaction.users.remove(message.author.id);
                    } catch (error) {
                        console.error(error);
                    }
                });
            }

            async function newleaderboard(type = "text") {
                let theDbDatas = ["level", "points", "neededpoints"];
                if (type == "voice") theDbDatas = ["voicelevel", "voicepoints", "neededvoicepoints"];
                let tempmessage = await message.channel.send(
                    `📊 *Getting the ${type == "voice" ? "🔉" : "💬"}__${type.toUpperCase()}__-LEADERBOARD-DATA of: **${message.guild.name}** ...*`
                );
                var filtered = client.points
                    .filter(p => p.guild === message.guild.id)
                    .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                var sorted = filtered.sort((a, b) => {
                    if (b[`${theDbDatas[1]}`])
                        return (
                            b[`${theDbDatas[0]}`] - a[`${theDbDatas[0]}`] || b[`${theDbDatas[1]}`] - a[`${theDbDatas[1]}`]
                        );
                    return b[`${theDbDatas[0]}`] - a[`${theDbDatas[0]}`] || -1;
                });
                let embeds = [];
                let j = 0;
                let maxnum = 10;

                //do some databasing
                var userrank = 0;
                var filtered1 = client.points
                    .filter(p => p.guild === message.guild.id)
                    .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                var sorted1 = filtered1.sort((a, b) => {
                    if (b[`${theDbDatas[1]}`])
                        return (
                            b[`${theDbDatas[0]}`] - a[`${theDbDatas[0]}`] || b[`${theDbDatas[1]}`] - a[`${theDbDatas[1]}`]
                        );
                    return b[`${theDbDatas[0]}`] - a[`${theDbDatas[0]}`];
                });
                var top101 = sorted1.splice(0, message.guild.memberCount);

                for (const data of top101) {
                    try {
                        userrank++;
                        if (data.user === message.author.id) break; //if its the right one then break it ;)
                    } catch {
                        userrank = `X`;
                        break;
                    }
                }
                var array_usernames = [];
                var array_discriminator = [];
                var array_level = [];
                var array_avatar = [];
                var array_textpoints = [];
                var array_amount = [];
                for (let i = 10; i <= maxnum; i += 10) {
                    const top = sorted.splice(0, 10);
                    for (const data of top) {
                        try {
                            var user = await client.users.fetch(data.user).catch(() => {});
                            array_usernames.push(user.username);
                            array_discriminator.push(user.discriminator);
                            array_level.push(
                                data[`${theDbDatas[0]}`] && data[`${theDbDatas[0]}`] > 0 ? data[`${theDbDatas[0]}`] : 1
                            );
                            array_textpoints.push(data[`${theDbDatas[1]}` || 0]);
                            if (type == "voice") array_amount.push(data.voicetime || 0);
                            else {
                                let memberData = client.invitesdb?.get(message.guild.id + user.id);
                                if (memberData.messagesCount < 0) memberData.messagesCount *= -1;
                                let messagesCount = memberData.messagesCount;
                                array_amount.push(messagesCount || 0);
                            }
                            array_avatar.push(user.displayAvatarURL({ size: 4096 }));
                        } catch (e) {
                            array_usernames.push(undefined);
                            array_avatar.push(client.user.displayAvatarURL({ size: 4096 }));
                            array_level.push(0);
                            array_textpoints.push(0);
                        }
                    }
                }

                array_usernames = array_usernames.slice(0, 10);
                Promise.resolve().then(async () => {
                    const attachment = new Discord.AttachmentBuilder(await require('./cards/leaderboard')(
                        array_usernames.map((u, idx) => ({ name: u, avatar: array_avatar[idx], value: array_amount[idx], offset: idx })),
                        { title: `Top de ${message.guild.name}`, kicker: type == 'voice' ? 'TOP VOZ' : 'TOP TEXTO' }
                    ), "ranking-image.png");

                    var filtered = client.points
                        .filter(p => p.guild === message.guild.id)
                        .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                    var sorted = filtered.sort((a, b) => {
                        return b[`voicetime`] - a[`voicetime`] || -1;
                    });
                    let embeds = [];
                    let j = 0;
                    let maxnum = 10;

                    //do some databasing
                    var userrank = 0;
                    var filtered1 = client.points
                        .filter(p => p.guild === message.guild.id)
                        .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                    var sorted1 = filtered1.sort((a, b) => {
                        return b[`voicetime`] - a[`voicetime`] || -1;
                    });
                    var top101 = sorted1.splice(0, message.guild.memberCount);

                    for (const data of top101) {
                        try {
                            userrank++;
                            if (data.user === message.author.id) break; //if its the right one then break it ;)
                        } catch {
                            userrank = `X`;
                            break;
                        }
                    }
                    var array_usernames = [];
                    var array_discriminator = [];
                    var array_level = [];
                    var array_avatar = [];
                    var array_textpoints = [];
                    var array_amount = [];
                    for (let i = 10; i <= maxnum; i += 10) {
                        const top = sorted.splice(0, 10);
                        for (const data of top) {
                            try {
                                var user = await client.users.fetch(data.user).catch(() => {});
                                array_usernames.push(user.username);
                                array_discriminator.push(user.discriminator);
                                array_level.push(
                                    data[`${theDbDatas[0]}`] && data[`${theDbDatas[0]}`] > 0 ? data[`${theDbDatas[0]}`] : 1
                                );
                                array_textpoints.push(data[`voicetime` || 0]);
                                if (type == "voice") array_amount.push(data.voicepoints || 0);
                                else {
                                    let memberData = client.invitesdb?.get(message.guild.id + user.id);
                                    if (memberData.messagesCount < 0) memberData.messagesCount *= -1;
                                    let messagesCount = memberData.messagesCount;
                                    array_amount.push(messagesCount || 0);
                                }
                                array_avatar.push(user.displayAvatarURL({ size: 4096 }));
                            } catch (e) {
                                array_usernames.push(undefined);
                                array_avatar.push(client.user.displayAvatarURL({ size: 4096 }));
                                array_level.push(0);
                                array_textpoints.push(0);
                            }
                        }
                    }

                    array_usernames = array_usernames.slice(0, 10);
                    Promise.resolve().then(async () => {
                        const attachment2 = new Discord.AttachmentBuilder(
                            await require('./cards/leaderboard')(
                                array_usernames.map((u, idx) => ({ name: u, avatar: array_avatar[idx], value: array_amount[idx], offset: 10 + idx })),
                                { title: `Top de ${message.guild.name}`, kicker: type == 'voice' ? 'TOP VOZ' : 'TOP TEXTO' }
                            ),
                            "ranking-image.png"
                        );
                        tempmessage.delete().catch(() => {});
                        message.channel
                            .send({
                                content: `Top 10 Leaderboard of **${message.guild.name}** Sorted after VOICE-POINTS\n> **Type:** \`leaderboard all\` to see all Ranks\n*Rank is counted for the \`${type.toUpperCase()}-RANK\`*\n> ${type != "voice" ? `To see the **Voice Leaderboard** type: \`voiceleaderbaord [all]\`` : `To see the **Text Leaderboard** type: \`leaderbaord [all]\``}`,
                                files: [attachment, attachment2],
                            })
                            .catch(() => {});
                        message.channel
                            .send({
                                content: `Top 10 Leaderboard of **${message.guild.name}** Sorted after VOICE-TIME`,
                                files: [attachment2],
                            })
                            .catch(() => {});
                    });
                });
            }

            function setxpcounter() {
                try {
                    /**
                     * GET the Rank User
                     * @info you can tag him
                     */
                    if (!args[0])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable21"]));
                    let rankuser = message.mentions.users.first();
                    if (!rankuser)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable22"]));
                    // if(rankuser.bot) return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable23"]));
                    //Call the databasing function!
                    const key = `${message.guild.id}-${rankuser.id}`;
                    databasing(rankuser);
                    if (!args[1])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable24"]));
                    if (Number(args[1]) > 10)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable25"]));
                    client.points.set(key, Number(args[1]), `xpcounter`); //set points to 0
                    const embed = new Discord.EmbedBuilder()
                        .setColor(embedcolor)
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable26"]));
                    message.reply({ embeds: [embed] });
                } catch (error) {
                    console.log("RANKING:".underline.red + " :: " + error.stack.toString().grey);
                    message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable27"]));
                }
            }

            function setglobalxpcounter() {
                try {
                    if (!args[0])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable28"]));
                    if (Number(args[1]) > 10)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable29"]));
                    client.points.set(message.guild.id, Number(args[0]), `setglobalxpcounter`); //set points to 0
                    const embed = new Discord.EmbedBuilder()
                        .setColor(embedcolor)
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable30"]));
                    message.reply({ embeds: [embed] });
                } catch {}
            }
            function addpoints(amount) {
                try {
                    /**
                     * GET the Rank User
                     * @info you can tag him
                     */
                    if (!args[0])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable31"]));
                    let rankuser = message.mentions.users.first();
                    if (!rankuser)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable32"]));
                    // if(rankuser.bot) return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable33"]));
                    //Call the databasing function!
                    const key = `${message.guild.id}-${rankuser.id}`;
                    databasing(rankuser);

                    let curPoints = client.points.get(key, `points`);
                    let neededPoints = client.points.get(key, `neededpoints`);
                    while (curPoints > neededPoints) {
                        client.points.set(key, curPoints - neededPoints, `points`); //set points to 0
                        client.points.inc(key, `level`); //add 1 to level
                        //HARDING UP!
                        const newLevel = client.points.get(key, `level`); //get current NEW level
                        if (newLevel % 4 === 0) client.points.math(key, `+`, 100, `neededpoints`);
                        curPoints = client.points.get(key, `points`);
                        neededPoints = client.points.get(key, `neededpoints`);
                    }
                    let leftpoints = neededPoints - curPoints;
                    if (!args[1] && !amount)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable34"]));
                    if (Number(args[1]) > 10000 || Number(args[1]) < -10000)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable35"]));
                    if (!amount) amount = Number(args[1]);
                    if (amount < 0) removepoints(amount);
                    let toaddpoints = amount;
                    addingpoints(toaddpoints, leftpoints);

                    function addingpoints(toaddpoints, leftpoints) {
                        if (toaddpoints >= leftpoints) {
                            client.points.set(key, 0, `points`); //set points to 0
                            client.points.inc(key, `level`); //add 1 to level
                            //HARDING UP!
                            const newLevel = client.points.get(key, `level`); //get current NEW level
                            if (newLevel % 4 === 0) client.points.math(key, `+`, 100, `neededpoints`);

                            const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                            const newPoints = client.points.get(key, `points`); //get current NEW points

                            //THE INFORMATION EMBED
                            const embed = new Discord.EmbedBuilder()
                                .setAuthor({
                                    name: `Ranking of:  ${rankuser.tag}`,
                                    iconURL: rankuser.displayAvatarURL()
                                })
                                .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable36"]))
                                .setColor(embedcolor);
                            //send ping and embed message only IF the adding will be completed!
                            if (toaddpoints - leftpoints < newneededPoints)
                                message.channel.send({ content: `${rankuser}`, embeds: [embed] }).catch(() => {});

                            addingpoints(toaddpoints - leftpoints, newneededPoints); //Ofc there is still points left to add so... lets do it!
                        } else {
                            client.points.math(key, `+`, Number(toaddpoints), `points`);
                        }
                    }

                    const embed = new Discord.EmbedBuilder()
                        .setColor(embedcolor)
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable37"]));
                    message.reply({ embeds: [embed] });
                    rank(rankuser); //also sending the rankcard
                } catch (error) {
                    console.log("RANKING:".underline.red + " :: " + error.stack.toString().grey);
                    message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable38"]));
                }
            }

            function setpoints() {
                try {
                    /**
                     * GET the Rank User
                     * @info you can tag him
                     */
                    if (!args[0])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable39"]));
                    let rankuser = message.mentions.users.first();
                    if (!rankuser)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable40"]));
                    // if(rankuser.bot) return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable41"]));
                    //Call the databasing function!
                    const key = `${message.guild.id}-${rankuser.id}`;
                    databasing(rankuser);

                    let toaddpoints = Number(args[1]);
                    if (!args[1])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable42"]));
                    if (Number(args[1]) > 10000)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable43"]));
                    if (Number(args[1]) < 0) args[1] = 0;
                    const neededPoints = client.points.get(key, `neededpoints`);
                    addingpoints(toaddpoints, neededPoints);

                    function addingpoints(toaddpoints, neededPoints) {
                        if (toaddpoints >= neededPoints) {
                            client.points.set(key, 0, `points`); //set points to 0
                            client.points.inc(key, `level`); //add 1 to level
                            //HARDING UP!
                            const newLevel = client.points.get(key, `level`); //get current NEW level
                            if (newLevel % 4 === 0) client.points.math(key, `+`, 100, `neededpoints`);

                            const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                            const newPoints = client.points.get(key, `points`); //get current NEW points

                            //THE INFORMATION EMBED
                            const embed = new Discord.EmbedBuilder()
                                .setAuthor({
                                    name: `Ranking of:  ${rankuser.tag}`,
                                    iconURL: rankuser.displayAvatarURL()
                                })
                                .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable44"]))
                                .setColor(embedcolor);
                            //send ping and embed message
                            message.channel.send({ content: `${rankuser}`, embeds: [embed] }).catch(() => {});

                            addingpoints(toaddpoints - neededPoints, newneededPoints); //Ofc there is still points left to add so... lets do it!
                        } else {
                            client.points.set(key, Number(toaddpoints), `points`);
                        }
                    }

                    const embed = new Discord.EmbedBuilder()
                        .setColor(embedcolor)
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable45"]));
                    message.channel.send({ embeds: [embed] }).catch(() => {});
                    rank(rankuser); //also sending the rankcard
                } catch (error) {
                    console.log("RANKING:".underline.red + " :: " + error.stack.toString().grey);
                    message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable46"]));
                }
            }

            function removepoints(amount) {
                try {
                    /**
                     * GET the Rank User
                     * @info you can tag him
                     */
                    if (!args[0])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable47"]));
                    let rankuser = message.mentions.users.first();
                    if (!rankuser)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable48"]));
                    // if(rankuser.bot) return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable49"]));
                    //Call the databasing function!
                    const key = `${message.guild.id}-${rankuser.id}`;
                    databasing(rankuser);

                    const curPoints = client.points.get(key, `points`);
                    const neededPoints = client.points.get(key, `neededpoints`);

                    if (!args[1] && !amount)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable50"]));
                    if (!amount) amount = Number(args[1]);
                    if (Number(args[1]) > 10000 || Number(args[1]) < -10000)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable51"]));
                    if (amount < 0) addpoints(amount);

                    removingpoints(amount, curPoints);

                    function removingpoints(amount, curPoints) {
                        if (amount > curPoints) {
                            let removedpoints = amount - curPoints - 1;
                            client.points.set(key, neededPoints - 1, `points`); //set points to 0
                            if (client.points.get(key, `level`) == 1)
                                return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable52"]));
                            client.points.dec(key, `level`); //remove 1 from level
                            //HARDING UP!
                            const newLevel = client.points.get(key, `level`); //get current NEW level
                            if ((newLevel + 1) % 4 === 0) {
                                //if old level was divideable by 4 set neededpoints && points -100
                                client.points.math(key, `-`, 100, `points`);
                                client.points.math(key, `-`, 100, `neededpoints`);
                            }

                            const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                            const newPoints = client.points.get(key, `points`); //get current NEW points

                            //THE INFORMATION EMBED
                            const embed = new Discord.EmbedBuilder()
                                .setAuthor({
                                    name: `Ranking of:  ${rankuser.tag}`,
                                    iconURL: rankuser.displayAvatarURL()
                                })
                                .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable53"]))
                                .setColor(embedcolor);
                            //send ping and embed message only IF the removing will be completed!
                            if (amount - removedpoints < neededPoints)
                                message.channel.send({ content: `${rankuser}`, embeds: [embed] }).catch(() => {});

                            removingpoints(amount - removedpoints, newneededPoints); //Ofc there is still points left to add so... lets do it!
                        } else {
                            client.points.math(key, `-`, Number(amount), `points`);
                        }
                    }

                    const embed = new Discord.EmbedBuilder()
                        .setColor(embedcolor)
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable54"]));
                    message.reply({ embeds: [embed] });
                    rank(rankuser); //also sending the rankcard
                } catch (error) {
                    console.log("RANKING:".underline.red + " :: " + error.stack.toString().grey);
                    message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable55"]));
                }
            }

            function addlevel() {
                try {
                    /**
                     * GET the Rank User
                     * @info you can tag him
                     */
                    if (!args[0])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable56"]));
                    let rankuser = message.mentions.users.first();
                    if (!rankuser)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable57"]));
                    // if(rankuser.bot) return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable58"]));

                    //Call the databasing function!
                    const key = `${message.guild.id}-${rankuser.id}`;
                    databasing(rankuser);
                    let newLevel = client.points.get(key, `level`);
                    if (!args[1])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable59"]));
                    if (Number(args[1]) > 10000)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable60"]));
                    if (Number(args[1]) < 0) args[1] = 0;
                    for (let i = 0; i < Number(args[1]); i++) {
                        client.points.set(key, 0, `points`); //set points to 0
                        client.points.inc(key, `level`); //add 1 to level
                        //HARDING UP!
                        newLevel = client.points.get(key, `level`); //get current NEW level
                        if (newLevel % 4 === 0) client.points.math(key, `+`, 100, `neededpoints`);
                    }
                    const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                    const newPoints = client.points.get(key, `points`); //get current NEW points

                    //THE INFORMATION EMBED
                    const embed = new Discord.EmbedBuilder()
                        .setAuthor({
                            name: `Ranking of:  ${rankuser.tag}`,
                            iconURL: rankuser.displayAvatarURL()
                        })
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable61"]))
                        .setColor(embedcolor);
                    message.channel.send({ content: `${rankuser}`, embeds: [embed] }).catch(() => {});
                    rank(rankuser); //also sending the rankcard
                    const sssembed = new Discord.EmbedBuilder()
                        .setColor(embedcolor)
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable62"]));
                    message.reply(sssembed);
                } catch (error) {
                    console.log("RANKING:".underline.red + " :: " + error.stack.toString().grey);
                    message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable63"]));
                }
            }

            function setlevel() {
                try {
                    /**
                     * GET the Rank User
                     * @info you can tag him
                     */
                    if (!args[0])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable64"]));
                    let rankuser = message.mentions.users.first();
                    if (!rankuser)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable65"]));
                    // if(rankuser.bot) return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable66"]));

                    //Call the databasing function!
                    const key = `${message.guild.id}-${rankuser.id}`;
                    databasing(rankuser);

                    if (!args[1])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable67"]));
                    if (Number(args[1]) < 1) args[1] = 1;

                    if (Number(args[1]) > 10000)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable68"]));

                    client.points.set(key, Number(args[1]), `level`); //set level to the wanted level
                    client.points.set(key, 0, `points`); //set the points to 0

                    let newLevel = client.points.get(key, `level`); //set level to the wanted level
                    let counter = Number(newLevel) / 4;

                    client.points.set(key, 400, `neededpoints`); //set neededpoints to 0 for beeing sure
                    //add 100 for each divideable 4
                    for (let i = 0; i < Math.floor(counter); i++) {
                        client.points.math(key, `+`, 100, `neededpoints`);
                    }
                    const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points

                    const newPoints = client.points.get(key, `points`); //get current NEW points
                    //THE INFORMATION EMBED
                    const embed = new Discord.EmbedBuilder()
                        .setAuthor({
                            name: `Ranking of:  ${rankuser.tag}`,
                            iconURL: rankuser.displayAvatarURL()
                        })
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable69"]))
                        .setColor(embedcolor);
                    message.channel.send({ content: `${rankuser}`, embeds: [embed] }).catch(() => {});
                    rank(rankuser); //also sending the rankcard
                    const sssembed = new Discord.EmbedBuilder()
                        .setColor(embedcolor)
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable70"]));
                    message.reply(sssembed);
                } catch (error) {
                    console.log("RANKING:".underline.red + " :: " + error.stack.toString().grey);
                    message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable71"]));
                }
            }

            function removelevel() {
                try {
                    /**
                     * GET the Rank User
                     * @info you can tag him
                     */
                    if (!args[0])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable72"]));
                    let rankuser = message.mentions.users.first();
                    if (!rankuser)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable73"]));
                    // if(rankuser.bot) return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable74"]));

                    //Call the databasing function!
                    const key = `${message.guild.id}-${rankuser.id}`;
                    databasing(rankuser);
                    let newLevel = client.points.get(key, `level`);
                    if (!args[1])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable75"]));
                    if (Number(args[1]) < 0) args[1] = 0;
                    for (let i = 0; i < Number(args[1]); i++) {
                        client.points.set(key, 0, `points`); //set points to 0
                        client.points.dec(key, `level`); //add 1 to level
                        //HARDING UP!
                        newLevel = client.points.get(key, `level`); //get current NEW level
                        if (newLevel < 1) client.points.set(key, 1, `level`); //if smaller then 1 set to 1
                    }
                    snewLevel = client.points.get(key, `level`); //get current NEW level
                    let counter = Number(snewLevel) / 4;

                    client.points.set(key, 400, `neededpoints`); //set neededpoints to 0 for beeing sure
                    //add 100 for each divideable 4
                    for (let i = 0; i < Math.floor(counter); i++) {
                        client.points.math(key, `+`, 100, `neededpoints`);
                    }
                    const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                    const newPoints = client.points.get(key, `points`); //get current NEW points

                    //THE INFORMATION EMBED
                    const embed = new Discord.EmbedBuilder()
                        .setAuthor({
                            name: `Ranking of:  ${rankuser.tag}`,
                            iconURL: rankuser.displayAvatarURL()
                        })
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable76"]))
                        .setColor(embedcolor);
                    message.channel.send({ content: `${rankuser}`, embeds: [embed] }).catch(() => {});
                    rank(rankuser); //also sending the rankcard
                    const sssembed = new Discord.EmbedBuilder()
                        .setColor(embedcolor)
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable77"]));
                    message.reply(sssembed);
                } catch (error) {
                    console.log("RANKING:".underline.red + " :: " + error.stack.toString().grey);
                    message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable78"]));
                }
            }

            function resetranking() {
                try {
                    /**
                     * GET the Rank User
                     * @info you can tag him
                     */
                    if (!args[0])
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable79"]));
                    let rankuser = message.mentions.users.first();
                    if (!rankuser)
                        return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable80"]));
                    // if(rankuser.bot) return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable81"]));

                    //Call the databasing function!
                    const key = `${message.guild.id}-${rankuser.id}`;
                    databasing(rankuser);

                    client.points.set(key, 1, `level`); //set level to 0
                    client.points.set(key, 0, `points`); //set the points to 0
                    client.points.set(key, 400, `neededpoints`); //set neededpoints to 0 for beeing sure
                    client.points.set(key, "", `oldmessage`); //set old message to 0

                    //THE INFORMATION EMBED
                    const embed = new Discord.EmbedBuilder()
                        .setAuthor({
                            name: `Ranking of:  ${rankuser.tag}`,
                            iconURL: rankuser.displayAvatarURL()
                        })
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable82"]))
                        .setColor(embedcolor);
                    message.channel.send({ content: `${rankuser}`, embeds: [embed] }).catch(() => {});
                    rank(rankuser); //also sending the rankcard
                    const sssembed = new Discord.EmbedBuilder()
                        .setColor(embedcolor)
                        .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable83"]));
                    message.reply(sssembed);
                } catch (error) {
                    console.log("RANKING:".underline.red + " :: " + error.stack.toString().grey);
                    message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable84"]));
                }
            }

            function registerall() {
                let allmembers = message.guild.members.cache.map(i => i.id).slice(0, 100);
                for (let i = 0; i < allmembers.length; i++) {
                    //Call the databasing function!
                    let rankuser = message.guild.members.cache.get(allmembers[i]).user;
                    databasing(rankuser);
                }
                const embed = new Discord.EmbedBuilder()
                    .setColor(embedcolor)
                    .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable85"]));
                message.reply({ content: `I limited the MAXIMUM MEMBERS to 100`, embeds: [embed] });
            }

            function resetrankingall() {
                const filtered = client.points
                    .filter(p => p.guild === message.guild.id && (p.points > 0 || p.level > 1))
                    .map(this_Code_is_by_Tomato_6966 => this_Code_is_by_Tomato_6966);
                let allmembers = message.guild.members.cache
                    .map(i => i.id)
                    .filter(d => filtered.map(d => d.user).includes(d));
                for (let i = 0; i < allmembers.length; i++) {
                    let rankmember = message.guild.members.cache.get(allmembers[i]);
                    if (!rankmember) continue;
                    let rankuser = rankmember.user;
                    const key = `${message.guild.id}-${rankuser.id}`;
                    if (client.points.has(key)) {
                        client.points.set(key, 1, `level`); //set level to 0
                        client.points.set(key, 0, `points`); //set the points to 0
                        client.points.set(key, 400, `neededpoints`); //set neededpoints to 0 for beeing sure
                        client.points.set(key, "", `oldmessage`); //set old message to 0
                    }
                }
                const embed = new Discord.EmbedBuilder()
                    .setColor(embedcolor)
                    .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable86"]));
                message.reply({ embeds: [embed] });
            }

            function addrandomall() {
                let maxnum = 5;
                if (args[0]) maxnum = Number(args[0]);
                if (args[0] && Number(maxnum) > 10000)
                    return message.reply(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable87"]));
                let allmembers = message.guild.members.cache.filter(member => !member.user.bot).keyArray();
                for (let i = 0; i < allmembers.length; i++) {
                    //Call the databasing function!
                    let rankuser = message.guild.members.cache.get(allmembers[i]).user;
                    if (rankuser.bot) continue;
                    if (!client.points.has(`${message.guild.id}-${rankuser.id}`)) continue;
                    Giving_Ranking_Points(`${message.guild.id}-${rankuser.id}`, maxnum);
                    Giving_Ranking_Points(`${message.guild.id}-${message.author.id}`, maxnum);
                }
                const embed = new Discord.EmbedBuilder()
                    .setColor(embedcolor)
                    .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable88"]));
                message.reply({ embeds: [embed] });
            }

            function levelinghelp() {
                const embed = new Discord.EmbedBuilder()
                    .setTitle(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable89"]))
                    .setDescription(eval(client.la[ls]["handlers"]["rankingjs"]["ranking"]["variable90"]))
                    .setColor(embedcolor)
                    .addFields([
                        {
                            name: "`rank [@User]`",
                            value: ">>> *Shows the Rank of a User*",
                            inline: true,
                        },
                        {
                            name: "`leaderboard`",
                            value: ">>> *Shows the Top 10 Leaderboard*",
                            inline: true,
                        },
                        {
                            name: "`setxpcounter <@USER> <AMOUNT>`",
                            value: ">>> *Changes the amount of how much to count, x1, x2, x3, ...*",
                            inline: true,
                        },

                        {
                            name: "`addpoints <@User> <Amount`",
                            value: ">>> *Add a specific amount of Points to a User*",
                            inline: true,
                        },
                        {
                            name: "`setpoints <@User> <Amount`",
                            value: ">>> *Set a specific amount of Points to a User*",
                            inline: true,
                        },
                        {
                            name: "`removepoints <@User> <Amount`",
                            value: ">>> *Remove a specific amount of Points to a User*",
                            inline: true,
                        },

                        {
                            name: "`addlevel <@User> <Amount`",
                            value: ">>> *Add a specific amount of Levels to a User*",
                            inline: true,
                        },
                        {
                            name: "`setlevel <@User> <Amount`",
                            value: ">>> *Set a specific amount of Levels to a User*",
                            inline: true,
                        },
                        {
                            name: "`removelevel <@User> <Amount`",
                            value: ">>> *Remove a specific amount of Levels to a User*",
                            inline: true,
                        },

                        {
                            name: "`resetranking <@User>`",
                            value: ">>> *Resets the ranking of a User*",
                            inline: true,
                        },
                        {
                            name: "`setglobalxpcounter <AMOUNT>`",
                            value: ">>> *Sets the global xp counter for this guild, standard 1*",
                            inline: true,
                        },
                        {
                            name: "\u200b",
                            value: "\u200b",
                            inline: true,
                        },

                        {
                            name: "`registerall`",
                            value: ">>> *Register everyone in the Server to the Database*",
                            inline: true,
                        },
                        {
                            name: "`resetrankingall`",
                            value: ">>> *Reset ranking of everyone in this Server*",
                            inline: true,
                        },
                        {
                            name: "`addrandomall`",
                            value: ">>> *Add a random amount of Points to everyone*",
                            inline: true,
                        },
                    ]);
                message.channel.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (e) {
            console.log("ranking: " + e);
        }
    });
    client.points.ensure("Voicerank", {
        voicerank: {},
    });
    let voiceStates = client.points.get("Voicerank", "voicerank");

    client.on("ready", () => {
        setTimeout(() => {
            //For each guild, set the voice state into the db if there are none
            client.guilds.cache.each(g => {
                let guild = client.guilds.cache.get(g.id);
                if (guild && guild.voiceStates) {
                    guild.voiceStates.cache
                        .map(voiceState => voiceState.id)
                        .forEach(id => {
                            if (!voiceStates[id]) {
                                voiceStates[id] = new Date();
                            }
                        });
                }
            });
            client.points.set("Voicerank", voiceStates, "voicerank");
        }, 1500);
    });

    client.on("voiceStateUpdate", async (oldState, newState) => {
        if (!newState.guild || !newState.member.user || newState.member.user.bot) return;
        var { id } = oldState; // This is the user"s ID
        if (!oldState.channel) {
            // The user has joined a voice channel
            voiceStates[id] = new Date();
            voiceStates = client.points.set("Voicerank", voiceStates, "voicerank");
            voiceStates = client.points.get("Voicerank", "voicerank");
        }
        // The User has left a voice Channel
        else if (!newState.channel) {
            var now = new Date();
            var joined = voiceStates[id] || new Date();
            var connectedTime = now.getTime() - joined.getTime();
            //Grant Coints!
            if (connectedTime > 60000) {
                if (newState.member.user.bot || !newState.guild) return;
                client.setups.ensure(newState.guild.id, {
                    ranking: {
                        enabled: true,
                        backgroundimage: "null",
                    },
                });
                let ranking = client.setups.get(newState.guild.id, "ranking");
                if (!ranking?.enabled) return;
                const key = `${newState.guild.id}-${newState.member.user.id}`;
                client.points.ensure(key, {
                    user: newState.member.user.id,
                    usertag: newState.member.user.username,
                    xpcounter: 1,
                    guild: newState.guild.id,
                    points: 0,
                    neededpoints: 400,
                    level: 1,
                    voicepoints: 0,
                    neededvoicepoints: 400,
                    voicelevel: 1,
                    voicetime: 0,
                    oldmessage: "",
                });
                client.points.set(key, newState.member.user.username, `usertag`);
                let VoicePoints = Math.floor(connectedTime / 60000);
                client.points.math(key, "+", Math.floor(connectedTime / 60000), `voicetime`);
                //console.log("CONNECTED TIME: " + Math.floor(connectedTime / 60000) + "min | " + "POINTS FOR IT: " + VoicePoints);
                let curPoints = client.points.get(key, `voicepoints`);
                let neededPoints = client.points.get(key, `neededvoicepoints`);
                while (curPoints > neededPoints) {
                    client.points.set(key, curPoints - neededPoints, `voicepoints`); //set points to 0
                    client.points.inc(key, `voicelevel`); //add 1 to level
                    //HARDING UP!
                    const newLevel = client.points.get(key, `voicelevel`); //get current NEW level
                    if (newLevel % 4 === 0) client.points.math(key, `+`, 100, `neededvoicepoints`);
                    curPoints = client.points.get(key, `voicepoints`);
                    neededPoints = client.points.get(key, `neededvoicepoints`);
                }
                let leftpoints = neededPoints - curPoints;
                let toaddpoints = VoicePoints;
                addingpoints(toaddpoints, leftpoints);
                function addingpoints(toaddpoints, leftpoints) {
                    if (toaddpoints >= leftpoints) {
                        client.points.set(key, 0, `voicepoints`); //set points to 0
                        client.points.inc(key, `voicelevel`); //add 1 to level
                        //HARDING UP!
                        const newLevel = client.points.get(key, `voicelevel`); //get current NEW level
                        if (newLevel % 4 === 0) client.points.math(key, `+`, 100, `neededvoicepoints`);
                        const newneededPoints = client.points.get(key, `neededvoicepoints`); //get NEW needed Points
                        addingpoints(toaddpoints - leftpoints, newneededPoints); //Ofc there is still points left to add so... lets do it!
                    } else {
                        client.points.math(key, `+`, Number(toaddpoints), `voicepoints`);
                    }
                }
            } else {
                //console.log(`Not enough connected time: ${connectedTime}`)
            }
            //try to remove him from the db
            try {
                delete voiceStates[id];
                voiceStates = client.points.set("Voicerank", voiceStates, "voicerank");
                voiceStates = client.points.get("Voicerank", "voicerank");
            } catch (e) {}
        }
    });
};
//Desarrollado por Melodia | github.com/melodiabl
function shortenLargeNumber(num, digits) {
    var units = ["k", "M", "G", "T", "P", "E", "Z", "Y"],
        decimal;

    for (var i = units.length - 1; i >= 0; i--) {
        decimal = Math.pow(1000, i + 1);

        if (num <= -decimal || num >= decimal) {
            return +(num / decimal).toFixed(digits) + units[i];
        }
    }

    return num;
}
function cduration(duration) {
    let remain = duration * 60 * 1000;
    let days = Math.floor(remain / (1000 * 60 * 60 * 24));
    remain = remain % (1000 * 60 * 60 * 24);
    let hours = Math.floor(remain / (1000 * 60 * 60));
    remain = remain % (1000 * 60 * 60);
    let minutes = Math.floor(remain / (1000 * 60));
    remain = remain % (1000 * 60);
    let seconds = Math.floor(remain / 1000);
    remain = remain % 1000;
    let time = {
        days,
        hours,
        minutes,
        seconds,
    };
    let parts = [];
    if (time.days) {
        let ret = time.days + " D";
        parts.push(ret);
    }
    if (time.hours) {
        let ret = time.hours + " H";
        parts.push(ret);
    }
    if (time.minutes) {
        let ret = time.minutes + " M";
        parts.push(ret);
    }
    if (time.seconds) {
        let ret = time.seconds + " S";
        parts.push(ret);
    }
    if (parts.length === 0) {
        return ["instantly"];
    }
    return parts;
}
