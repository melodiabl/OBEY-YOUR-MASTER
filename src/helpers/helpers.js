const isEmptyObj = (_) =>
  Object.keys(_).length === 0 && _.constructor === Object
const isEmptyArray = (_) => Array.isArray(_) && _.length === 0
const binary2Text = (str, args = { zero: '😡', one: '🥺' }) => {
  const { zero, one } = args
  return str
    .replaceAll(zero, '0')
    .replaceAll(one, '1')
    .match(/.{1,8}/g)
    .map((i) => i)
    .map((i) => parseInt(i, 2))
    .map((i) => String.fromCharCode(i))
    .join('')
}
const text2Binary = (str, args = { zero: '😡', one: '🥺' }) => {
  const { zero, one } = args
  return [...str]
    .map((i) => i.charCodeAt().toString(2).padStart(8, '0'))
    .join('')
    .replaceAll('0', zero)
    .replaceAll('1', one)
}
const uniqueKey = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15)
const abbreviateNumber = (number) => {
  const abbreviations = ['k', 'M', 'B', 'T']

  // iterar a través de las abreviaturas
  for (let i = abbreviations.length - 1; i >= 0; i--) {
    // convertir el número a la abreviatura
    const abbreviation = abbreviations[i]
    const abbreviationValue = Math.pow(10, (i + 1) * 3)
    if (number >= abbreviationValue) {
      return `${(number / abbreviationValue).toFixed(1)}${abbreviation}`
    }
  }

  return number.toString()
}
const respuestas = [
  '✅ **Sí**, definitivamente.',
  '❌ **No**, ni lo pienses.',
  '🤔 **Posiblemente**, quién sabe...',
  '🚫 **Seguro que no**, olvida eso.',
  '✨ **Obviamente**, es un hecho.',
  '💎 **Es cierto**, créelo.',
  '🛡️ **Definitivamente**, puedes confiar.',
  '📈 **Lo más probable**, las señales apuntan allí.',
  '🤐 **No tengo una respuesta** para eso ahora mismo.',
  '🤷 **No podría confirmártelo**, es un misterio.',
  '📉 **No cuentes con ello**, lo veo difícil.',
  '🌫️ **Es muy dudoso**, todo está borroso.',
  '💫 **Creería que sí**, el destino dice eso.',
  '🛑 **Diría que no**, mejor detente.',
  '🌌 **Los astros aún no se alinean**, intenta luego.'
]
const randomAnswer = () =>
  respuestas[Math.floor(Math.random() * respuestas.length)]
module.exports = {
  isEmptyArray,
  isEmptyObj,
  binary2Text,
  text2Binary,
  uniqueKey,
  abbreviateNumber,
  randomAnswer
}
