# turkey-run-game

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![make.fun · turkey-run-game-01 rank](https://make.fun/badge/turkey-run-game-01/muhammadaldy198/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![make.fun · turkey-run-game-01 reward](https://make.fun/badge/turkey-run-game-01/muhammadaldy198/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**GOBBLE OR GONE: 3 Doors to Dawn** — a turkey escape game for the [turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01) bounty on make.fun.

One turkey. One farmer. One dinner bell. Escape through 3 doors — the farm yard, the old barn, the farmhouse kitchen — before the 120-second dinner bell rings.

## How to play

- **WASD / arrows** — move (walk slow and quiet, or hold **SHIFT** to run — loud)
- **SPACE** — gobble! Scares the farmer off for 2 seconds (8s cooldown)
- **E** — hop over hay bales, pumpkin patches and crates
- **Hide in the hay** — stand still in a hay pile and the farmer cannot see you
- **P** — pause · **R** — restart

The farmer patrols, gets suspicious (`?`), chases (`!`), searches your last-known spot, and corners you. His yellow vision cone is drawn on screen — if you can see it, he can see you. The first time he catches you he only gets a tail feather: you lose 1 of 3 feathers and escape by luck. With no feathers left, you are dinner.

Each door stops the game for a real choice (two named options, 5-second countdown):

1. **Door 1 — the farm gate:** SNEAK THROUGH THE HAY (slow, silent, +25) or DASH ACROSS THE YARD (fast, loud — the farmer starts the barn suspicious)
2. **Door 2 — the barn lock:** CRACK THE CODE (needs all 3 clues: nest eggs, pumpkins, clock) or SMASH THE LOCK (fast and loud — the farmer storms the kitchen already chasing)
3. **Door 3 — the kitchen window:** HIDE IN THE PANTRY (wait, but the bell keeps ticking) or RUN FOR THE WINDOW (past the burning oven and the falling carving knives)

Find all 3 hidden golden feathers for the Golden Feather ending.

## Run it

Static files, no build step, no network:

```sh
node serve.ts   # serves game/ on http://localhost:8080
```

Or open `game/index.html` from any static server. Screenshots are real renders of the game (`?shot=chase|title|decision|escaped&seed=1`, see `shots.json`).

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored `vendor/makefun-game.ts` library.

## License

MIT — see [LICENSE](LICENSE).
