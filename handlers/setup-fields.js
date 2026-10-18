const { z } = require('zod')
const label = (es, en) => ({ es, en })
const snowflake = z.string().regex(/^\d{17,20}$/)
const ids = z.array(snowflake).max(1000)
const field = (path, type, fallback, schema, es, en, extra = {}) => ({ path, type, default: fallback, schema, label: label(es, en), ...extra })
const channel = (path, fallback, es, en, extra = {}) => field(path, 'channel', fallback, z.union([snowflake, z.literal(fallback)]), es, en, { clear: fallback, ...extra })
const template = (path, fallback, es, en, extra = {}) => field(path, 'text', fallback, z.string().max(2000), es, en, { allowEmpty: true, maxInput: 2000, ...extra })
module.exports = { label, snowflake, ids, field, channel, template }
