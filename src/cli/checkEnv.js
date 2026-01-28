const chalk = require('chalk')

function maskValue(value) {
  if (value == null) return ''
  const str = String(value)
  if (!str) return ''
  if (str.length <= 6) return '*'.repeat(str.length)
  return `${str.slice(0, 3)}***${str.slice(-3)}`
}

function checkEnv() {
  require('dotenv').config({ override: true })

  const required = ['BOT_TOKEN', 'MONGO_URL']
  const missing = required.filter((k) => !process.env[k] || !String(process.env[k]).trim())

  console.log(chalk.bold('Env check'))
  for (const key of required) {
    const value = process.env[key]
    if (value && String(value).trim()) {
      console.log(`${chalk.green('OK')}  ${chalk.cyan(key)}=${chalk.dim(maskValue(value))}`)
    } else {
      console.log(`${chalk.red('MISS')} ${chalk.cyan(key)}`)
    }
  }

  if (missing.length) {
    console.log('')
    console.log(chalk.yellow('Tip: run `node . --wizard` to set them.'))
  }

  return { ok: missing.length === 0, missing }
}

module.exports = { checkEnv, maskValue }

