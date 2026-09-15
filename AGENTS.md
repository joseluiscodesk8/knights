# AGENTS.md — Knights

Guía de contexto para la IA al trabajar en este proyecto.
La IA trabaja en **español** y completa resúmenes de tareas con tablas cuando se le pide.

---

## Qué es
Juego en línea en el que el jugador elige un **caballero de bronce** (Seiya, Hyoga, Shiryu, Shun o Ikki) y pelea contra los **12 Gold Knights** (uno por signo zodiacal) hasta intentar completar la campaña. Tiene modo **solitario** y **multijugador P2P en equipo** (host/guest via WebRTC).

Se despliega en Vercel → `https://knights-ten.vercel.app`.

**Rutas principales:**
- `/` — Juego completo (client component): selector de caballero → mapa → batalla → resultado, con flujo para modo solitario y multijugador.
- `/auth/login` — Login / registro con email (Supabase Auth). Page server con metadata + client LoginForm.
- `/stats` — Tabla de progreso (Server Component con RLS). Ruta privada (proxy).
- `icon.svg`, `manifest.webmanifest` — icono y manifest PWA (generados vía App Router).

---

## Stack
- **Next.js 16.1.6** (App Router), **React 18**, **TypeScript 5** (`strict: true`).
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`): auth (email/password) + PostgreSQL (RLS) para profiles, runs, battles. Proyecto `hydrxnjisvpuqdyutpel`.
- **PeerJS 1.5.5** → WebRTC P2P para multijugador (host gobierna, guests envían solo "listo").
- **Zod 4.5.4** → validación de inputs en Server Actions.
- **SCSS** (Sass) con **CSS Modules** → estilos por componente.
- **Vitest 4.1.11** + `@testing-library/react` + jsdom → tests unit + componente.
- **ESLint 9** + `eslint-config-next` → lint (`--max-warnings 0`).
- **Alias de importación:** `@/*` → `./src/*`.

---

## Estructura de carpetas
```
src/
├── app/                         # Rutas Next.js (App Router)
│   ├── layout.tsx               # Metadata, OG, viewport, iconos, <Header/>
│   ├── page.tsx                 # /  (client Game)
│   ├── auth/login/page.tsx      # /auth/login  (server: metadata; renderiza LoginForm client)
│   ├── stats/page.tsx           # /stats (server: Server Component con Supabase RLS)
│   ├── icon.svg                 # Favicon SVG (auto-servido por Next)
│   ├── manifest.ts              # PWA manifest
│   ├── loading.tsx / error.tsx / not-found.tsx
│   └── globals.scss             # Reset global + gradiente de fondo
├── components/
│   ├── Game.tsx                 # Máquina de estados principal: modeChoice → knightSelection → map → battle → result (solitario y multi)
│   ├── ModeChoice.tsx           # Pantalla "Elegir modo" después de escoger caballero
│   ├── KnightSelection.tsx      # Selector de caballero de bronce (con stats + preview)
│   ├── GameMap.tsx              # Mapa canvas con movimiento por botones O/X
│   ├── BattleArena.tsx          # Batalla por turnos (con BattleCry para reutilizar daño visual)
│   ├── Header.tsx               # Barra superior con sesión
│   ├── LoginForm.tsx            # Login/registro email (client component, Supabase Auth)
│   ├── BattleCry.tsx            # Componente para animación de daño (reutilizable en mapa y batalla)
│   └── multiplayer/
│       ├── ModeChoice.tsx       # Pantalla "Con quién quieres jugar"
│       ├── MultiplayerGame.tsx  # Orquestador host/guest (autoridad = host, guest solo envía "listo")
│       ├── LobbyView.tsx        # Crear/unirse a sala con código de 6 dígitos
│       ├── CoopMap.tsx          # Mapa en equipo (todos ven mismo mapa, avatares en mismas posiciones)
│       ├── CoopBattle.tsx       # Batalla conjunta: turno del host + todos atacan, luego turno del siguiente
│       └── MultiplayerEnd.tsx   # Pantalla de resultado (wins, derrotas, nivel, button)
├── hooks/
│   └── useSession.ts            # Hook para sesión de Supabase (user + profile + loading)
├── lib/
│   ├── battle.ts                # Lógica pura del asalto: rollAttack(0-9), resolveRound (daño = diff; cura = ceil(diff/2))
│   ├── maze.ts                  # Generación y lógica del mapa (createMaze, moverJugador, esEsquinaO, esEsquinaX, etc.)
│   ├── knights.ts               # Extracción de datos de los JSON (getBronzeKnights, getGoldKnights, getAllKnights)
│   ├── stats.ts                 # Lógica de stats: computeLevel(wins) = 1 + floor(wins/3)
│   ├── api.ts                   # DEPRECATED — eliminado (era fetch a /api/runs). Reemplazado por Server Actions.
│   ├── supabase/
│   │   ├── client.ts            # createClient() y isSupabaseConfigured() para browser
│   │   └── server.ts            # createClient() para Server Components/Actions (con cookies)
│   └── multiplayer/
│       ├── types.ts             # Protocolo compartido: GameStatus, MultiplayerState, PeerMessage, Knight, etc.
│       └── transport.ts         # PeerJS: crearSala, unirseASala, enviarListo, enviarMatar, onConnection, etc.
├── data/
│   ├── bronce.json              # Los 5 caballeros de bronce (id 1-5, hp 10, nombres ES, imágenes en /public)
│   └── gold.json                # Los 12 caballeros de oro (id 0-11, hp 20, imágenes remotas)
├── types/
│   ├── Knights.ts               # Knight, Opponent (con sides y isSideUsed), Move, Coordinate, Player, Bosses
│   └── Game.ts                  # ResultadoVisual (con tipo: "damage" | "heal" | "critical"), tipoDeAtaque()
├── styles/
│   ├── index.module.scss        # Clases CSS Modules (importadas como styles.xxx en componentes)
│   └── components/              # SCSS parciales por componente (_Multiplayer, _Game, _Header, _Stats)
└── proxy.ts                     # Middleware de Next: protege /stats (refresca sesión, redirige a /auth/login)

supabase/
├── config.toml                  # Config de Supabase local
└── migrations/                   # SQL versionado (schema + RLS + profiles + runs + battles)
```

**Patrón de capas:** `data/` (JSON) → `lib/` (lógica pura) → `hooks/` (estado React) → `components/` (UI) → `app/` (rutas y Server Actions).

---

## Decisiones de diseño ya tomadas (NO revertir)
- **Host es la autoridad:** los guests **NO** envían rolls ni daños. Solo envían `listo`. El host resuelve todo (rolls, daño, cura, muerte). Los guests animan y esperan.
- **Rounds en multijugador:** el guest ve `animando` y luego el resultado calculado por el host. No hay rolls en el cliente guest.
- **Esquinas del mapa:** solo el host "pinta" la esquina como ocupada en su propio maze. Cada peer mantiene su propio maze local y coloca su avatar sin afectar al host.
- **Flujo batalla solitario:** después de cada batalla → **mapa nuevo** nunca se vuelve al mapa anterior. El goldIndex se preserva de un mapa al siguiente (para que el siguiente gold no sea siempre el primero).
- **Botones del mapa (O/X):** son indicadores visuales, no interactivos. El movimiento es solo con las flechas.
- **Sistema de daño/cura:** roll 0–9, mayor gana, daño = diferencia absoluta, cura = `Math.ceil(diferencia / 2)`, sin daño extra por rolls opuestos.
- **Progreso:** tabla `profiles` con `wins`, `losses`, `level` (calculado: `1 + floor(wins/3)`). Tablas `runs` y `battles` para histórico.
- **Mutaciones de juego:** solo Server Actions en `src/lib/actions/game.ts` (nunca route handlers).
- **Sin migraciones automáticas:** las migraciones SQL viven en `supabase/migrations/` y se aplican manualmente.

---

## Estilos / tema
- **Colores:** `#ffd700` (dorado, color principal), `#daa520` (dorado oscuro), `#3a2503` (marrón oscuro, textos).
- **Fondo:** gradiente lineal de `#ffd700` → `#daa520` (top → bottom).
- **Fuente:** **Inter** (Google Fonts, cargada en `layout.tsx`).
- **CSS Modules:** clases vía `import styles from "@/styles/index.module.scss"` → `styles.xxx`.
- **Parciales SCSS:** cada componente importante tiene un `_X.scss` en `src/styles/components/`, importado desde `index.module.scss`.
- **Sin breakpoints específicos:** mobile-first, diseño responsive nativo con flex/col.
- **No hay iconos:** no se usa librería de iconos (se eliminó `react-icons`). Los iconos se manejan con texto unicode.

---

## Negocio / contexto
- **Entidades:** caballero (bronce, id 1–5, hp 10), Gold Knight (id 0–11, hp 20), cada Gold representando un signo zodiacal: Aries(0), Tauro(1), Géminis(2), Cáncer(3), Leo(4), Virgo(5), Libra(6), Escorpio(7), Sagitario(8), Capricornio(9), Acuario(10), Piscis(11).
- **Nivel:** `computeLevel(wins) = 1 + floor(wins/3)`.
- **Tablas Supabase:** `profiles` (id, wins, losses, level, knight_id), `runs` (id, owner_id, knight_id, status, golds_defeated, created_at, ended_at), `battles` (id, run_id, gold_id, outcome, player_roll, gold_roll, damage, created_at).
- **Multijugador:** hasta 5 jugadores, comparten vida, turno del más rápido (por `speedMs` del caballero). Boss con hp mayor al total de vida de todos los jugadores.
- **Producción:** `https://knights-ten.vercel.app`, deploy manual con `vercel --prod`.

---

## Comandos
- **Dev:** `npm run dev`
- **Build:** `npm run build` (incluye typecheck de Next)
- **Lint:** `npm run lint` → `eslint . --max-warnings 0`
- **Typecheck:** `npm run typecheck` → `tsc --noEmit`
- **Test:** `npm test` → `vitest run` (jsdom, 21 tests en 6 archivos)
- **Deploy:** `vercel --prod` (tras commit y aprobación)
- **Truco conocido:** `rm -rf .next && npm run build` para regenerar tipos huérfanos cuando se eliminan rutas.
- **Verificación típica tras cambio:** `npm run lint && npm run typecheck && npm test && npm run build`

---

## Reglas de trabajo
- **Idioma:** español para comunicación, documentación y nombres de commits.
- **No commit/push** salvo que se pida explícitamente. El usuario commitea manualmente (`git add` + `git commit`).
- **Usar herramientas de archivo** (`Read`, `Edit`, `Write`, `Glob`, `Grep`) para leer/escribir/buscar; no shell.
- **Tipado estricto** (TypeScript strict mode); sin comentarios salvo que se pidan.
- **Sin emojis** salvo que el usuario los pida.
- **Server Actions** para todas las mutaciones de juego (no crear route handlers nuevos).
- **Un efecto por cambio de estado** (React best practice: evitar múltiples `useEffect` con `setState`).
- **`useSession`** es el hook de acceso a sesión; no llamar `supabase.auth` directamente en componentes.