# Repository Guide

## Spec Driven Development Workflow

- This repository uses the local `/spec` and `/spec-impl` skills in `.agents/skills/`; both require explicit invocation.
- Use `/spec` before a substantial feature. It writes a `Draft` specification under `specs/`; only a human may change its status to `Approved`/`Aprobado`.
- `/spec-impl` accepts only an approved spec, implements one plan step at a time, and never commits automatically. Its default `AutoCreateBranch: true` creates `spec-NN-slug`; set `specs/.spec-config.yml` to `false` to require branch confirmation.

## Run and Verify

- There is no package manifest, build step, test suite, linter, or CI. Serve `src/` as static files and verify the game in a browser.
- Manually check start/restart, arrow-key movement, dot collection and win state, ghost collision/lives/loss state, and the row-14 tunnel wrap.

## Architecture

- `src/index.html` is the entrypoint. Scripts must remain ordered `maze.js`, `game.js`, `render.js`, `main.js`: they communicate through browser globals on `window`.
- `maze.js` owns the immutable `MAZE` template and layout constants; `game.js` must mutate only the per-game `game.grid` copy so restarts restore dots.
- The maze is a 28x31 tile grid: `0` empty, `1` wall, `2` dot, `3` ghost-pen door. Keep tunnel behavior restricted to `TUNNEL_ROW` (14) through `canMove()` and `wrapTunnel()`.
