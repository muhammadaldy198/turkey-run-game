// The decision panels: at each door the game pauses and offers two named options
// with a 5-second countdown. The choice is real — it changes the next stage —
// and it is paid for in the NEXT screenshot, not at the moment of choosing.
// Click an option, press 1 / 2, or let the countdown pick the safe option.
import { DECISION_SECONDS } from './config.js';
import { allCluesFound, codeFromClues } from './puzzles.js';

export function doorDecisions(doorIndex, world) {
  if (doorIndex === 0) {
    return {
      door: 0,
      title: 'DOOR 1 — THE FARM GATE',
      options: [
        {
          id: 'sneak',
          key: '1',
          name: 'SNEAK THROUGH THE HAY',
          detail: 'Slow and silent. Farmer stays calm. +25 corn bonus.',
          apply(w) {
            w.scoreBonus += 25;
            w.farmer.suspicion = 0;
          },
        },
        {
          id: 'dash',
          key: '2',
          name: 'DASH ACROSS THE YARD',
          detail: 'Fast but loud. The farmer starts the barn ALREADY suspicious.',
          apply(w) {
            w.nextStageFarmerSuspicion = 60;
          },
        },
      ],
    };
  }
  if (doorIndex === 1) {
    const clues = world.stage.clues;
    const code = codeFromClues(clues);
    return {
      door: 1,
      title: 'DOOR 2 — THE BARN LOCK',
      options: [
        {
          id: 'crack',
          key: '1',
          name: 'CRACK THE CODE',
          detail: allCluesFound(clues)
            ? `Silent. Code ${code} — the nest, the pumpkins, the clock. +25.`
            : 'Needs all 3 clues first. Find the nest, the pumpkins, the clock.',
          disabled: !allCluesFound(clues),
          apply(w) {
            w.scoreBonus += 25;
            w.farmer.suspicion = 0;
          },
        },
        {
          id: 'smash',
          key: '2',
          name: 'SMASH THE LOCK',
          detail: 'Fast and LOUD. The farmer storms the kitchen already chasing you.',
          apply(w) {
            w.nextStageFarmerChase = true;
          },
        },
      ],
    };
  }
  return {
    door: 2,
    title: 'DOOR 3 — THE KITCHEN WINDOW',
    options: [
      {
        id: 'pantry',
        key: '1',
        name: 'HIDE IN THE PANTRY',
        detail: 'Wait it out. The bell keeps ticking — 5 seconds gone — but the farmer walks away.',
        apply(w) {
          w.timeLeft = Math.max(0, w.timeLeft - 5);
          w.nextStageFarmerFar = true;
        },
      },
      {
        id: 'window',
        key: '2',
        name: 'RUN FOR THE WINDOW',
        detail: 'Now. Past the burning oven and the falling knives — 6 seconds of open floor.',
        apply(w) {
          w.windowSprint = true;
          w.windowSprintTimer = 6;
        },
      },
    ],
  };
}

export function createDecision(doorIndex, world) {
  const def = doorDecisions(doorIndex, world);
  return {
    def,
    countdown: DECISION_SECONDS,
    chosen: null,
    hover: -1,
  };
}

export function updateDecision(decision, dt) {
  if (decision.chosen) return;
  decision.countdown -= dt;
  if (decision.countdown <= 0) {
    // Timeout picks the safe option (the first one that is not disabled).
    const safe = decision.def.options.find((o) => !o.disabled) || decision.def.options[0];
    decision.chosen = safe;
  }
}
