Procesó durante 1m 3s

Sí. Esta parte es clave porque, si Codex tiene libertad visual sin reglas estrictas, puede construir una arquitectura correcta pero terminar otra vez con una web que se vea genérica, inconsistente o “hecha por IA”.

Además, hay una restricción que nos conviene tomar en serio: Discord permite usar sus assets bajo determinadas condiciones, pero sus propias normas de marca dicen que no se debe copiar o imitar el look and feel de Discord, incluidas combinaciones de colores, gráficos, tipografías o estilización que puedan resultar confundibles. 

[Inferencia] Por eso OBEY debe sentirse integrado con Discord, pero visualmente debe ser claramente OBEY.

OBEY Design System

[Inferencia] La dirección que mejor encaja con OBEY YOUR MASTER es un producto oscuro, tecnológico y premium, pero no “gamer RGB”.

[Inferencia] Evitaría fondos negros puros, violetas saturados por todas partes, glassmorphism excesivo, bordes luminosos en cada card y gradientes en todos los botones.

[Inferencia] La sensación debería ser más:

Control Center + SaaS premium + herramienta administrativa avanzada.

No:

panel de bot gamer de 2021.

Identidad visual propuesta

[Inferencia] Empezaría con este sistema cromático:

Token	Color	Uso

bg.canvas	#0B0D12	Fondo principal
bg.surface	#121722	Sidebar/cards
bg.elevated	#171E2B	Modales/popovers
bg.interactive	#1D2533	Hover/controles
border.default	#273143	Separadores
border.strong	#354158	Controles activos
text.primary	#F6F7FB	Texto principal
text.secondary	#A8B0C2	Secundario
text.muted	#727D91	Metadata
brand.primary	#8B5CF6	OBEY Violet
brand.secondary	#22D3EE	Signal Cyan
success	#34D399	OK
warning	#FBBF24	Atención
danger	#FB7185	Acción peligrosa


[Inferencia] No usaría el Blurple oficial de Discord #5865F2 como color principal de OBEY; ese es precisamente uno de los colores oficiales identificados por Discord. 

[Inferencia] #8B5CF6 tendría que utilizarse selectivamente: navegación activa, CTA principal, selección, progress y detalles de marca.

No:

purple card
purple button
purple border
purple icon
purple title
purple background

[Inferencia] El cyan sería principalmente un color de actividad/realtime, lo que crea además una semántica visual útil.

Por ejemplo:

Violet  = acción / marca
Cyan    = realtime / live
Green   = correcto
Yellow  = advertencia
Red     = riesgo/error


---

Tipografía

[Inferencia] Usaría dos familias como máximo:

Sora → títulos, grandes números, branding.

Inter → UI, tablas, formularios, textos y botones.

Por ejemplo:

OBEY YOUR MASTER
Sora 700

Security Center
Sora 600

Anti-Raid
Inter 600

Detect and stop coordinated...
Inter 400

[Inferencia] No utilizaría cinco pesos tipográficos distintos dentro de una misma tarjeta.

Escala:

Rol	Tamaño

Hero/dashboard title	32 px
Page title	26 px
Section	20 px
Card title	16 px
Body	14 px
Secondary	13 px
Metadata	12 px



---

Contraste

W3C establece una relación mínima de contraste de 4.5:1 para texto normal y 3:1 para ciertos textos grandes; también exige una separación visual suficiente para controles relevantes. 

Los colores principales que propuse arriba funcionan bien sobre el fondo oscuro. Por ejemplo:

#F6F7FB / #0B0D12 ≈ 18.15:1
#A8B0C2 / #0B0D12 ≈ 8.93:1
#8B5CF6 / #0B0D12 ≈ 4.59:1

[Inferencia] Esto es precisamente lo contrario de lo que suele pasar con dashboards “bonitos” generados rápidamente donde todo termina gris oscuro sobre gris ligeramente menos oscuro.


---

Layout

[Inferencia] En desktop usaría tres niveles cuando la sección lo necesite:

┌───────┬───────────────────┬─────────────────────────────────────┐
│       │                   │                                     │
│ OBEY  │      MODULE       │             CONTENT                 │
│       │                   │                                     │
│  ◉    │ Architect         │                                     │
│  🛡   │ Channels          │                                     │
│  ♫    │ Roles             │                                     │
│  ⚡   │ Decoration        │                                     │
│       │ Templates         │                                     │
│       │                   │                                     │
└───────┴───────────────────┴─────────────────────────────────────┘

[Inferencia] Medidas iniciales razonables:

Primary rail
72px

Secondary sidebar
240–260px

Page padding
24–32px

Content
fluid

Recommended maximum content width
~1600px

[Inferencia] Algunas aplicaciones como Architect, Automations o Analytics deberían poder ocupar prácticamente todo el ancho disponible.


---

Top Bar

[Inferencia] Tendría poca altura y mucha utilidad:

Melodia Community ▼

                                     ⌕ Search
                                     ● Live
                                     🔔
                                     Romario ▼

[Inferencia] El selector de servidor debe estar siempre accesible.

[Inferencia] ● Live tendría estado real del socket:

● Live
◐ Reconnecting
○ Offline

No sería decoración.


---

Sidebar principal

[Inferencia] No pondría el nombre completo de 40 módulos.

⌂    Overview

▦    Server
🛡    Management
♙    Community
♫    Entertainment
⚡    Automation
⌁    Analytics

⚙    System

Seleccionás:

⚡ Automation

y la segunda columna cambia:

AUTOMATION

Overview
Workflows
Feeds
Schedules
Runs
Logs

[Inferencia] Esto escala muchísimo mejor.


---

Cards

[Inferencia] Nada de tarjetas enormes porque sí.

Tendríamos tres tipos.

Metric Card

Members

12,842
↑ 4.2%

last 30 days

Status Card

Discord Gateway

● Healthy

Latency
42 ms

Action Card

Server Architect

Create, redesign and
manage your server.

Open Architect →

[Inferencia] Nunca metería las tres cosas en el mismo componente universal.


---

Radius

[Inferencia] Haría la interfaz moderadamente redondeada, no infantil:

small       8px
controls   10px
cards      14px
modal      16px
large      20px

[Inferencia] No utilizaría border-radius: 30px en cada card.


---

Sombras

[Inferencia] Casi inexistentes.

[Inferencia] En modo oscuro la separación debería venir principalmente de background + border, no de enormes sombras negras.

Canvas
   ↓
Surface
   ↓
Border
   ↓
Elevated


---

Botones

Tendríamos solamente patrones controlados:

Variante	Uso

Primary	acción principal
Secondary	alternativa
Ghost	navegación/acciones leves
Danger	destructiva
Icon	herramientas compactas


Ejemplo:

[ Apply changes ]

[ Preview ]

Cancel

[ Delete server configuration ]

[Inferencia] Nunca dos botones Primary compitiendo dentro del mismo bloque.


---

Acciones peligrosas

Ban:

Ban @username

This member will immediately
lose access to the server.

Reason
[_______________________]

Delete message history
[ Last 24 hours ▼ ]

           Cancel    Ban member

[Inferencia] Red solamente en el CTA final y en los elementos realmente peligrosos.

No un modal rojo entero.


---

Inputs

[Inferencia] Cada input debe tener explícitamente:

label
description optional
field
helper/error

No:

[ What's this?          ]

sin contexto.

Ejemplo:

Slowmode

Limit how frequently members
can send messages.

[ 5 seconds ▼ ]


---

Toggles

[Inferencia] Los switches deberían usarse solamente para estados binarios inmediatos.

Bien:

Anti-Raid             ON

Mal:

Verification          ON

si Verification tiene otras diez opciones obligatorias.

En ese caso:

Verification
Enabled

Configured
Button Verification

[Manage]


---

Tablas

[Inferencia] Para miembros, moderation cases, audit, tickets, backups y command management usaría tablas reales.

CASE    USER       ACTION     MODERATOR     DATE       STATUS

#184    @Carlos    Timeout    @Sebas        23:04      Active
#183    @Lucas     Warn       @Romario      22:51      Open

[Inferencia] Y en móvil se transforman en cards, no en una tabla horizontal microscópica.


---

Status badges

No:

[ ACTIVE ]

verde chillón gigantesco.

Sí:

● Active
● Healthy
● Connected

[Inferencia] Icono + texto + color evita depender exclusivamente del color para transmitir el estado.


---

Skeletons

[Inferencia] Nunca mostraría:

Loading...

durante cargas habituales.

Por ejemplo Overview:

█████████

████
████████████

──────────────

██████████████
████████

Pero skeleton solamente para cargas iniciales.

[Inferencia] No usaría skeleton para una operación de 20 segundos de Architect; ahí debe existir progreso real.


---

Loading de operaciones

Applying blueprint

Creating channels
17 / 24

███████████░░░░░░ 64%

Current operation
Creating #media

Estimated operations remaining
18

[Inferencia] No mostraría estimaciones temporales inventadas.


---

Empty states

Mal:

No tickets.

Bien:

No open tickets

Your support inbox is clear.

Configure a ticket panel to let
members contact your staff.

[Create ticket panel]

[Inferencia] Cada empty state debería decir qué ocurre y, cuando tenga sentido, cuál es la siguiente acción.


---

Errores

No:

Something went wrong.

[Inferencia] El patrón debería ser:

Couldn't update AutoMod

Discord rejected the permission
change because OBEY's role is
below Moderator.

[Fix role position]
[Retry]

Error ID
req_01JB...

Esto también conecta con correlation IDs de nuestra arquitectura.


---

Toasts

[Inferencia] Solo para confirmaciones pequeñas:

✓ Settings saved

[Inferencia] No usar toast para:

Architect failed after changing 47 resources.

Eso necesita estado persistente en la propia página.


---

Modales

[Inferencia] Reservaría modales para tareas acotadas.

Sí:

Create role
Ban member
Create backup
Rename channel

No:

Configure entire AutoMod

Eso merece página/drawer dedicado.


---

Drawers

[Inferencia] Los drawers laterales serían muy útiles para inspección rápida sin abandonar contexto:

Members
Tickets
Channels
Roles
Audit entries
Cases

Por ejemplo:

@Sebas
─────────────────────

Member since
...

Roles
Moderator
Support

Recent moderation
...

Voice activity
...

[Open complete profile]


---

Animaciones

[Inferencia] Nada de interfaces bailando.

Microinteracciones:

hover        120–160 ms
button       120 ms
drawer       ~220 ms
modal        ~180 ms
page state   ~180–240 ms

[Inferencia] Usaría movimiento para explicar cambios de estado, no como decoración.

[Inferencia] También respetaría prefers-reduced-motion.


---

Realtime visual

Esta parte debería convertirse en identidad propia de OBEY.

Por ejemplo:

● LIVE

Cyan.

Cuando entra un nuevo ticket:

Ticket #185
just now

aparece discretamente.

Cuando alguien entra en voz:

Gaming
4 users

→

Gaming
5 users

con una transición corta.

[Inferencia] No mostraría partículas, flashes ni notificaciones animadas constantemente.


---

Realtime nunca debe sentirse inestable

Socket perdido:

◐ Reconnecting

Live updates are temporarily paused.
Your current data remains available.

Reconectado:

● Live

Synced just now

[Inferencia] Después se hace el refetch de estado que definimos anteriormente.


---

Architect

[Inferencia] Ésta debería ser probablemente la pantalla más impresionante de OBEY.

┌──────────────────┬──────────────────────────────┬────────────────────┐
│ STRUCTURE        │ PREVIEW                      │ INSPECTOR          │
│                  │                              │                    │
│ ▼ Information    │     Melodia Community       │ #general           │
│   # welcome      │                              │                    │
│   # rules        │  ─── INFORMATION ───         │ Name               │
│                  │  # welcome                   │ [ general       ] │
│ ▼ Community      │  # rules                     │                    │
│   # general      │                              │ Category           │
│   # memes        │  ─── COMMUNITY ───           │ [ Community ▼ ]   │
│                  │  # general                   │                    │
│ ▼ Voice          │  # memes                     │ Permissions        │
│   General        │                              │ [ Manage ]         │
│                  │                              │                    │
└──────────────────┴──────────────────────────────┴────────────────────┘

Undo     Redo                  4 pending changes

                  Preview Diff     Apply Changes

Y arriba:

Visual | AI


---

Architect AI

Ask OBEY Architect

Make the community section cleaner,
create channels for Valorant and
Minecraft, and keep staff untouched.

                      Generate

Resultado:

Proposed changes

+ Gaming category
+ #valorant
+ #minecraft
~ Move #gaming-chat

Staff
No changes

Permissions
No changes

[Discard]
[Modify]
[Preview]

[Inferencia] Ahí la IA deja de sentirse como chatbot y empieza a sentirse como parte real del producto.


---

Decoration Studio

[Inferencia] Esta pantalla tiene que ser muy visual.

DECORATION STUDIO

Theme

┌───────────┐ ┌───────────┐ ┌───────────┐
│ Midnight  │ │ Sakura    │ │ Minimal   │
│    ●      │ │    ✿      │ │    —      │
└───────────┘ └───────────┘ └───────────┘

Preview

━━ INFORMATION ━━

📜・rules
📢・announcements

━━ COMMUNITY ━━

💬・general
📷・media

────────────────────

Decoration density

Minimal ─────●──── Decorative

[Customize]
[Apply]


---

Automation Builder

[Inferencia] Visualmente debe parecer un workflow builder, pero mucho más sencillo que n8n.

┌──────────────────┐
│ MEMBER JOINS     │
│ Trigger          │
└────────┬─────────┘
         │
┌────────▼─────────┐
│ Account age      │
│ < 3 days         │
└────────┬─────────┘
         │
┌────────▼─────────┐
│ Quarantine role  │
│ Action           │
└────────┬─────────┘
         │
┌────────▼─────────┐
│ Security log     │
└──────────────────┘

                  [Test] [Publish]

[Inferencia] Cada node tendría color por tipo, no colores aleatorios.


---

Music

[Inferencia] Acá sí podemos permitir una UI un poco más inmersiva.

MUSIC
───────────────────────────────

             artwork

Starboy
The Weeknd

1:33 ━━━━━━━●━━━━━━━━ 3:50

          ⏮   ▶   ⏭

Connected to
🔊 General · 8 listeners

───────────────────────────────

Up next                           17

1   Die For You
2   After Hours
3   Save Your Tears

Queue | History | Collections

[Inferencia] El artwork puede influir ligeramente en un background blur, pero jamás comprometer la legibilidad.


---

Tickets

[Inferencia] Tres paneles en desktop:

INBOX            CONVERSATION              DETAILS

#184 Sebastian   messages...                Status
#183 Axel                                   Open
#182 Lucas       messages...
                                             Assigned
                                             Romario

                                             Tags
                                             Payment

                                             [Close]

Esto es muchísimo mejor que abrir un modal por cada ticket.


---

Security

SECURITY CENTER

87
Security posture

● Anti-Raid
● Anti-Nuke
● Verification

────────────────────────

Needs attention

HIGH
3 roles have Administrator.

MEDIUM
Verification does not check
account age.

────────────────────────

Live incidents

23:17  Mass mention blocked
23:04  Suspicious join burst

[Inferencia] Evitaría enormes gauge charts de 0–100 únicamente por decoración.


---

Analytics

[Inferencia] Tendría gráficos donde realmente responden preguntas.

No:

Fancy donut
Fancy donut
Fancy donut

Sí:

Members
+182 this month

[ line chart ]

Messages
Peak: 21:00

[ activity chart ]

Voice
843 hours

[ trend ]

[Inferencia] Cada gráfico debería responder a una pregunta administrativa concreta.


---

Design tokens

[Inferencia] Codex no debería escribir:

color: #8b5cf6;

en 80 archivos.

Deberíamos tener:

packages/design-tokens

colors
spacing
radius
typography
motion
z-index
breakpoints
shadows

Y:

packages/ui

con:

Button
Input
Select
Modal
Drawer
Card
StatusBadge
Avatar
Table
Tabs
Tooltip
Popover
CommandPalette
EmptyState
ErrorState
Skeleton
Progress
PageHeader
MetricCard
ServiceStatus
ConfirmDialog

[Inferencia] La web entera tendría que consumir esos componentes.


---

Iconografía

[Inferencia] Una sola librería.

No:

Lucide
Heroicons
FontAwesome
random SVG
emoji

mezclados.

[Inferencia] Usaría Lucide como iconografía web funcional y los emojis/íconos propios de OBEY únicamente donde tengan valor de marca.


---

Light mode

[Inferencia] No lo pondría como prioridad inicial.

[Inferencia] Primero haría un dark mode excelente, pero los design tokens deberían permitir añadir light mode posteriormente sin reconstruir componentes.


---

El principio central

[Inferencia] Cada página debería poder responder estas cuatro cosas sin que el usuario tenga que adivinarlas:

¿Dónde estoy?

¿Qué está pasando?

¿Qué puedo hacer?

¿Qué pasó después de hacerlo?

Ese sería uno de los criterios principales del rediseño.


---

Y esta es la sección que agregaría directamente al prompt maestro de Codex:

DESIGN SYSTEM & PRODUCT UI

OBEY YOUR MASTER must have a unique product identity.

Do not clone Discord's visual appearance.

The product may feel native to the Discord ecosystem in terminology,
interaction concepts and integration behavior, but it must remain
visually identifiable as OBEY.

Do not imitate Discord layouts, branding, exact colors, typography,
navigation structure or visual trade dress.

VISUAL DIRECTION

The authenticated OBEY application should feel like:

premium control center
modern SaaS
realtime operations platform
advanced Discord administration tool.

Avoid:

generic bot dashboards
excessive glassmorphism
RGB/neon gamer styling
gradients everywhere
oversized rounded cards
excessive shadows
purple everywhere
decorative animations without functional purpose.

BASE THEME

Use a dark-first design system.

Proposed tokens:

bg.canvas
#0B0D12

bg.surface
#121722

bg.elevated
#171E2B

bg.interactive
#1D2533

border.default
#273143

border.strong
#354158

text.primary
#F6F7FB

text.secondary
#A8B0C2

text.muted
#727D91

brand.primary
#8B5CF6

brand.secondary
#22D3EE

success
#34D399

warning
#FBBF24

danger
#FB7185

Do not duplicate these raw color values throughout the codebase.

Expose all visual primitives through design tokens.

SEMANTIC COLORS

Purple represents primary OBEY interaction and selection.

Cyan represents realtime/live activity where appropriate.

Green represents successful/healthy state.

Yellow represents warning/attention.

Red represents destructive action, error or serious security state.

Never rely on color alone to communicate important status.

TYPOGRAPHY

Preferred direction:

Sora
for page titles, major headings, identity and important numeric metrics.

Inter
for interface text, forms, navigation, tables and controls.

Maintain a small and consistent type scale.

Avoid excessive font weights.

LAYOUT

Desktop application architecture:

Primary navigation rail
→ contextual secondary navigation
→ working area.

Suggested initial dimensions:

primary rail: approximately 72px
secondary navigation: approximately 240–260px
page padding: approximately 24–32px.

Do not constrain workspaces such as:

Server Architect
Automation Builder
Analytics

to narrow marketing-style content columns.

NAVIGATION

Primary domains:

Overview
Server
Management
Community
Entertainment
Automation
Analytics
System.

Secondary navigation changes based on the selected domain.

Do not create one sidebar containing every page in the product.

Always expose the current guild/server clearly.

Support fast guild switching.

Provide a global command/search palette.

TOP BAR

The authenticated app top bar should provide relevant global context:

current guild
global search
realtime connection state
notifications
current account.

Realtime state must reflect actual connection state.

Example:

Live
Reconnecting
Offline.

COMPONENT LIBRARY

Create a centralized reusable component library.

Expected foundational components include:

Button
IconButton
Input
Textarea
Select
Combobox
Checkbox
Radio
Switch
Slider
Modal
Drawer
Popover
Tooltip
DropdownMenu
Tabs
Card
MetricCard
StatusCard
ActionCard
Table
Badge
StatusBadge
Avatar
Skeleton
Progress
EmptyState
ErrorState
PageHeader
Breadcrumb
CommandPalette
ConfirmDialog
ActivityItem
ServiceStatus.

Do not create new page-specific versions of generic controls unless
a genuine product requirement exists.

BUTTON SYSTEM

Variants:

primary
secondary
ghost
danger
icon.

Only one primary action should normally dominate an action group.

Danger styling must be reserved for genuinely destructive actions.

Do not fill entire dangerous dialogs with red.

FORMS

Every form control must have a clear accessible label.

When useful, include supporting description or validation message.

Do not rely only on placeholder text as the field label.

Clearly distinguish:

default
hover
focus
error
disabled
loading
success.

SETTINGS

Use switches only for genuinely binary settings.

If enabling a feature requires additional setup, represent the feature
as a configurable module rather than a simple unexplained switch.

CARDS

Do not create a universal card component that attempts to represent
every type of information.

Distinguish at least:

metric cards
status cards
action cards
content containers.

Avoid excessive nesting of cards inside cards.

TABLES

Use real structured tables for datasets such as:

moderation cases
audit logs
members
backups
commands
ticket lists where appropriate
automation executions.

On small screens, provide responsive mobile presentations instead of
forcing unreadable horizontal desktop tables.

STATUS

Use icon + label + color for status communication.

Examples:

Healthy
Degraded
Recovering
Offline
Active
Paused
Failed
Pending.

Do not use color alone.

LOADING STATES

Use skeletons for normal initial data loading.

Do not use skeletons for long-running operations.

Long-running operations must expose actual job state and progress when
available.

Example:

Applying blueprint

Channels
17 / 24

Current operation
Creating #media.

Do not invent completion-time estimates.

EMPTY STATES

Every meaningful empty state should explain:

what is empty
why that matters where appropriate
what the user can do next.

When an obvious next action exists, expose it directly.

ERROR STATES

Do not show generic errors when a useful explanation exists.

Error UI should support:

human-readable cause
recovery action
retry where appropriate
correlation/error ID
partial operation state where relevant.

Example:

Couldn't update AutoMod.

OBEY's Discord role is below the role it needs to manage.

Fix role position
Retry.

TOASTS

Use toasts only for lightweight transient confirmation.

Do not communicate major failures, security incidents, failed Architect
deployments or other important persistent state solely through a toast.

MODALS

Use modals for contained operations such as:

create role
rename channel
ban member
create backup
confirmation.

Do not place complex full-module configuration inside oversized modals.

DRAWERS

Use contextual side drawers for fast inspection of:

members
channels
roles
tickets
moderation cases
audit entries.

Allow navigation to the complete entity page where relevant.

MOTION

Motion should communicate state and hierarchy.

Avoid decorative animation for its own sake.

Keep standard interface transitions fast and subtle.

Respect reduced-motion user preferences.

REALTIME UI

Realtime behavior is part of the OBEY product identity.

Realtime changes should be visible but not distracting.

Examples:

ticket appears
member count changes
voice occupancy changes
song changes
security incident arrives
job progress updates.

Do not flash or animate the entire interface when receiving events.

When realtime connectivity is interrupted, communicate this clearly.

Example:

Reconnecting

Live updates are temporarily paused.
Current loaded information remains available.

After successful reconnection:

re-authorize
rejoin rooms
refetch critical state
continue realtime updates.

SERVER ARCHITECT UI

Treat Server Architect as a major product workspace.

Desktop layout:

server structure tree
Discord-inspired abstract preview
resource inspector.

Do not replicate Discord's interface pixel-for-pixel.

Support:

drag and drop
selection
multi-selection where appropriate
undo
redo
pending changes
preview diff
apply
AI mode.

Provide two primary modes:

Visual
AI.

AI mode generates proposed changes only.

AI must never directly mutate the guild.

ARCHITECT DIFF

Present proposed changes in human-readable language.

Clearly distinguish:

create
update
move
permission change
delete.

Highlight destructive changes.

Show unaffected sensitive areas when useful.

Example:

+ Create Gaming category
+ Create #valorant
+ Create #minecraft
  ~ Move #gaming-chat

Staff
No changes

Permissions
No changes.

DECORATION STUDIO

Decoration must be a visual workspace.

Support preview of:

themes
channel naming
category naming
role visual styles
emoji density
supported guild visual features.

Theme changes must not silently alter permissions or unrelated server
configuration.

AUTOMATION BUILDER

Use a node-based workflow editor specialized for Discord.

Avoid unnecessary complexity.

Node categories should visually distinguish:

Trigger
Condition
Action.

Do not use random colors for individual nodes.

Support readable flow at normal zoom levels.

MUSIC CENTER

Music may use a more immersive presentation than administration pages.

Support:

artwork
track
artist
progress
transport controls
volume
voice state
queue
history
collections.

Album art may influence subtle contextual background treatments only
when readability remains strong.

Do not copy Spotify, Apple Music or Discord UI.

TICKET CENTER

Desktop tickets should use an operational support layout, preferably
with:

ticket inbox
conversation
ticket details/context.

Avoid requiring modal navigation for routine ticket operations.

SECURITY CENTER

Security should resemble an operational security console, not a generic
settings page.

Prioritize:

active incidents
protection status
security recommendations
dangerous permissions
recent events
actions.

Avoid decorative gauges that do not convey actionable information.

ANALYTICS

Every chart should answer a concrete administrative question.

Avoid adding charts purely to fill dashboard space.

Provide textual values alongside visualizations.

COMMAND CENTER

Commands should be searchable and filterable.

Expose command state and relevant access configuration without showing
raw implementation details.

RESPONSIVE DESIGN

Do not merely shrink desktop layouts.

Create explicit mobile patterns for:

Overview
Tickets
Moderation
Security alerts
Music controls
Activity
Architect approval/progress
Rollback.

Advanced editors may provide reduced mobile editing functionality while
remaining fully reviewable.

ACCESSIBILITY

Maintain sufficient contrast for text and important interface controls.

Provide visible keyboard focus.

Support keyboard navigation for major interfaces.

Do not rely exclusively on:

color
hover
animation
icons without labels

to communicate essential information.

DESIGN TOKENS

Create a shared design-token package for:

colors
typography
spacing
radii
shadows
motion
breakpoints
z-index.

Application code must consume semantic tokens instead of repeating raw
values.

ICONOGRAPHY

Use one primary functional icon library.

Preferred direction:
Lucide.

Do not mix multiple unrelated icon libraries without a specific need.

Custom OBEY icons and emojis may be used for brand identity where
appropriate.

Do not use emoji as the default icon system for the web application.

VISUAL QA

Before considering a page complete, verify:

visual hierarchy
spacing consistency
contrast
focus state
empty state
loading state
error state
permission-denied state
realtime disconnected state
mobile behavior
long text
large datasets
zero-data behavior
slow network behavior.

No page is complete only because the happy-path screenshot looks good.

PRODUCT QUALITY RULE

Every major screen must answer clearly:

Where am I?

What is happening?

What can I do?

What happened after I did it?

Do not mark UI work complete if any of these questions remain ambiguous.[Inferencia] Con esto, Codex ya tendría restricciones visuales suficientemente específicas como para no improvisar cada página.

[Inferencia] Y ahora ya tenemos prácticamente todos los bloques para hacer el siguiente paso importante: juntar bot multipropósito + música + seguridad + Server Architect + templates/backups + Decoration + Automation Engine + API + Socket.IO + Redis + BullMQ + dashboard realtime + Design System + testing en un único prompt maestro definitivo, pero ordenado por fases para que Codex primero audite lo existente y no intente reconstruir todo de golpe.