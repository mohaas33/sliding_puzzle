# Shards of Time — Sliding Puzzle Game

## Project

Historic sliding puzzle game (5×5 grid). Players restore famous artworks/scenes to unlock lore.
Web first (React + Vite), then React Native (Expo). Full backend with Node/Express.

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS → deploy on Vercel
- Mobile: React Native + Expo (later phase)
- Backend: Node.js + Express → deploy on Railway
- DB: PostgreSQL (users, progress, puzzles, leaderboards)
- Cache: Redis (sessions, daily puzzle lock, rate limiting)
- Storage: S3 + CloudFront (artwork tiles)
- Payments: Stripe (one-time purchase, $2.99)
- Shared logic: npm workspace package (shuffle, solvability, win detection)

## Monorepo structure

sliding_puzzle/
├── packages/
│ └── game-logic/ # shared puzzle engine (framework-agnostic TS)
├── apps/
│ ├── web/ # React + Vite
│ ├── api/ # Express backend
│ └── mobile/ # Expo (phase 2)
├── CLAUDE.md
└── package.json # npm workspaces root

## Commands

- Install: `npm install` (root, installs all workspaces)
- Both dev servers: `npm run dev` (uses concurrently)
- Web dev only: `npm run dev -w apps/web`
- API dev only: `npm run dev -w apps/api` (uses tsx watch, port 3001)
- Test: `npm test -w packages/game-logic`
- Single test: `npm test -w packages/game-logic -- --testNamePattern="<name>"`
- Build all: `npm run build`
- Typecheck all: `npm run typecheck`

## Key implementation notes

- Vite proxies `/api/*` → `http://localhost:3001` during dev (see `apps/web/vite.config.ts`)
- `apps/api` uses `tsx watch` for dev (no compile step); `tsc` for production build
- `packages/game-logic` is consumed as a workspace symlink (`@sliding-puzzle/game-logic: "*"`)

## Code style

- TypeScript strict mode everywhere
- ES modules (import/export), no CommonJS
- No `any` — use `unknown` or proper types
- Prefer interfaces over types
- Prettier + ESLint enforced

## Key rules

- Game logic (shuffle, solvability, move validation) lives ONLY in packages/game-logic
- Never commit .env files — use .env.example
- API routes: REST, versioned under /api/v1/
- All DB queries go through a repository layer, never raw SQL in routes
- When changing shared game logic, run tests before touching apps

## Agent rules

### Workspace boundaries (strictly enforced)

Each agent is scoped to its workspace. Violating these boundaries is always wrong:

- `game-logic-builder`: edits ONLY `packages/game-logic/**` and its tests
- `api-builder`: edits ONLY `apps/api/**` — never imports from `apps/web`
- `web-builder`: edits ONLY `apps/web/**` — consumes API via `/api/v1/` endpoints only, never imports directly from `apps/api`
- `codebase-researcher`: read-only across all workspaces
- `story-writer`: read-only, no file edits
- `spec-writer`: read-only, no file edits
- `implementation-validator`: read-only across all workspaces

### Build order for agents

When a feature touches multiple workspaces, always build in this order:

1. `game-logic-builder` first (if `packages/game-logic` changes)
2. `api-builder` second (consumes game-logic via workspace import)
3. `web-builder` third (consumes API contract from api-builder's summary)

Never run `api-builder` or `web-builder` before `game-logic-builder` has finished and tests pass.

### Test gate

After any `game-logic-builder` run, the following must pass before downstream agents start:
`npm test -w packages/game-logic`

After any `api-builder` or `web-builder` run:
`npm run typecheck && npm test`

### Validator checks specific to this project

The `implementation-validator` must always check:

- No shuffle, solvability, or move-validation logic exists outside `packages/game-logic`
- No raw SQL in `apps/api` routes (must go through repository layer)
- No direct imports between `apps/web` and `apps/api`
- Tenant/user isolation: no route returns another user's progress, leaderboard entries, or purchase status without auth check
- No Stripe or payment data logged to console or returned raw to the client
- Redis daily puzzle lock is respected — no route bypasses it without explicit admin flag

## Known deferrals
- hintRepository is in-memory — must be replaced with PostgreSQL 
  before production (interface is ready at hintRepository.ts)
- x-user-id auth is unsigned — must be replaced with JWT before 
  launch (see middleware/auth.ts)