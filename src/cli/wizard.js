const fs = require('fs')
const path = require('path')
const os = require('os')

const CFonts = require('cfonts')
const chalk = require('chalk')
const inquirer = require('inquirer')

const ROOT_ENV_PATH = path.resolve(__dirname, '../../.env')

function parseEnvFile(contents) {
  const lines = contents.split(/\r?\n/)
  const entries = new Map()

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = raw.indexOf('=')
    if (eqIndex === -1) continue

    const key = raw.slice(0, eqIndex).trim()
    const value = raw.slice(eqIndex + 1)
    if (key) entries.set(key, { value, lineIndex: i })
  }

  return { lines, entries }
}

function maskValue(value) {
  if (value == null) return ''
  const str = String(value)
  if (!str) return ''
  if (str.length <= 6) return '*'.repeat(str.length)
  return `${str.slice(0, 3)}***${str.slice(-3)}`
}

function upsertKey(parsed, key, value) {
  const existing = parsed.entries.get(key)
  if (existing) {
    parsed.lines[existing.lineIndex] = `${key}=${value}`
  } else {
    if (parsed.lines.length && parsed.lines[parsed.lines.length - 1].trim() !== '') {
      parsed.lines.push('')
    }
    parsed.lines.push(`${key}=${value}`)
  }
}

async function main() {
  CFonts.say('OBEY YOUR MASTER', {
    font: 'block',
    align: 'center',
    gradient: ['red', 'magenta']
  })

  console.log(chalk.dim(`Wizard: ${ROOT_ENV_PATH}`))

  if (!fs.existsSync(ROOT_ENV_PATH)) {
    fs.writeFileSync(ROOT_ENV_PATH, '', 'utf8')
    console.log(chalk.yellow('No existe .env, creado vacío.'))
  }

  let parsed = parseEnvFile(fs.readFileSync(ROOT_ENV_PATH, 'utf8'))

  const fields = [
    { key: 'BOT_TOKEN', label: 'Discord Bot Token', secret: true },
    { key: 'MONGO_URL', label: 'MongoDB URL', secret: true },
    { key: 'PREFIX', label: 'Prefijo', secret: false },
    { key: 'STATUS', label: 'Status', secret: false },
    { key: 'STATUS_TYPE', label: 'Status Type', secret: false },
    { key: 'LANGUAGE', label: 'Idioma', secret: false },
    { key: 'COLOR', label: 'Color', secret: false },
    { key: 'OWNER_IDS', label: 'Owner IDs', secret: false },
    { key: 'LAVALINK_HOST', label: 'Lavalink Host', secret: false },
    { key: 'LAVALINK_PORT', label: 'Lavalink Port', secret: false },
    { key: 'LAVALINK_PASSWORD', label: 'Lavalink Password', secret: true },
    { key: 'LAVALINK_SECURE', label: 'Lavalink Secure', secret: false }
  ]

  while (true) {
    parsed = parseEnvFile(fs.readFileSync(ROOT_ENV_PATH, 'utf8'))

    const menuChoices = [
      { name: 'Ver configuración (resumen)', value: 'view' },
      new inquirer.Separator(),
      ...fields.map((f) => ({
        name: `${f.label} (${f.key}) = ${
          f.secret ? maskValue(parsed.entries.get(f.key)?.value) : (parsed.entries.get(f.key)?.value ?? '')
        }`,
        value: `edit:${f.key}`
      })),
      new inquirer.Separator(),
      { name: 'Salir', value: 'exit' }
    ]

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '¿Qué quieres hacer?',
        pageSize: 18,
        choices: menuChoices
      }
    ])

    if (action === 'exit') break

    if (action === 'view') {
      console.log('')
      for (const f of fields) {
        const raw = parsed.entries.get(f.key)?.value ?? ''
        const shown = f.secret ? maskValue(raw) : raw
        const color = raw ? chalk.green : chalk.yellow
        console.log(`${chalk.cyan(f.key)}=${color(shown || '(vacío)')}`)
      }
      console.log('')
      continue
    }

    if (String(action).startsWith('edit:')) {
      const key = String(action).slice('edit:'.length)
      const field = fields.find((f) => f.key === key)
      const current = parsed.entries.get(key)?.value ?? ''

      const { nextValue } = await inquirer.prompt([
        {
          type: field?.secret ? 'password' : 'input',
          name: 'nextValue',
          message: `Nuevo valor para ${key}:`,
          default: field?.secret ? undefined : current,
          mask: field?.secret ? '*' : undefined,
          validate: (v) => (String(v).trim().length ? true : 'No puede estar vacío')
        }
      ])

      upsertKey(parsed, key, String(nextValue).trim())
      fs.writeFileSync(ROOT_ENV_PATH, parsed.lines.join(os.EOL), 'utf8')
      console.log(chalk.green(`Guardado: ${key}`))
    }
  }

  console.log(chalk.dim('Listo.'))
}

main().catch((err) => {
  console.error(chalk.red('Error en wizard:'), err)
  process.exitCode = 1
})

