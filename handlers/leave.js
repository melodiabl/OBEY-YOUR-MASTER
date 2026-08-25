//Import npm modules
const Discord = require("discord.js");
const Canvas = require("@napi-rs/canvas");
const canvacord = require("canvacord");
const FormData = require("form-data");
const axios = require("axios");
//Load fonts
try {
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/Genta.ttf", "Genta");
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/UbuntuMono.ttf", "UbuntuMono");
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/DMSans-Bold.ttf", "DM Sans");
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/STIXGeneral.ttf", "STIXGeneral");
  Canvas.GlobalFonts.registerFromPath("./assets/fonts/Arial.ttf", "Arial");
} catch {}
//require functions from files
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const { clipRounded, drawCardBg } = require('./canvasUtils')
//Create Variables
const Fonts = "Genta, UbuntuMono, `DM Sans`, STIXGeneral, AppleSymbol, Arial, ArialUnicode";
const wideFonts = "`DM Sans`, STIXGeneral, AppleSymbol, Arial, ArialUnicode";
let invitemessage = "\u200b";

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function _hexRgba(h, a) {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function _drawAmbientGlow(ctx, cx, cy, radius, color, alphaMax) {
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grd.addColorStop(0, _hexRgba(color, alphaMax || 0.2));
  grd.addColorStop(0.5, _hexRgba(color, (alphaMax || 0.2) * 0.3));
  grd.addColorStop(1, _hexRgba(color, 0));
  ctx.fillStyle = grd;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}
function _drawNoise(ctx, w, h, intensity) {
  const id = ctx.createImageData(w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 256) | 0;
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = (intensity || 6);
  }
  ctx.putImageData(id, 0, 0);
}
async function _generateCard({ member, guild, accentColor, showAvatar, showDiscriminator, showMemberCount, showServerName, background, isLeave }) {
  const canvas = Canvas.createCanvas(1772, 720), ctx = canvas.getContext("2d");
  const W = 1772, H = 720, ACCENT = accentColor || "#5865F2";
  clipRounded(ctx, W, H, 28)
  await drawCardBg(ctx, W, H, { fc: ACCENT, customBg: background })
  const cx = 80, cy = 110, cw = 930, ch = 500, cr = 36;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 80; ctx.shadowOffsetY = 20;
  _roundRect(ctx, cx, cy, cw, ch, cr);
  const gg = ctx.createRadialGradient(cx + 100, cy, 0, cx + cw / 2, cy + ch / 2, cw);
  gg.addColorStop(0, _hexRgba(ACCENT, 0.06)); gg.addColorStop(0.5, "rgba(16,16,40,0.85)"); gg.addColorStop(1, "rgba(8,8,24,0.92)");
  ctx.fillStyle = gg; ctx.fill(); ctx.restore();
  _roundRect(ctx, cx, cy, cw, ch, cr); ctx.fillStyle = _hexRgba(ACCENT, 0.03); ctx.fill();
  ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.4); ctx.shadowBlur = 20;
  const ga = ctx.createLinearGradient(cx + 12, cy + 40, cx + 12, cy + ch - 40);
  ga.addColorStop(0, ACCENT); ga.addColorStop(0.5, _hexRgba(ACCENT, 0.6)); ga.addColorStop(1, ACCENT);
  _roundRect(ctx, cx + 12, cy + 40, 5, ch - 80, 2.5); ctx.fillStyle = ga; ctx.fill(); ctx.restore();
  const asz = 194, ax = cx + 60, ay = cy + (ch - asz) / 2;
  if (showAvatar) { try {
    const av = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true }));
    ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.6); ctx.shadowBlur = 40; ctx.shadowOffsetY = 5;
    ctx.beginPath(); ctx.arc(ax + asz / 2, ay + asz / 2, asz / 2 + 8, 0, Math.PI * 2); ctx.closePath();
    const rg = ctx.createLinearGradient(ax, ay, ax + asz, ay + asz);
    rg.addColorStop(0, ACCENT); rg.addColorStop(0.5, _hexRgba(ACCENT, 0.4)); rg.addColorStop(1, ACCENT);
    ctx.fillStyle = rg; ctx.fill(); ctx.restore();
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(ax + asz / 2, ay + asz / 2, asz / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(av, ax, ay, asz, asz); ctx.restore();
  } catch {} }
  const tx = cx + (showAvatar ? asz + 105 : 70), ty = cy + 180, mw = cw - (tx - cx) - 80;
  let fs = 56; ctx.font = `bold ${fs}px "DM Sans", "Arial", sans-serif`;
  while (ctx.measureText(member.user.username).width > mw && fs > 26) ctx.font = `bold ${fs--}px "DM Sans", "Arial", sans-serif`;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 15; ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#FFFFFF"; ctx.fillText(member.user.username, tx, ty); ctx.restore();
  const nw = ctx.measureText(member.user.username).width;
  if (showDiscriminator && member.user.discriminator && member.user.discriminator !== "0") {
    ctx.font = '28px "DM Sans", "Arial", sans-serif'; ctx.fillStyle = "#9999AA"; ctx.fillText(`#${member.user.discriminator}`, tx + nw + 20, ty - 2);
  }
  const lY = ty + 45; ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.4); ctx.shadowBlur = 12;
  const ag = ctx.createLinearGradient(tx, lY, tx + 90, lY);
  ag.addColorStop(0, ACCENT); ag.addColorStop(0.6, _hexRgba(ACCENT, 0.5)); ag.addColorStop(1, "transparent");
  ctx.fillStyle = ag; ctx.fillRect(tx, lY, 90, 4); ctx.restore();
  let dY = lY + 55;
  if (showServerName) {
    ctx.font = '28px "DM Sans", "Arial", sans-serif'; ctx.fillStyle = ACCENT;
    let msg = isLeave ? `Gracias por visitarnos, ${guild.name}` : `Te damos la bienvenida a ${guild.name}`;
    while (ctx.measureText(msg + "\u2026").width > mw && msg.length > 5) msg = msg.slice(0, -1);
    if (msg.length < (isLeave ? `Gracias por visitarnos, ${guild.name}` : `Te damos la bienvenida a ${guild.name}`).length) msg += "\u2026";
    ctx.fillText(msg, tx, dY); dY += 48;
  }
  if (showMemberCount) {
    ctx.font = '20px "DM Sans", "Arial", sans-serif'; ctx.fillStyle = "#8888AA";
    ctx.fillText(isLeave ? `Fuiste el miembro #${guild.memberCount}` : `Eres el miembro #${guild.memberCount}`, tx, dY);
  }
  const bx = cx + cw - 28, by = cy + 36;
  ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.3); ctx.shadowBlur = 20;
  _roundRect(ctx, bx - 134, by, 134, 46, 23); ctx.fillStyle = _hexRgba(ACCENT, 0.12); ctx.fill(); ctx.restore();
  ctx.save(); _roundRect(ctx, bx - 130, by + 2, 130, 42, 21); ctx.strokeStyle = _hexRgba(ACCENT, 0.25); ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  ctx.font = 'bold 14px "DM Sans", "Arial", sans-serif'; ctx.fillStyle = ACCENT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(isLeave ? "HASTA PRONTO" : "NUEVO MIEMBRO", bx - 67, by + 23); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  _drawNoise(ctx, W, H, 6);
  return canvas.encode('png');
}
//Start the module
module.exports = client => {
    client.on("guildMemberRemove", async member => {
        if (!member.guild || member.user.bot) return; //if not finished yet return
        const guildSettings = client.settings.get(member.guild.id) || {};
        let ls = guildSettings.language && client.la[guildSettings.language] ? guildSettings.language : 'es';
        let es = guildSettings.embed || { color: '#fffff9', wrongcolor: '#e01e01', thumb: false, footertext: '', footericon: '' };
        // Fetch guild and member data from the db
        EnsureInviteDB(member.guild, member.user);

        let memberData = client.invitesdb.get(member.guild.id + member.id);
        if (!memberData) memberData = { joinData: { type: "unknown", invite: null } };
        if (!memberData.joinData) {
            memberData.joinData = {
                type: "unknown",
                invite: null,
            };
        }
        const leftInviterData = client.invitesdb.find(
            v => v.guildId == member.guild.id && v.invited && Array.isArray(v.invited) && v.invited.includes(member.id)
        );
        const leftInviterDataKey = leftInviterData ? member.guild.id + leftInviterData.id : null;
        // If the member was a rejoin, remove it from whom invited him before
        if (leftInviterData) {
            //make sure that the inviter Data is an array
            if (!leftInviterData.left || !Array.isArray(leftInviterData.left)) {
                leftInviterData.left = [];
            }
            if (!leftInviterData.invited || !Array.isArray(leftInviterData.invited)) {
                leftInviterData.invited = [];
            }
            // It is removed from the invited members // inviterData
            if (!leftInviterData.left.includes(member.id)) leftInviterData.left.push(member.id);
            //add a leave
            leftInviterData.leaves++;
            //Setting it back to 0 if its less then 0
            client.invitesdb.set(leftInviterDataKey, leftInviterData);
            let { invites, fake, leaves } = client.invitesdb.get(leftInviterDataKey);
            if (fake < 0) fake *= -1;
            if (leaves < 0) leaves *= -1;
            if (invites < 0) invites *= -1;
            let realinvites = invites - fake - leaves;
            let invitedby =
                member.guild.members.cache.get(leftInviterData.id) ||
                (await member.guild.members.fetch(leftInviterData.id).catch(() => {})) ||
                false;
            invitemessage = `Was Invited by ${invitedby && invitedby.tag ? `**${invitedby.tag}**` : `<@${leftInviterData.id}>`}\n<:Like:857334024087011378> **${realinvites} Invite${realinvites == 1 ? "" : "s"}**\n[<:joines:866356465299488809> ${invites} Joins | <:leaves:866356598356049930> ${leaves} Leaves | <:no:833101993668771842> ${fake} Fakes]`;
        } else {
            if (memberData.joinData.type == "vanity") {
                try {
                    let res = await member.guild.fetchVanityData().catch(() => {});
                    if (res) {
                        invitemessage = `Invited by a **[Vanity URL](https://discord.gg/${res.code})** with \`${res.uses} Uses\``;
                    } else {
                        invitemessage = `Invited by a **Vanity Link!**`;
                    }
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                    invitemessage = `Invited by a **Vanity Link!**`;
                }
            } else {
                invitemessage = `Invited by an **unkown Member!**`;
            }
        }
        message(member);
    });

    async function message(member) {
        let ls = client.settings.get(member.guild.id, "language");
        let es = client.settings.get(member.guild.id, "embed");
        let leave = client.settings.get(member.guild.id, "leave");
        if (leave && leave.channel !== "nochannel") {
            if (leave.image) {
                if (leave.dm) {
                    if (leave.customdm === "no") dm_msg_autoimg(member);
                    else dm_msg_withimg(member);
                }
                if (leave.custom === "no") msg_autoimg(member);
                else msg_withimg(member);
            } else {
                if (leave.dm) {
                    dm_msg_withoutimg(member);
                }
                msg_withoutimg(member);
            }
        }

        async function msg_withoutimg(member) {
            let leavechannel = client.settings.get(member.guild.id, "leave.channel");
            if (!leavechannel) return;
            let channel = await client.channels.fetch(leavechannel).catch(() => {});
            if (!channel) return;

            //define the leave embed
            const leaveembed = new Discord.EmbedBuilder()
                .setColor(es.wrongcolor)
                .setThumbnail(
                    es.thumb
                        ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                        : undefined
                )
                .setTimestamp()
                .setFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    )
                )
                .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable1"]))
                .setDescription((client.settings.get(member.guild.id, "leave.msg") || "{user} left this Server").replace("{user}", `${member.user}`));
            if (client.settings.get(member.guild.id, "leave.invite")) leaveembed.addFields({ name: "\u200b", value: invitemessage });
            //send the leave embed to there
            channel
                .send({
                    embeds: [leaveembed],
                })
                .catch(e => console.log("This catch prevents a crash"));
        }
        async function dm_msg_withoutimg(member) {
            //define the leave embed
            const leaveembed = new Discord.EmbedBuilder()
                .setColor(es.wrongcolor)
                .setThumbnail(
                    es.thumb
                        ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                        : undefined
                )
                .setTimestamp()
                .setFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    )
                )
                .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable2"]))
                .setDescription((client.settings.get(member.guild.id, "leave.dm_msg") || "{user} left this Server").replace("{user}", `${member.user}`));
            if (client.settings.get(member.guild.id, "leave.invitedm")) leaveembed.addFields({ name: "\u200b", value: invitemessage });
            //send the leave embed to there
            member.user
                .send({
                    embeds: [leaveembed],
                })
                .catch(e => console.log("This catch prevents a crash"));
        }

        async function dm_msg_withimg(member) {
            //define the leave embed
            const leaveembed = new Discord.EmbedBuilder()
                .setColor(es.wrongcolor)
                .setThumbnail(
                    es.thumb
                        ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                        : undefined
                )
                .setTimestamp()
                .setFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    )
                )
                .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable3"]))
                .setDescription((client.settings.get(member.guild.id, "leave.dm_msg") || "{user} left this Server").replace("{user}", `${member.user}`))
                .setImage(client.settings.get(member.guild.id, "leave.customdm"));
            if (client.settings.get(member.guild.id, "leave.invitedm")) leaveembed.addFields({ name: "\u200b", value: invitemessage });
            //send the leave embed to there
            member.user
                .send({
                    embeds: [leaveembed],
                })
                .catch(e => console.log("This catch prevents a crash"));
        }
        async function msg_withimg(member) {
            let leavechannel = client.settings.get(member.guild.id, "leave.channel");
            if (!leavechannel) return;
            let channel = await client.channels.fetch(leavechannel).catch(() => {});
            if (!channel) return;

            //define the leave embed
            const leaveembed = new Discord.EmbedBuilder()
                .setColor(es.wrongcolor)
                .setThumbnail(
                    es.thumb
                        ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                        : undefined
                )
                .setTimestamp()
                .setFooter(client.getFooter(
                        "Good bye: " + member.user.id,
                        member.user.displayAvatarURL()
                    )
                )
                .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable4"]))
                .setDescription((client.settings.get(member.guild.id, "leave.msg") || "{user} left this Server").replace("{user}", `${member.user}`))
                .setImage(client.settings.get(member.guild.id, "leave.custom"));
            if (client.settings.get(member.guild.id, "leave.invite")) leaveembed.addFields({ name: "\u200b", value: invitemessage });
            //send the leave embed to there
            channel
                .send({
                    embeds: [leaveembed],
                })
                .catch(e => console.log("This catch prevents a crash"));
        }

        async function dm_msg_autoimg(member) {
            try {
                //define the leave embed
                const leaveembed = new Discord.EmbedBuilder()
                    .setColor(es.wrongcolor)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : undefined
                    )
                    .setTimestamp()
                    .setFooter(client.getFooter(
                            "Good bye: " + member.user.id,
                            member.user.displayAvatarURL()
                        )
                    )
                    .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable5"]))
                    .setDescription(
                        (client.settings.get(member.guild.id, "leave.dm_msg") || "{user} left this Server").replace("{user}", `${member.user}`)
                    );
                if (client.settings.get(member.guild.id, "leave.invitedm")) leaveembed.addFields({ name: "\u200b", value: invitemessage });

                const buf = await _generateCard({
                    member,
                    guild: member.guild,
                    accentColor: (client.settings.get(member.guild.id, "leave.framecolordm") || "#5865F2").replace("WHITE", "#FFFFF9").replace("#FFFFFF", "#FFFFF9"),
                    showAvatar: client.settings.get(member.guild.id, "leave.pbdm") || false,
                    showDiscriminator: client.settings.get(member.guild.id, "leave.discriminatordm") || false,
                    showMemberCount: client.settings.get(member.guild.id, "leave.membercountdm") || false,
                    showServerName: client.settings.get(member.guild.id, "leave.servernamedm") || false,
                    background: client.settings.get(member.guild.id, "leave.backgrounddm"),
                    isLeave: true,
                });

                //send DM leave card (axios: bypass undici UND_ERR_SOCKET on file uploads)
                try {
                    leaveembed.setImage('attachment://leave-image.png');
                    const dmRes = await axios.post(
                        'https://discord.com/api/v10/users/@me/channels',
                        { recipient_id: member.user.id },
                        { headers: { 'Content-Type': 'application/json', Authorization: `Bot ${client.token}` } }
                    );
                    const form = new FormData();
                    form.append('files[0]', buf, { filename: 'leave-image.png', contentType: 'image/png' });
                    form.append('payload_json', JSON.stringify({
                        embeds: [leaveembed.toJSON()],
                        attachments: [{ id: 0, filename: 'leave-image.png' }],
                    }));
                    await axios.post(
                        `https://discord.com/api/v10/channels/${dmRes.data.id}/messages`,
                        form,
                        { headers: { ...form.getHeaders(), Authorization: `Bot ${client.token}` } }
                    );
                } catch {}
                //member roles add on leave every single role
            } catch {}
        }
        async function msg_autoimg(member) {
            try {
                let leavechannel = client.settings.get(member.guild.id, "leave.channel");
                if (!leavechannel) return;
                let channel = await client.channels.fetch(leavechannel).catch(() => {});
                if (!channel) return;
                //define the leave embed
                const leaveembed = new Discord.EmbedBuilder()
                    .setColor(es.wrongcolor)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : undefined
                    )
                    .setTimestamp()
                    .setFooter(client.getFooter(
                            "Good bye: " + member.user.id,
                            member.user.displayAvatarURL()
                        )
                    )
                    .setTitle(eval(client.la[ls]["handlers"]["leavejs"]["leave"]["variable6"]))
                    .setDescription((client.settings.get(member.guild.id, "leave.msg") || "{user} left this Server").replace("{user}", `${member.user}`));
                if (client.settings.get(member.guild.id, "leave.invite")) leaveembed.addFields({ name: "\u200b", value: invitemessage });

                const buf = await _generateCard({
                    member,
                    guild: member.guild,
                    accentColor: (client.settings.get(member.guild.id, "leave.framecolor") || "#5865F2").replace("WHITE", "#FFFFF9").replace("#FFFFFF", "#FFFFF9"),
                    showAvatar: client.settings.get(member.guild.id, "leave.pb") || false,
                    showDiscriminator: client.settings.get(member.guild.id, "leave.discriminator") || false,
                    showMemberCount: client.settings.get(member.guild.id, "leave.membercount") || false,
                    showServerName: client.settings.get(member.guild.id, "leave.servername") || false,
                    background: client.settings.get(member.guild.id, "leave.background"),
                    isLeave: true,
                });

                //send leave card (axios: bypass undici UND_ERR_SOCKET on file uploads)
                leaveembed.setImage('attachment://leave-image.png');
                const form = new FormData();
                form.append('files[0]', buf, { filename: 'leave-image.png', contentType: 'image/png' });
                form.append('payload_json', JSON.stringify({
                    embeds: [leaveembed.toJSON()],
                    attachments: [{ id: 0, filename: 'leave-image.png' }],
                }));
                axios.post(
                    `https://discord.com/api/v10/channels/${channel.id}/messages`,
                    form,
                    { headers: { ...form.getHeaders(), Authorization: `Bot ${client.token}` } }
                ).catch(() => {});
                //member roles add on leave every single role
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
            }
        }
    }
    function EnsureInviteDB(guild, user) {
        client.invitesdb.ensure(guild.id + user.id, {
            /* REQUIRED */
            id: user.id, // Discord ID of the user
            guildId: guild.id,
            /* STATS */
            fake: 0,
            leaves: 0,
            invites: 0,
            /* INVITES DATA */
            invited: [],
            left: [],
            /* INVITER */
            joinData: {
                type: "unknown",
                invite: null,
            }, // { type: "normal" || "unknown" || "vanity", invite: inviteData || null }
            messagesCount: 0,
            /* BOT */
            bot: user.bot,
        });
    }
};
