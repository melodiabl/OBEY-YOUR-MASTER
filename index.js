// Root entrypoint for hosting providers that expect `index.js` at repo root.
// CLI extras:
// - `node . --wizard` to edit `.env`
// - `node . --menu` to open interactive menu
// - `node . --check-env` to validate required env vars

const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const argSet = new Set(args)

function hasAny(...flags) {
  return flags.some((f) => argSet.has(f))
}

function printHelp() {
  // Lazy deps so plain hosting startup stays minimal.
  const chalk = require('chalk')
  const pkgPath = path.resolve(__dirname, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

  console.log(chalk.bold(`${pkg.name} v${pkg.version}`))
  console.log('')
  console.log(chalk.cyan('Usage:'))
  console.log('  node .')
  console.log('  node . --wizard')
  console.log('  node . --menu')
  console.log('  node . --check-env')
  console.log('')
  console.log(chalk.cyan('Options:'))
  console.log('  --help, -h           Show this help')
  console.log('  --version, -v        Print version')
  console.log('  --wizard             Edit .env with menus')
  console.log('  --menu               Interactive menu (start/wizard/check)')
  console.log('  --check-env          Validate required env vars')
  console.log('  --no-banner          Disable startup banner')
  console.log('')
}

function printVersion() {
  const pkgPath = path.resolve(__dirname, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  console.log(pkg.version)
}

function checkEnv() {
  const { checkEnv } = require('./src/cli/checkEnv.js')
  const result = checkEnv()
  if (!result.ok) process.exitCode = 1
}

if (hasAny('--help', '-h')) {
  printHelp()
} else if (hasAny('--version', '-v')) {
  printVersion()
} else if (hasAny('--check-env')) {
  checkEnv()
} else if (hasAny('--menu', 'menu')) {
  require('./src/cli/menu.js')
} else if (hasAny('--wizard', 'wizard')) {
  require('./src/cli/wizard.js')
} else {
  require('./src/index.js')
}
