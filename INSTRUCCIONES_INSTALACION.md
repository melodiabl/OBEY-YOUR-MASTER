# 🛠️ Instrucciones de Instalación y Solución de Errores

Si estás viendo errores de `MODULE_NOT_FOUND` (como el de `@distube/ytdl-core`, `canvacord`, etc.), es porque necesitas instalar las nuevas dependencias en tu computadora.

## 🚀 Pasos para solucionar los errores:

1. **Abre una terminal** en la carpeta de tu bot (`C:\Users\kangu\OBEY-YOUR-MASTER`).
2. **Ejecuta el siguiente comando** para instalar todas las dependencias nuevas de una sola vez:

```bash
npm install @distube/ytdl-core ffmpeg-static canvacord canvas weather-js ms discord-giveaways @vitalets/google-translate-api openai
```

3. **Reinicia tu bot** ejecutando `node src/index.js` o el comando que uses habitualmente.

---

## 🆕 Nuevos Sistemas Implementados:

### 1. 🎉 Sistema de Sorteos
*   **Comando:** `/giveaway-start`
*   Permite crear sorteos con duración, número de ganadores y premio. El bot elegirá al ganador automáticamente al finalizar el tiempo.

### 2. 💡 Sistema de Sugerencias
*   **Configuración:** `/set-suggestions [canal]`
*   **Uso:** `/suggest [tu sugerencia]`
*   Envía sugerencias a un canal específico con botones de voto (✅/❌).

### 3. 📜 Sistema de Logs (Auditoría)
*   **Configuración:** `/set-logs [canal]`
*   El bot registrará automáticamente cuando se eliminen mensajes en el servidor.

### 4. 🎮 Comandos de Diversión
*   `/8ball [pregunta]`: Pregúntale a la bola mágica.
*   `/ship [usuario1] [usuario2]`: Mide la compatibilidad amorosa.

---

## 🎵 Nota sobre el Sistema de Música:
He actualizado el sistema para usar `@distube/ytdl-core` y `ffmpeg-static`. Esto soluciona el error `410 Gone` de YouTube y elimina la necesidad de instalar FFmpeg manualmente en tu Windows.
