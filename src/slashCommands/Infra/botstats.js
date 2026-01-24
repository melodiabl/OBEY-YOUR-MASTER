const { SlashCommandBuilder, version: djsVersion } = require('discord.js')
const os = require('os')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyWarn } = require('../../core/ui/interactionKit')
const { headerLine } = require('../../core/ui/uiKit')

let si = null
try {
  // Optional but recommended: `npm i systeminformation`
  // eslint-disable-next-line import/no-extraneous-dependencies
  si = require('systeminformation')
} catch (e) {
  si = null
}

function bytesToMb (b) {
  const n = Number(b) || 0
  return (n / 1024 / 1024)
}

function bytesToGb (b) {
  const n = Number(b) || 0
  return (n / 1024 / 1024 / 1024)
}

function fmt (n, digits = 1) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 'N/A'
  return x.toFixed(digits)
}

function fmtUptime (seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const d = Math.floor(s / 86400)
  const h = Math.floor(s / 3600) % 24
  const m = Math.floor(s / 60) % 60
  const sec = s % 60
  return `${d}d ${h}h ${m}m ${sec}s`
}

async function getSystemSnapshot () {
  if (!si) {
    const cpu = os.cpus()?.[0]
    return {
      osLabel: `${os.platform()} ${os.arch()}`,
      cpuLabel: cpu?.model ? String(cpu.model).split('@')[0].trim() : 'N/A',
      cpuCores: os.cpus()?.length || null,
      cpuLoad: null,
      ramUsedMb: bytesToMb(process.memoryUsage().rss),
      ramTotalMb: bytesToMb(os.totalmem()),
      diskUsedGb: null,
      diskTotalGb: null
    }
  }

  const [osInfo, cpu, load, mem, fs] = await Promise.all([
    si.osInfo().catch(() => null),
    si.cpu().catch(() => null),
    si.currentLoad().catch(() => null),
    si.mem().catch(() => null),
    si.fsSize().catch(() => null)
  ])

  const diskRows = Array.isArray(fs) ? fs : []
  const diskTotal = diskRows.reduce((acc, r) => acc + (Number(r.size) || 0), 0)
  const diskUsed = diskRows.reduce((acc, r) => acc + (Number(r.used) || 0), 0)

  return {
    osLabel: osInfo?.distro
      ? `${osInfo.distro} ${osInfo.release || ''}`.trim()
      : `${os.platform()} ${os.arch()}`,
    cpuLabel: cpu?.brand || cpu?.manufacturer ? `${cpu.manufacturer || ''} ${cpu.brand || ''}`.trim() : (os.cpus()?.[0]?.model || 'N/A'),
    cpuCores: cpu?.cores || os.cpus()?.length || null,
    cpuLoad: Number(load?.currentLoad),
    ramUsedMb: bytesToMb(mem?.used),
    ramTotalMb: bytesToMb(mem?.total),
    diskUsedGb: diskTotal ? bytesToGb(diskUsed) : null,
    diskTotalGb: diskTotal ? bytesToGb(diskTotal) : null
  }
}
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('Estado real del bot y del host'),

  async execute (client, interaction) {
    let snap = null
    try {
      snap = await getSystemSnapshot()
    } catch (e) {
      return replyWarn(client, interaction, {
        system: 'infra',
        title: 'No pude leer el sistema',
        lines: [
          `${Emojis.dot} Motivo: ${Format.inlineCode(e?.message || String(e))}`,
          `${Emojis.dot} Tip: revisa permisos del host o reinstala dependencias`
        ]
      }, { ephemeral: true })
    }

    const ping = Number(client.ws?.ping) || 0
    const guilds = client.guilds?.cache?.size || 0
    const users = client.users?.cache?.size || 0

    const sysLines = [
      `${Emojis.dot} OS: ${Format.inlineCode(snap.osLabel)}`,
      `${Emojis.dot} CPU: ${Format.inlineCode(snap.cpuLabel)}${snap.cpuCores ? ` ${Format.subtext(`${snap.cpuCores} cores`)}` : ''}`,
      snap.cpuLoad !== null && snap.cpuLoad !== undefined
        ? `${Emojis.dot} Carga: ${Format.inlineCode(`${fmt(snap.cpuLoad, 1)}%`)}`
        : null,
      (snap.ramUsedMb && snap.ramTotalMb)
        ? `${Emojis.dot} RAM: ${Format.inlineCode(`${fmt(snap.ramUsedMb, 0)}MB / ${fmt(snap.ramTotalMb, 0)}MB`)}`
        : null,
      (snap.diskUsedGb && snap.diskTotalGb)
        ? `${Emojis.dot} Disco: ${Format.inlineCode(`${fmt(snap.diskUsedGb, 1)}GB / ${fmt(snap.diskTotalGb, 1)}GB`)}`
        : null
    ].filter(Boolean)

    const botLines = [
      `${Emojis.dot} Discord.js: ${Format.inlineCode(`v${djsVersion}`)}`,
      `${Emojis.dot} Node.js: ${Format.inlineCode(process.version)}`,
      `${Emojis.dot} Ping WS: ${Format.inlineCode(`${ping}ms`)}`,
      `${Emojis.dot} Servidores: ${Format.inlineCode(String(guilds))}  ${Emojis.dot} Cache users: ${Format.inlineCode(String(users))}`
    ]

    const credits = [
      `${Emojis.star} Powered by ${Format.bold('melodia')}`,
      `${Emojis.star} Host: ${Format.bold('SkyUltraPlus')}`
    ]

    return replyEmbed(client, interaction, {
      system: 'infra',
      kind: 'info',
      title: `${Emojis.system} Bot Status`,
      description: headerLine(Emojis.system, 'Infraestructura'),
      fields: [
        { name: `${Emojis.stats} Sistema`, value: sysLines.join('\n'), inline: false },
        { name: `${Emojis.utility} Bot`, value: botLines.join('\n'), inline: false },
        { name: `${Emojis.crown} Creditos`, value: credits.join('\n'), inline: false },
        { name: `${Emojis.calendar} Uptime`, value: Format.inlineCode(fmtUptime(process.uptime())), inline: false }
      ],
      footer: 'OBEY YOUR MASTER',
      thumbnail: client.user.displayAvatarURL({ size: 256 }),
      signature: 'Estado claro y sin simulacion'
    }, { ephemeral: false })
  }
}
