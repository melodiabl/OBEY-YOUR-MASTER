function pick (arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const EIGHTBALL = [
  'Sí.',
  'No.',
  'Probablemente.',
  'Definitivamente no.',
  'Pregunta de nuevo más tarde.',
  'No puedo confirmarlo.',
  'Los astros dicen que sí.',
  'Los astros dicen que no.',
  'Puede ser.',
  'Ni en pedo.'
]

const MAGIC_CONCH = [
  'No.',
  'Sí.',
  'Tal vez algún día.',
  'No lo creo.',
  'Inténtalo de nuevo.',
  'No tengo ganas de responder eso.',
  'Hazlo.',
  'Ni se te ocurra.'
]

const JOKES = [
  '¿Qué hace una abeja en el gimnasio? ¡Zum-ba!',
  '¿Qué le dice un techo a otro? Techo de menos.',
  '¿Qué hace una vaca con los ojos cerrados? Leche concentrada.',
  '¿Por qué el libro se suicidó? Porque tenía demasiados capítulos.'
]

const DAD_JOKES = [
  'Soy tan bueno durmiendo que puedo hacerlo con los ojos cerrados.',
  '¿Cómo se despiden los químicos? Ácido un placer.',
  '¿Qué hace una caja fuerte en el gimnasio? ¡Pone a salvo su forma!'
]

const PUNS = [
  'Estoy leyendo un libro sobre antigravedad. No puedo soltarlo.',
  'Me da igual lo que digas… soy impermeable a la crítica.'
]

const MEMES = [
  'https://i.imgur.com/2yaf2wb.jpeg',
  'https://i.imgur.com/8pQeYQp.jpeg',
  'https://i.imgur.com/4M7IWwP.jpeg'
]

const FACTS = [
  'Los pulpos tienen tres corazones.',
  'Las abejas pueden reconocer rostros humanos.',
  'El corazón de un camarón está en su cabeza.'
]

const QUOTES = [
  '“La disciplina es la diferencia entre lo que quieres ahora y lo que quieres más.”',
  '“Si puedes imaginarlo, puedes construirlo.”',
  '“Hecho > perfecto.”'
]

const SHOWER_THOUGHTS = [
  'Si el tomate es fruta, el ketchup es un smoothie.',
  'Cuando apagas la luz, ya no ves nada… pero la habitación sigue ahí.',
  '“Más tarde” es la palabra favorita de la procrastinación.'
]

const RIDDLES = [
  { q: '¿Qué cosa cuanto más le quitas más grande es?', a: 'Un agujero.' },
  { q: '¿Qué tiene manos pero no puede aplaudir?', a: 'Un reloj.' }
]

const WOULD_YOU_RATHER = [
  '¿Preferís tener pausa pero no retroceso, o retroceso pero no pausa?',
  '¿Preferís hablar todos los idiomas o tocar todos los instrumentos?'
]

const TRUTHS = [
  '¿Qué es algo que te da vergüenza admitir?',
  '¿Cuál fue tu peor compra impulsiva?'
]

const DARES = [
  'Cambia tu apodo por 10 minutos a “yo pago la pizza”.',
  'Escribe un cumplido genuino a alguien del chat.'
]

const CONFESSIONS = [
  'Confesión: una vez respondí “ok” y estaba llorando.',
  'Confesión: guardo memes para “cuando sea el momento correcto”.'
]

const FORTUNES = [
  'Hoy tu suerte sube cuando terminas lo que empezaste.',
  'Una oportunidad pequeña se vuelve grande si la tomas en serio.',
  'No todo es urgente. Respira.'
]

const TOPICS_NORMAL = [
  '¿Cuál es tu canción que nunca salteas?',
  '¿Qué superpoder elegirías si tuviera un coste?',
  '¿Qué app borrarías si solo pudieras quedarte con 3?'
]

const TOPICS_SPICY = [
  '¿Qué opinión tenés que siempre causa discusión?',
  '¿Qué “red flag” ignoraste alguna vez?',
  '¿Qué es algo que la gente finge que le gusta?'
]

const HOROSCOPE = Object.freeze({
  aries: 'Aries: energía alta, evitá decisiones impulsivas.',
  taurus: 'Tauro: constancia te da ventaja hoy.',
  gemini: 'Géminis: comunicá claro, te va a ahorrar problemas.',
  cancer: 'Cáncer: cuidá tu energía, no todo es para hoy.',
  leo: 'Leo: brillas cuando liderás con calma.',
  virgo: 'Virgo: orden y foco, una cosa a la vez.',
  libra: 'Libra: equilibrio; poné límites sin culpa.',
  scorpio: 'Escorpio: intuición fuerte; elegí bien tus batallas.',
  sagittarius: 'Sagitario: explorá, pero no pierdas el objetivo.',
  capricorn: 'Capricornio: disciplina; tu esfuerzo paga.',
  aquarius: 'Acuario: ideas nuevas; anotá todo.',
  pisces: 'Piscis: creatividad; bajá a tierra un plan.'
})

const ROASTS = [
  'Tu Wi‑Fi tiene más estabilidad que tus decisiones.',
  'Si la pereza fuera deporte, igual llegarías tarde.',
  'Eres como un bug: apareces cuando menos se te necesita.'
]

const COMPLIMENTS = [
  'Tu energía mejora el server.',
  'Tienes buen gusto (y no lo digo solo por estar aquí).',
  'Eres la definición de “mejor compañía”.'
]

module.exports = {
  pick,
  EIGHTBALL,
  MAGIC_CONCH,
  JOKES,
  DAD_JOKES,
  PUNS,
  MEMES,
  FACTS,
  QUOTES,
  SHOWER_THOUGHTS,
  RIDDLES,
  WOULD_YOU_RATHER,
  TRUTHS,
  DARES,
  CONFESSIONS,
  FORTUNES,
  TOPICS_NORMAL,
  TOPICS_SPICY,
  HOROSCOPE,
  ROASTS,
  COMPLIMENTS
}
