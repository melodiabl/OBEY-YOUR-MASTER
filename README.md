<div align="center">

# 🤖 OBEY YOUR MASTER
### Bot de Discord Multipropósito · Discord.js v14 · Shoukaku 4 · MongoDB · 2026 Edition

<p>
  <img alt="Estado" src="https://img.shields.io/badge/Estado-Activo-success?style=for-the-badge" />
  <img alt="discord.js" src="https://img.shields.io/badge/discord.js-v14.26-5865F2?style=for-the-badge&logo=discord&logoColor=white" />
  <img alt="Node.js" src="https://img.shields.io/badge/node.js-v22-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img alt="Lavalink" src="https://img.shields.io/badge/música-Lavalink_v4-FF6B35?style=for-the-badge" />
  <img alt="Docker" src="https://img.shields.io/badge/docker-✓-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<p>
  <a href="#-sobre-el-proyecto">Sobre</a> •
  <a href="#-sistemas">Sistemas</a> •
  <a href="#-comandos">Comandos</a> •
  <a href="#-instalación">Instalación</a> •
  <a href="#-configuración-env">Variables .env</a> •
  <a href="#-dashboard">Dashboard</a>
</p>

---

### 💜 Patrocinado por

<table>
  <tr>
    <td align="center" width="50%">
      <a href="https://www.swallox.com/">
        <img src="https://img.shields.io/badge/🖥️_Swallox-Hosting_Patrocinador-8AB2E2?style=for-the-badge" alt="Swallox" /><br/>
        <b>Swallox</b><br/>
        <sub>Hosting de alto rendimiento para bots Discord</sub>
      </a>
    </td>
    <td align="center" width="50%">
      <a href="https://www.skyultraplus.com/">
        <img src="https://img.shields.io/badge/☁️_SkyUltraPlus-Hosting_Patrocinador-8A2BE2?style=for-the-badge" alt="SkyUltraPlus" /><br/>
        <b>SkyUltraPlus</b><br/>
        <sub>VPS y hosting premium para proyectos de escala</sub>
      </a>
    </td>
  </tr>
</table>

> ¿Quieres hostear este bot? Ambos proveedores ofrecen planes optimizados para Node.js y Discord bots.

</div>

---

## 📌 Sobre el proyecto

**OBEY YOUR MASTER** es un bot de Discord multipropósito con más de **625 comandos**, construido sobre la arquitectura moderna de discord.js v14 con Shoukaku 4 como motor de música, MongoDB como base de datos persistente y soporte completo en **español**.

> **625 comandos de texto** · **10 grupos de slash commands** · **Docker containerizado** · **Idioma español por defecto**

El bot centraliza en un solo lugar administración, música, sorteos, tickets, economía, niveles, auto-moderación, logs y un dashboard web completo.

---

## 🧩 Sistemas

| Sistema | Descripción |
|---------|-------------|
| 🎵 **Música** | Shoukaku 4 + Lavalink v4, cola, loop, filtros, volumen, shuffle, autoplay |
| 🛡️ **Moderación** | Ban, kick, mute, timeout, warns con historial persistente, casos por usuario |
| 🎉 **Sorteos** | Powered by `discord-giveaways` + MongoDB, start/end/pause/resume/reroll/list |
| 🎫 **Tickets** | Sistema multicategoría, transcript, claim, close, añadir/remover usuarios |
| 📨 **Invitaciones** | Tracking en MongoDB, leaderboard, fake invites, invitaciones manuales |
| 🚫 **Auto-Mod** | Anti-spam, anti-links, anti-caps, anti-nuke, anti-raid, ghost ping detector |
| 📈 **Niveles/XP** | XP por mensajes y voz, cards canvas de level-up, recompensas por rol |
| 💸 **Economía** | Wallet, banco, daily, work, shop, inventario completo |
| 📋 **Logs** | Logs de moderación, social (YouTube/Twitch), mensajes eliminados/editados |
| 🎭 **Fun/NSFW** | +200 comandos de entretenimiento, minijuegos, memes, anime |
| ⚙️ **Setup** | Sistema de configuración completo por servidor con 50+ opciones |
| 🌐 **Dashboard** | Panel web Express + EJS + OAuth2 Discord para configurar el bot |

---

## ⚡ Comandos

### 🎵 Música — `/music`

| Subcomando | Descripción |
|-----------|-------------|
| `play <canción>` | Reproducir canción o URL (YouTube, Spotify, SoundCloud) |
| `queue` | Ver la cola actual |
| `nowplaying` | Ver la canción actual con controles |
| `skip` | Saltar canción actual |
| `stop` | Detener música y salir del canal |
| `pause` / `resume` | Pausar o reanudar |
| `volume <1-100>` | Ajustar volumen |
| `loop` | Cambiar modo loop (sin loop / canción / cola) |
| `shuffle` | Mezclar la cola aleatoriamente |
| `seek <tiempo>` | Saltar a un momento específico (ej: `1:30`) |
| `forward` / `rewind` | Avanzar o retroceder unos segundos |
| `clearqueue` | Limpiar toda la cola |
| `autoplay` | Activar/desactivar reproducción automática |
| `join` / `leave` | Conectar/desconectar del canal de voz |

También disponibles como comandos de texto: `!play`, `!skip`, `!stop`, `!pause`, `!resume`, `!queue`, `!volume`, `!loop`, `!shuffle`, `!nowplaying`, `!join`, `!leave`, `!seek`, `!forward`, `!rewind`, `!clearqueue`, `!playtop`, `!playskip`, etc.

---

### 🎉 Sorteos — `/giveaway`

| Subcomando | Parámetros | Descripción |
|-----------|-----------|-------------|
| `start` | `#canal` `duración` `premio` `ganadores` `[rol]` | Iniciar sorteo (ej: `1d`, `12h`, `30m`) |
| `end` | `message_id` | Finalizar sorteo activo antes de tiempo |
| `pause` | `message_id` | Pausar un sorteo activo |
| `resume` | `message_id` | Reanudar un sorteo pausado |
| `reroll` | `message_id` `[ganadores]` | Elegir nuevo(s) ganador(es) |
| `list` | — | Ver todos los sorteos activos del servidor |

---

### 🛡️ Moderación Avanzada — `/moderation`

| Subcomando | Parámetros | Descripción |
|-----------|-----------|-------------|
| `purge` | `cantidad` `[filtro]` | Eliminar mensajes (filtros: all/bots/links/attachments) |
| `vmute` | `@usuario` `[razón]` | Silenciar/dessilenciar en canal de voz |
| `vkick` | `@usuario` `[razón]` | Desconectar del canal de voz |
| `vdeafen` | `@usuario` `[razón]` | Ensordecer/desensordecer en voz |
| `cases` | `@usuario` `[página]` | Ver historial de moderación paginado |
| `slowmode` | `segundos` `[#canal]` | Activar modo lento (0 para desactivar) |

Comandos de texto adicionales: `!ban`, `!unban`, `!kick`, `!mute`, `!unmute`, `!warn`, `!warns`, `!delwarn`, `!timeout`, `!untimeout`, `!clear`, `!lock`, `!unlock`, `!nuke`, `!dm`, `!addrole`, `!removerole`, etc.

---

### 📨 Invitaciones — `/invites`

| Subcomando | Parámetros | Descripción |
|-----------|-----------|-------------|
| `show` | `[@usuario]` | Ver invitaciones: efectivas, totales, falsas, salidas |
| `leaderboard` | — | Top 10 invitadores del servidor |
| `reset` | `@usuario` | Resetear invitaciones a 0 (requiere Gestionar Servidor) |
| `add` | `@usuario` `cantidad` | Añadir invitaciones manualmente (requiere Gestionar Servidor) |

---

### 🎫 Tickets — `/ticket`

| Subcomando | Descripción |
|-----------|-------------|
| `close` | Cerrar y archivar el ticket actual |
| `add <@usuario>` | Añadir un usuario al canal del ticket |
| `remove <@usuario>` | Remover un usuario del ticket |
| `claim` | Reclamar el ticket como moderador responsable |

Para crear el panel de tickets: `!setup-ticket #canal` o `!setup-menuticket #canal`

---

### ℹ️ Info — `/info`

| Subcomando | Descripción |
|-----------|-------------|
| `serverinfo` | Información completa del servidor |
| `userinfo [@usuario]` | Información de un usuario |
| `botinfo` | Estadísticas del bot (versiones, uptime, memoria) |
| `avatar [@usuario]` | Avatar de usuario |
| `ping` | Latencia del bot y API de Discord |
| `uptime` | Tiempo que lleva el bot en línea |
| `invites [@usuario]` | Invitaciones de un usuario |
| `roleinfo @rol` | Información de un rol |
| `permissions [@usuario]` | Permisos de un usuario |

---

### ⚙️ Admin — `/admin`

| Subcomando | Descripción |
|-----------|-------------|
| `embed <título> <descripción>` | Enviar embed personalizado en un canal |
| `say <mensaje>` | Enviar mensaje como el bot |

---

## 🔧 Instalación

### Requisitos previos

- **Node.js** v18+ (recomendado v22)
- **MongoDB** local o [Atlas](https://mongodb.com/atlas) (gratuito)
- **Lavalink v4** para la función de música
- **Docker** (recomendado) o ejecución directa con Node.js

---

### Opción 1: Docker (Recomendado)

<details>
<summary>📦 Click para expandir</summary>

```bash
# 1. Clonar el repositorio
git clone https://github.com/melodiabl/OBEY-YOUR-MASTER.git
cd OBEY-YOUR-MASTER

# 2. Configurar variables de entorno
cp .env.example .env
nano .env   # Edita con tus datos

# 3. Iniciar con Docker Compose
docker compose up -d --build

# 4. Ver logs en tiempo real
docker logs obey_bot -f

# 5. Reiniciar el bot
docker compose restart

# 6. Detener el bot
docker compose down
```

</details>

---

### Opción 2: Node.js directo

<details>
<summary>🟢 Click para expandir</summary>

```bash
# 1. Clonar el repositorio
git clone https://github.com/melodiabl/OBEY-YOUR-MASTER.git
cd OBEY-YOUR-MASTER

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
nano .env   # Edita con tus datos

# 4. Iniciar el bot
node index.js

# Para producción con PM2 (auto-reinicio)
npm install -g pm2
pm2 start index.js --name obey-bot
pm2 save && pm2 startup
```

</details>

---

### Configurar Lavalink (música)

<details>
<summary>🎵 Click para expandir</summary>

1. Descargar [Lavalink.jar](https://github.com/lavalink-devs/Lavalink/releases/latest)

2. Crear `application.yml` en la misma carpeta:

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  server:
    password: "tu_password_aqui"
    sources:
      youtube: true
      soundcloud: true
      bandcamp: true
      twitch: true
      vimeo: true
      http: true
      local: false

logging:
  level:
    root: INFO
    lavalink: INFO
```

3. Ejecutar Lavalink:
```bash
java -jar Lavalink.jar
```

4. Configurar en `.env`:
```env
LAVALINK_HOST=127.0.0.1
LAVALINK_PORT=2333
LAVALINK_PASSWORD=tu_password_aqui
```

> **YouTube:** Para evitar bloqueos, configura `YOUTUBE_PO_TOKEN` en el `.env`. Obtenerlo siguiendo la guía de [yt-dlp](https://github.com/yt-dlp/yt-dlp/wiki/PO-Token-Guide).

</details>

---

## 🔐 Configuración .env

Crea un archivo `.env` en la raíz del proyecto con estas variables:

```env
# ─── Bot ─────────────────────────────────────────────────────────
# Token del bot (Discord Developer Portal → Bot → Token)
BOT_TOKEN=tu_token_de_discord_aqui

# ─── Base de datos ───────────────────────────────────────────────
# MongoDB local:
MONGO_URL=mongodb://localhost:27017/obey-bot
# MongoDB Atlas (cloud gratuito):
# MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/obey-bot

# ─── Lavalink (música) ───────────────────────────────────────────
LAVALINK_HOST=127.0.0.1
LAVALINK_PORT=2333
LAVALINK_PASSWORD=tu_password_lavalink
LAVALINK_SECURE=false

# YouTube PO Token (evita bloqueos de YT)
YOUTUBE_PO_TOKEN=

# ─── Dashboard web (opcional) ────────────────────────────────────
# Obtener en: Discord Developer Portal → OAuth2
DISCORD_CLIENT_ID=tu_application_id
DISCORD_CLIENT_SECRET=tu_client_secret
SESSION_SECRET=string_aleatorio_largo_y_seguro
DASHBOARD_BASE_URL=http://localhost:3000
DASHBOARD_PORT=3000

# ─── Notificaciones sociales (opcionales) ────────────────────────
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=

# ─── Spotify (búsqueda por nombre, opcional) ─────────────────────
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

---

## 🌐 Dashboard

El dashboard web permite configurar el bot desde el navegador con autenticación Discord OAuth2.

**Activar el dashboard:**

1. Añade al `.env`: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `SESSION_SECRET`, `DASHBOARD_BASE_URL`

2. En el [Portal de Discord](https://discord.com/developers/applications):
   - Ir a tu aplicación → **OAuth2** → **Redirects**
   - Añadir: `http://tu-dominio.com:3000/auth/callback`

3. Reiniciar el bot

4. Acceder a `http://tu-dominio.com:3000`

**¿Qué puedes configurar desde el dashboard?**
- 🔧 Prefijo del bot por servidor
- 👋 Canal y mensaje de bienvenida/despedida
- 📋 Canal de logs de moderación
- 🚫 Activar/desactivar anti-spam, anti-links, anti-caps

---

## 🎛️ Setup de sistemas (comandos `!setup-*`)

| Comando | Sistema que configura |
|---------|-----------------------|
| `!setup-ticket #canal` | Sistema de tickets con botón |
| `!setup-menuticket #canal` | Tickets con menú de categorías |
| `!setup-welcome #canal` | Canal y mensaje de bienvenida |
| `!setup-leave #canal` | Canal de despedida |
| `!setup-rank` | Sistema de niveles y XP |
| `!setup-logger #canal` | Canal de logs generales |
| `!setup-antispam` | Configurar anti-spam |
| `!setup-antilink` | Configurar anti-enlaces |
| `!setup-antinuke` | Sistema anti-nuke |
| `!setup-anticaps` | Configurar anti-mayúsculas |
| `!setup-suggestion #canal` | Canal de sugerencias |
| `!setup-membercount` | Canales contadores (miembros, bots) |
| `!setup-mute` | Configurar sistema de mute (rol o timeout) |
| `!setup-boostlog #canal` | Canal de logs de boosts |
| `!setup-twitch <canal>` | Notificaciones de Twitch en vivo |
| `!setup-youtube <canal>` | Notificaciones de nuevos videos |
| `!setup-admin @rol` | Roles de administrador del bot |
| `!setup-keyword` | Respuestas automáticas por palabra clave |
| `!setup-counter #canal` | Canal contador automático |

---

## 📂 Estructura del proyecto

```
OBEY-YOUR-MASTER/
├── index.js                    # Entrada principal, Shoukaku, MongoDB, handlers
├── docker-compose.yml          # Contenedor Docker
├── Dockerfile
├── .env                        # Variables de entorno (NO subir al repo)
│
├── botconfig/
│   ├── config.json             # Prefijo, Lavalink nodes, ownerIDS
│   ├── embed.json              # Colores de embeds
│   └── emojis.json             # Emojis personalizados del servidor
│
├── handlers/                   # Sistemas del bot (cargados al iniciar)
│   ├── loaddb.js               # SyncMap + EnmapLike: wrapper sincrónico MongoDB
│   ├── musichandler.js         # Motor de música Shoukaku 4
│   ├── giveaway.js             # discord-giveaways con persistencia MongoDB
│   ├── invitetracking.js       # Cache de invitaciones, tracking joins/leaves
│   ├── enmap-like.js           # Store en memoria con API compatible Enmap
│   ├── ranking.js              # Sistema XP/niveles
│   ├── ticket.js               # Handler de botones de tickets
│   ├── welcome.js              # Mensajes de bienvenida
│   └── ... (+25 handlers más)
│
├── database/schemas/           # Modelos Mongoose
│   ├── GuildSchema.js          # Configuración de servidores
│   ├── UserSchema.js           # Usuarios: XP, economía, invitaciones
│   ├── ModerationSchema.js     # Historial de casos de moderación
│   ├── TicketSchema.js         # Tickets activos
│   ├── GiveawaySchema.js       # Sorteos (discord-giveaways)
│   ├── KeywordSchema.js        # Comandos personalizados
│   ├── PremiumSchema.js        # Estado premium por servidor
│   └── CustomCommandSchema.js  # Comandos custom
│
├── commands/                   # Comandos de texto (~600 comandos)
│   ├── 🎶 Music/               # !play, !skip, !stop, !queue...
│   ├── 🚫 Administration/      # !ban, !kick, !mute, !warn, !clear...
│   ├── 💸 Economy/             # !balance, !daily, !work, !shop...
│   ├── 📈 Ranking/             # !rank, !leaderboard, !xp...
│   ├── 🎮 MiniGames/           # !tictactoe, !hangman, !quiz...
│   ├── 🕹️ Fun/                 # !meme, !8ball, !coinflip...
│   ├── 🔰 Info/                # !serverinfo, !userinfo, !avatar...
│   ├── 👑 Owner/               # !eval, !deployslash, !restart...
│   ├── 💪 Setup/               # !setup-ticket, !setup-welcome...
│   └── ... (más categorías)
│
├── slashCommands/              # Slash commands (auto-desplegados al iniciar)
│   ├── Admin/                  → /admin embed, /admin say
│   ├── Music/                  → /music play, /music queue...
│   ├── Info/                   → /info serverinfo, /info userinfo...
│   ├── Fun/                    → /fun meme, /fun 8ball...
│   ├── Giveaway/               → /giveaway start, /giveaway end...
│   ├── Moderation/             → /moderation purge, /moderation cases...
│   ├── Invites/                → /invites show, /invites leaderboard...
│   └── Ticket/                 → /ticket close, /ticket add...
│
├── events/                     # Eventos de Discord
│   ├── guild/
│   │   ├── interactionCreate.js
│   │   ├── messageCreate.js
│   │   ├── guildMemberAdd.js
│   │   └── ...
│   └── client/
│       └── ready.js            # Auto-deploy slash commands al iniciar
│
├── languages/
│   ├── es.json                 # Español (idioma por defecto)
│   ├── en.json                 # English
│   └── de.json                 # Deutsch
│
└── dashboard/                  # Panel web (requiere DISCORD_CLIENT_SECRET)
    ├── index.js                # Express + session + OAuth2
    ├── views/
    │   ├── includes/           # header.ejs, footer.ejs
    │   └── pages/              # home.ejs, dashboard.ejs, guild.ejs
    └── public/
        ├── css/style.css
        └── js/main.js
```

---

## 🔒 Permisos necesarios

Al invitar el bot usa el scope `bot applications.commands` con estos permisos:

```
✅ Administrador (recomendado)
— o permisos individuales: —
✅ Gestionar servidor        ✅ Gestionar canales
✅ Gestionar roles           ✅ Gestionar mensajes
✅ Banear miembros           ✅ Expulsar miembros
✅ Silenciar miembros        ✅ Mover miembros  
✅ Ensordecer miembros       ✅ Conectar (voz)
✅ Hablar (voz)              ✅ Ver canales
✅ Enviar mensajes           ✅ Leer historial
✅ Insertar links            ✅ Adjuntar archivos
✅ Añadir reacciones         ✅ Usar emojis externos
✅ Mencionar @everyone       ✅ Gestionar webhooks
```

---

## ❓ FAQ

<details>
<summary><b>Los slash commands no aparecen en mi servidor</b></summary>

Los slash commands se despliegan globalmente al iniciar (puede tardar hasta 1 hora en Discord).  
Para despliegue **inmediato** en un servidor específico, el dueño del bot ejecuta:
```
!deployslash 1234567890  ← ID del servidor
```

</details>

<details>
<summary><b>Cómo cambiar el idioma del servidor</b></summary>

```
!setlanguage es   ← Español (por defecto)
!setlanguage en   ← English
!setlanguage de   ← Deutsch
```

</details>

<details>
<summary><b>La música no reproduce nada</b></summary>

1. Verifica que Lavalink esté corriendo: `java -jar Lavalink.jar`
2. Revisa las variables en `.env`: `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD`
3. Para YouTube, configura `YOUTUBE_PO_TOKEN`
4. Revisa logs: `docker logs obey_bot | grep -E "Lavalink|Music|Error"`

</details>

<details>
<summary><b>Cómo cambiar el prefijo</b></summary>

```
!setprefix .        ← Cambia el prefijo a "."
!setprefix !        ← Vuelve al prefijo por defecto
```
O desde el Dashboard web.

</details>

<details>
<summary><b>Cómo configurarme como Owner del bot</b></summary>

Edita `botconfig/config.json`:
```json
{
  "ownerIDS": ["TU_ID_DISCORD"],
  "ownerid": "TU_ID_DISCORD"
}
```
Reinicia el bot para aplicar los cambios.

</details>

<details>
<summary><b>Cómo actualizar el bot</b></summary>

```bash
git pull origin master
docker compose up -d --build   # Si usas Docker
# o
npm install && pm2 restart obey-bot  # Si usas PM2
```

</details>

---

## 🛠️ Stack tecnológico

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| [Discord.js](https://discord.js.org/) | v14.26 | Framework base |
| [Shoukaku](https://github.com/shipgirlproject/Shoukaku) | v4.3 | Cliente Lavalink para música |
| [Lavalink](https://github.com/lavalink-devs/Lavalink) | v4 | Servidor de audio |
| [Mongoose](https://mongoosejs.com/) | v8 | ODM MongoDB |
| [MongoDB](https://www.mongodb.com/) | v7+ | Base de datos principal |
| [discord-giveaways](https://github.com/Androz2091/discord-giveaways) | v6 | Sistema de sorteos |
| [Express](https://expressjs.com/) | v4 | Servidor web del dashboard |
| [EJS](https://ejs.co/) | v3 | Templates del dashboard |
| [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas) | latest | Cards canvas (level-up, welcome) |
| [Node.js](https://nodejs.org/) | v22 | Runtime JavaScript |
| [Docker](https://docker.com/) | latest | Containerización |

---

## 🖥️ Hosting recomendado

Este proyecto está patrocinado y recomendado por:

<table>
  <tr>
    <td align="center">
      <a href="https://www.swallox.com/">
        <b>💜 Swallox</b>
      </a><br/>
      Hosting optimizado para bots Discord y Node.js.<br/>
      Planes desde servidores VPS hasta hosting administrado.<br/>
      <a href="https://www.swallox.com/">👉 www.swallox.com</a>
    </td>
    <td align="center">
      <a href="https://www.skyultraplus.com/">
        <b>☁️ SkyUltraPlus</b>
      </a><br/>
      VPS premium de alto rendimiento para proyectos de escala.<br/>
      Infraestructura confiable con soporte 24/7.<br/>
      <a href="https://www.skyultraplus.com/">👉 www.skyultraplus.com</a>
    </td>
  </tr>
</table>

---

<div align="center">

### 📢 Canales oficiales
📦 Repositorio: https://github.com/melodiabl/OBEY-YOUR-MASTER  
📲 WhatsApp: https://whatsapp.com/channel/0029VbBZ4YX20  
💬 Discord (soporte): https://discord.gg/QJeavgKU

<sub>© 2026 OBEY YOUR MASTER · Desarrollado por melodia · Impulsado por SkyUltraPlus y Swallox</sub>

</div>
