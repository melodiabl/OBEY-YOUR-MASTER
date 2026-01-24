// Root entrypoint for hosting providers that expect `index.js` at repo root.
// Supports: `node . --wizard` (or `npm start -- --wizard`) to edit `.env`.

const args = new Set(process.argv.slice(2))

if (args.has('--wizard') || args.has('wizard')) {
  require('./src/cli/wizard.js')
} else {
  require('./src/index.js')
}
