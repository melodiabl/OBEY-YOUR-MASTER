const { cardJob, cardResult } = require('./card-job')
let received = false
process.once('disconnect', () => process.exit(0))
process.on('message', async message => {
  if (received) return
  received = true
  const id = message?.id
  try {
    if (typeof id !== 'string' || !/^[0-9a-f]{24}$/.test(id)) throw Error('invalid_job')
    const payload = cardJob(message.kind, message.payload)
    let rendered
    if (message.kind === 'background') rendered = await require('./card-background')(payload.backgroundBuffer)
    else {
      const renderer = require('./card-renderer')
      rendered = await (message.kind === 'welcome' ? renderer.renderWelcomeCard : renderer.renderLeaveCard)(payload)
    }
    const buffer = cardResult(rendered)
    process.send({ id, buffer }, () => process.exit(0))
  } catch {
    if (process.connected) process.send({ id, error: 'card_worker_failed' }, () => process.exit(1))
    else process.exit(1)
  }
})
