const { z } = require('zod')
const { openFormSetup } = require('./setup-form')
const { label, ids, field, channel, template } = require('./setup-fields')
const obeyUi = require('./assets/system')
const { allEmojis } = require('../botconfig/emojiFunctions')
const definitions = {
  counter: { title: label('Canal de contar', 'Counting channel'), fields: {
    channel: channel('counter', 'no', 'Canal', 'Channel'),
    number: field('counternum', 'number', 0, z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), 'Número actual', 'Current number', { clear: 0, hint: label('Vaciar prepara el reinicio a cero. Guardar lo aplica; si alguien cuenta mientras editas, revisa el conflicto.', 'Clear prepares a reset to zero. Save applies it; if someone counts while editing, review the conflict.') }),
  } },
  autoembed: { title: label('Mensajes como embed', 'Messages as embeds'), fields: {
    channels: field('autoembed', 'channels', [], ids, 'Canales', 'Channels', { clear: [], channelTypes: [0, 5], send: true }),
  } },
  boost: { title: label('Agradecimiento de boosts por privado', 'Boost thanks by DM'), fields: {
    enabled: field('boost.enabled', 'boolean', false, z.boolean(), 'Activado', 'Enabled'),
    message: template('boost.message', '', 'Mensaje', 'Message'),
  }, validate(values) { if (values.enabled && !values.message?.trim()) throw new Error('setup_invalid') } },
  boostlog: { title: label('Registro de boosts', 'Boost log'), fields: {
    channel: channel('boost.log', false, 'Canal', 'Channel'),
    start: template('boost.startBoost', obeyUi.owned('<a:Server_Boosts:867777823468027924> {member} **nos ha impulsado!** <a:Light_Saber_Dancce:867721861462229013>'), 'Primer boost', 'First boost'),
    again: template('boost.againBoost', obeyUi.owned('<a:Server_Boosts:867777823468027924> {member} **nos ha impulsado de nuevo!** <:Tada_WON:867724032207224833>'), 'Otro boost', 'Another boost'),
    stop: template('boost.stopBoost', obeyUi.owned('<a:Server_Boosts:867777823468027924> {member} **dejó de impulsarnos..** <:Cat_Sad:867722685949804565>'), 'Fin de boost', 'Boost ended'),
  } },
}
const suggestionDefaults = {
  approvemsg: `${allEmojis.msg.SUCCESS} Accepted Idea! Expect this soon.`,
  denymsg: `${allEmojis.msg.ERROR} Thank you for the feedback, but we are not interested in this idea at this time.`,
  maybemsg: `${obeyUi.markup('icon.idea')} We are thinking about this idea!`,
  statustext: `${allEmojis.msg.loading} Waiting for Community Feedback, please vote!`,
  soonmsg: `${obeyUi.markup('icon.success')} Expect this Feature Soon!`,
  footertext: 'Want to suggest / Feedback something? Simply type in this channel!',
}
const emoji = z.string().trim().min(1).max(100).refine(value => /^\d{17,20}$/.test(value) || /^<a?:\w+:\d{17,20}>$/.test(value) || ([...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)].length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(value)))
definitions.suggestion = { title: label('Sugerencias y votaciones', 'Suggestions and votes'), fields: {
  channel: channel('suggest.channel', '', 'Canal', 'Channel'),
  ...Object.fromEntries(Object.entries({ approvemsg: ['Texto al aprobar', 'Approval text'], denymsg: ['Texto al rechazar', 'Rejection text'], maybemsg: ['Texto en revisión', 'Review text'], statustext: ['Estado inicial', 'Initial status'], soonmsg: ['Texto próximamente', 'Coming soon text'], footertext: ['Pie del mensaje', 'Message footer'] }).map(([id, titles]) => [id, template(`suggest.${id}`, suggestionDefaults[id], ...titles)])),
  approveemoji: field('suggest.approveemoji', 'text', allEmojis.msg.SUCCESS, emoji, 'Emoji a favor', 'Upvote emoji', { maxInput: 100 }),
  denyemoji: field('suggest.denyemoji', 'text', allEmojis.msg.ERROR, emoji, 'Emoji en contra', 'Downvote emoji', { maxInput: 100 }),
} }
function openCommunitySetup(client, message, id) {
  if (!Object.hasOwn(definitions, id)) throw new Error('invalid_setup_definition')
  return openFormSetup(client, message, definitions[id])
}
module.exports = { openCommunitySetup, definitions }
