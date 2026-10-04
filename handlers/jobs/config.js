const fs = require('node:fs')
const path = require('node:path')
function loadJobsConfiguration(environment = process.env, file = path.resolve(__dirname, '../../.env.jobs')) {
  if (!fs.existsSync(file)) return
  const values = require('dotenv').parse(fs.readFileSync(file))
  // Explicit environment configuration wins; this file cannot inject bot tokens or Mongo settings.
  for (const key of ['OBEY_JOBS_ENABLED', 'OBEY_JOBS_REDIS_URL']) {
    if (environment[key] === undefined && values[key] !== undefined) environment[key] = values[key]
  }
}
module.exports = { loadJobsConfiguration }
