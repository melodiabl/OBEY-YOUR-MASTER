const Neko = require('nekos.life')
class NekoProvider extends Neko {
  constructor() {
    super()
    this.nsfw = new Proxy({}, { get: (_, name) => async () => {
      throw new Error(`El proveedor Nekos.life retiró sus endpoints NSFW (${String(name)}). Esta función no está disponible en ese servicio.`)
    } })
  }
}
module.exports = NekoProvider
