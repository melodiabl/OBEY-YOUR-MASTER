const OpenAI = require('openai')
const TTLCache = require('../../core/cache/ttlCache')

const clientCache = new TTLCache({ defaultTtlMs: 5 * 60_000, maxSize: 5 })

function getOpenAiClient () {
  const key = String(process.env.OPENAI_API_KEY || '').trim()
  if (!key) {
    const err = new Error('Falta OPENAI_API_KEY en el entorno.')
    err.code = 'missing_openai_key'
    throw err
  }

  const cached = clientCache.get('openai')
  if (cached) return cached

  const client = new OpenAI({ apiKey: key })
  clientCache.set('openai', client)
  return client
}

function pickModel () {
  const env = String(process.env.OPENAI_MODEL || '').trim()
  return env || 'gpt-4o-mini'
}

function clampText (text, max) {
  const s = String(text || '')
  if (s.length <= max) return s
  return s.slice(0, Math.max(0, max - 1)) + '…'
}

async function ask ({ prompt, guildName, userTag, userId } = {}) {
  const p = String(prompt || '').trim()
  if (!p) throw new Error('Prompt vacío.')
  if (p.length > 1200) throw new Error('Prompt demasiado largo (máx 1200 chars).')

  const openai = getOpenAiClient()
  const model = pickModel()

  const system = [
    'Eres un asistente dentro de un bot de Discord para una comunidad grande.',
    'Responde en español neutro, con tono claro, cálido y directo.',
    'Usa Markdown nativo de Discord (negrita, cursiva, monoespaciado, citas).',
    'Sé útil y práctico; no reveles información sensible ni inventes datos.',
    'Si faltan datos, pregunta lo mínimo necesario.'
  ].join('\n')

  const userMeta = `Guild=${guildName || 'N/A'} User=${userTag || 'N/A'} (${userId || 'N/A'})`

  const res = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `${userMeta}\n\n${p}` }
    ],
    temperature: 0.7
  })

  const out = res?.choices?.[0]?.message?.content || ''
  return {
    ok: true,
    model,
    prompt: clampText(p, 1200),
    answer: clampText(out, 3500)
  }
}

module.exports = {
  ask
}
