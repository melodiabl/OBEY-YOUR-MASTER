const chalk = require('chalk')
const inquirer = require('inquirer')
const CFonts = require('cfonts')
const { checkEnv } = require('./checkEnv')

function canUseInteractiveUi() {
  return Boolean(process.stdout.isTTY && process.stdin.isTTY)
}

async function main() {
  if (!canUseInteractiveUi()) {
    console.error('Interactive menu requires a TTY. Try: `node . --help`')
    process.exitCode = 1
    return
  }

  CFonts.say('OBEY YOUR MASTER', { font: 'block', align: 'center', gradient: ['red', 'magenta'] })
  console.log(chalk.dim('Main menu'))

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '¿Qué quieres hacer?',
        pageSize: 10,
        choices: [
          { name: 'Iniciar bot', value: 'start' },
          { name: 'Wizard (.env)', value: 'wizard' },
          { name: 'Check env (BOT_TOKEN/MONGO_URL)', value: 'check-env' },
          new inquirer.Separator(),
          { name: 'Salir', value: 'exit' }
        ]
      }
    ])

    if (action === 'exit') return

    if (action === 'wizard') {
      require('./wizard.js')
      return
    }

    if (action === 'check-env') {
      checkEnv()
      console.log('')
      await inquirer.prompt([{ type: 'input', name: 'back', message: 'Enter para volver al menú' }])
      continue
    }

    if (action === 'start') {
      require('../index.js')
      return
    }
  }
}

main().catch((err) => {
  console.error(chalk.red('Error en menu:'), err)
  process.exitCode = 1
})
