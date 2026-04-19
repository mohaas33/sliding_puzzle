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
│   └── game-logic/        # shared puzzle engine (framework-agnostic TS)
├── apps/
│   ├── web/               # React + Vite
│   ├── api/               # Express backend
│   └── mobile/            # Expo (phase 2)
├── CLAUDE.md
└── package.json           # npm workspaces root

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