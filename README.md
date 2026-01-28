<div align="center">

# 🤖 OBEY YOUR MASTER
### Bot de Discord de Alto Rendimiento · Escala Masiva · 2026 Edition

<p>
  <a href="https://github.com/melodiabl/OBEY-YOUR-MASTER">
    <img alt="Estado" src="https://img.shields.io/badge/Estado-Desarrollo_Activo-success?style=for-the-badge" />
  </a>
  <a href="https://discord.js.org/">
    <img alt="discord.js" src="https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white" />
  </a>
  <a href="https://nodejs.org/">
    <img alt="Node.js" src="https://img.shields.io/badge/node.js-%E2%89%A516.11-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  </a>
  <a href="https://www.mongodb.com/">
    <img alt="MongoDB" src="https://img.shields.io/badge/database-mongodb-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  </a>
  <a href="https://www.skyultraplus.com/">
    <img alt="Hosting" src="https://img.shields.io/badge/hosting-skyultraplus-8A2BE2?style=for-the-badge" />
  </a>
<<a href="https://dash.swallox.com/">
    <img alt="Hosting" src="https://img.shields.io/badge/hosting-swallox-8AB2E2?style=for-the-badge" />
</a>
>
  <a href="#sobre-el-proyecto">Sobre</a> •
  <a href="#ecosistema-de-sistemas">Sistemas</a> •
  <a href="#estructura-de-comandos">Comandos</a> •
  <a href="#instalación-rápida">Instalación</a> •
  <a href="#configuración-env">.env</a> •
  <a href="#hosting-recomendado">Hosting</a>
</p>

</div>

---

## 📌 Sobre el proyecto
**OBEY YOUR MASTER** centraliza administración, automatización y entretenimiento en una sola base sólida.  
Diseñado para servidores que requieren estabilidad, escalabilidad y expansión constante sin fragmentar funciones.

> [!NOTE]
> Este repositorio está pensado para crecer: los sistemas se conectan entre sí (economía ↔ niveles ↔ quests ↔ moderación ↔ seguridad ↔ tickets ↔ logs).

---

## 🎯 Alcance y objetivos
- Arquitectura modular (sistemas activables por servidor).
- Persistencia real (MongoDB) + auditoría.
- Respuestas visuales consistentes (embeds + UI kit).
- Preparado para cientos de comandos y comunidades grandes.

---

## 🧩 Ecosistema de sistemas

| 🛡️ Seguridad y Control | 💰 Economía y RPG | 🎵 Media y Social |
|---|---|---|
| Moderación avanzada (warns progresivos, mute, historial, apelaciones) | Economía sincronizada (wallet/banco/tx) | Música (Lavalink/Shoukaku) |
| Anti-raid / anti-nuke / alt detection | Inventario + tienda | IA conversacional (canal IA) |
| AutoMod configurable (invites/mentions/badwords) | Niveles/XP + recompensas | Encuestas / utilidades |
| Logs + auditoría | Misiones (diarias/semanales/mensuales) | Eventos/recordatorios (en expansión) |
| Tickets y soporte | Rankings (en expansión) | Social (clanes, perfiles) |

> La lista de sistemas se encuentra en expansión constante.

---

## ⚡ Estructura de comandos
El bot utiliza una jerarquía clara de **Slash Commands** con subcomandos para mantener una organización limpia.

> [!TIP]
> **Sincronización:** la actividad del usuario impacta en múltiples sistemas.  
> Ejemplo: mensajes generan progreso de misiones, niveles otorgan recompensas, la seguridad registra incidentes y la moderación queda auditada.

### 🧭 Ejemplos (no limitantes)
```bash
# Música
/music play
/music queue
/music playlist

# Seguridad
/security status
/security raid enable
/security automod config

# Voice tools
/voice temp setup
/voice lock
/voice move

# Economía
/economy balance
/economy deposit
/economy transfer

# Moderación
/warn
/warn-policy list
/mod-history
/appeal create
/mute setup
```

> [!IMPORTANT]
> Discord limita el registro a **100 comandos globales + 100 por servidor**.  
> Este bot publica automáticamente overflow como **guild commands** (si aplica).

---

## ⚙️ Requisitos
- **Node.js:** mínimo `16.11` (recomendado `18+` LTS).
- **MongoDB:** local o Atlas.
- **Intents:** habilitar `Message Content`, `Guild Members` (y los demás necesarios según tu servidor).

<details>
<summary><b>Extras recomendados (opcional)</b></summary>

- **Música:** Lavalink (incluido `Lavalink.jar`) + Java instalado. Config en `application.yml`.
- **IA:** define `OPENAI_API_KEY` si usas canal IA / respuestas automáticas.

</details>

---

## 🔧 Configuración (.env)
Archivo `.env` en la raíz del proyecto:

```env
BOT_TOKEN="TU_TOKEN"
MONGO_URL="TU_URL_DE_MONGODB"

PREFIX="!"
STATUS="OBEY YOUR MASTER | /help"
OWNER_IDS="TU_ID_DISCORD"
```

<details>
<summary><b>Variables opcionales</b></summary>

```env
OPENAI_API_KEY="TU_API_KEY"
CREATOR_IDS="ID1 ID2"

# Modo comandos legacy por prefijo: compat | hint | disabled
LEGACY_PREFIX_MODE="compat"
```

</details>

> [!WARNING]
> Nunca compartas tu `.env`.

### Wizard (terminal)
Para editar/crear tu `.env` con menús en la terminal:
```bash
npm run wizard
```

También puedes abrirlo desde el entrypoint:
```bash
node . --wizard
```

### CLI (index principal)
```bash
node . --help
node . --menu
node . --check-env
```

---

## 🚀 Instalación rápida
```bash
git clone https://github.com/melodiabl/OBEY-YOUR-MASTER.git
cd OBEY-YOUR-MASTER
npm install
npm start
```

---

## ☁️ Hosting recomendado
Para estabilidad 24/7 y buen rendimiento:
- SkyUltraPlus — Hosting de alto rendimiento: https://www.skyultraplus.com/
- Soporte: https://discord.gg/QJeavgKU
- Swallox — Hosting de alto rendimiento: https://dash.swallox.com/

---

<div align="center">

### 📢 Canales oficiales
📦 Repositorio: https://github.com/melodiabl/OBEY-YOUR-MASTER  
📲 WhatsApp: https://whatsapp.com/channel/0029VbBZ4YX20

<sub>© 2026 OBEY YOUR MASTER · Desarrollado por melodia · Impulsado por SkyUltraPlus y Swallox</sub>

</div>
