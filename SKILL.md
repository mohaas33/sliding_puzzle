---
name: shards-of-time
description: Sliding puzzle game. Use this skill for all tasks on this project.
---

# Shards of Time — Quick Reference

## What this is

5×5 sliding puzzle game, historical theme, React+Vite web app, monorepo.
Live at: https://mohaas33.github.io/sliding_puzzle/

## Key files

- apps/web/src/App.tsx — ALL game UI and state (single file)
- apps/web/src/utils/narration.ts — TTS narration utility
- apps/web/public/images/egypt/ — 8 puzzle images (01-08)
- packages/game-logic/src/puzzle.ts — Core logic (shuffle, move, solve)
- packages/game-logic/src/index.ts — Exports

## Architecture decisions (do not change)

- Game state lives entirely in App.tsx React state + localStorage
- No backend yet — all client-side
- Images served from /public, referenced as /images/egypt/XX.jpg
- npm workspaces monorepo — run commands with -w flag

## Current features (already built, do not rebuild)

- 5×5/4×4/3×3 difficulty switching
- Multi-tile sliding (whole row/column moves)
- Chapter map with 8 puzzles, lock/unlock progression
- Win screen with lore, stars, moves, timer
- Hint + Step (3 uses) assistance
- Text-to-speech narration (Web Speech API)
- Start screen with voice/difficulty selection
- localStorage save/restore
- GitHub Actions → GitHub Pages deployment

## Deploy

git add -A && git commit -m "message" && git push
(GitHub Actions auto-deploys to gh-pages branch)

## Test game logic

npm test -w packages/game-logic
