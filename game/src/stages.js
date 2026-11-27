// The three stages: farmyard, barn, kitchen — each harder than the last, each hand-placed.
// Walls are solid rectangles, hay hides, low obstacles can be hopped, the oven burns and
// the carving knives fall on a telegraph. Corn, keys, clues and the golden feather are
// placed where the screenshots need them to be.
import { FIELD } from './config.js';

function wall(x, y, w, h) {
  return { x, y, w, h };
}

function hay(x, y, w, h) {
  return { x, y, w, h };
}

function cornAt(rng, spots) {
  return spots.map(([x, y]) => ({ x, y, taken: false }));
}

/** Stage 0 — MAPLE FARM YARD. The key hides behind the big hay bale, top right. */
export function buildFarmyard(rng) {
  return {
    index: 0,
    ground: 'yard',
    spawn: { x: 110, y: 610 },
    farmerSpawn: { x: 640, y: 300 },
    farmerWaypoints: [
      { x: 420, y: 240 },
      { x: 860, y: 240 },
      { x: 860, y: 480 },
      { x: 420, y: 480 },
    ],
    walls: [
      wall(0, 0, FIELD.width, 36),
      wall(0, FIELD.height - 36, FIELD.width, 36),
      wall(0, 0, 36, FIELD.height),
      wall(FIELD.width - 36, 0, 36, FIELD.height),
      wall(280, 120, 180, 46),
      wall(980, 560, 180, 46),
      wall(560, 560, 46, 110),
    ],
    low: [
      { x: 180, y: 420, w: 120, h: 40 },
      { x: 620, y: 140, w: 120, h: 40 },
    ],
    hayPiles: [
      hay(1020, 120, 130, 80),
      hay(120, 300, 110, 70),
      hay(700, 590, 120, 70),
    ],
    pumpkins: [
      { x: 240, y: 450, r: 16 },
      { x: 270, y: 470, r: 12 },
      { x: 1010, y: 200, r: 14 },
    ],
    corn: cornAt(rng, [
      [220, 140], [420, 330], [640, 150], [760, 330], [940, 560],
      [180, 560], [1120, 420], [520, 470],
    ]),
    key: { x: 1085, y: 160, taken: false, label: 'HAY KEY' },
    goldenFeather: { x: 90, y: 90, taken: false },
    door: { x: FIELD.width - 36, y: 320, w: 36, h: 90, label: 'DOOR 1', open: false },
    clues: [],
    oven: null,
    knifeSpots: [],
    escape: null,
  };
}

/** Stage 1 — THE OLD BARN. No physical key: the door has a 3-number code lock.
 *  The numbers come from three clues: eggs in the nest, pumpkins, the wall clock. */
export function buildBarn(rng) {
  return {
    index: 1,
    ground: 'barn',
    spawn: { x: 110, y: 610 },
    farmerSpawn: { x: 700, y: 360 },
    farmerWaypoints: [
      { x: 340, y: 200 },
      { x: 940, y: 200 },
      { x: 940, y: 540 },
      { x: 340, y: 540 },
    ],
    walls: [
      wall(0, 0, FIELD.width, 36),
      wall(0, FIELD.height - 36, FIELD.width, 36),
      wall(0, 0, 36, FIELD.height),
      wall(FIELD.width - 36, 0, 36, FIELD.height),
      wall(180, 120, 46, 220),
      wall(600, 580, 46, 90),
      wall(1060, 120, 46, 220),
      wall(420, 440, 220, 40),
    ],
    low: [
      { x: 420, y: 220, w: 130, h: 40 },
      { x: 760, y: 480, w: 130, h: 40 },
    ],
    hayPiles: [
      hay(180, 150, 120, 70),
      hay(1080, 480, 120, 70),
    ],
    pumpkins: [
      { x: 1150, y: 560, r: 16 },
      { x: 1180, y: 590, r: 12 },
      { x: 1120, y: 600, r: 12 },
      { x: 1160, y: 530, r: 11 },
      { x: 1080, y: 610, r: 12 },
      { x: 1130, y: 620, r: 11 },
      { x: 1190, y: 540, r: 12 },
    ],
    corn: cornAt(rng, [
      [200, 300], [420, 140], [640, 260], [820, 160], [1000, 340],
      [240, 560], [760, 620], [1120, 140],
    ]),
    key: null,
    goldenFeather: { x: 640, y: 90, taken: false },
    door: { x: FIELD.width - 36, y: 320, w: 36, h: 90, label: 'DOOR 2', open: false },
    clues: [
      { id: 'nest', x: 120, y: 130, label: 'NEST', text: 'NEST: 4 EGGS', value: 4, found: false },
      { id: 'pumpkins', x: 1150, y: 570, label: 'PUMPKINS', text: 'PUMPKINS: 7', value: 7, found: false },
      { id: 'clock', x: 1140, y: 110, label: 'CLOCK', text: 'CLOCK: 2 O\u2019CLOCK', value: 2, found: false },
    ],
    oven: null,
    knifeSpots: [],
    escape: null,
  };
}

/** Stage 2 — THE FARMHOUSE KITCHEN. The oven burns, carving knives fall from the
 *  table on a telegraph, the last key is in the drawer, the window is the way out. */
export function buildKitchen(rng) {
  return {
    index: 2,
    ground: 'kitchen',
    spawn: { x: 110, y: 610 },
    farmerSpawn: { x: 700, y: 300 },
    farmerWaypoints: [
      { x: 340, y: 220 },
      { x: 940, y: 220 },
      { x: 940, y: 520 },
      { x: 340, y: 520 },
    ],
    walls: [
      wall(0, 0, FIELD.width, 36),
      wall(0, FIELD.height - 36, FIELD.width, 36),
      wall(0, 0, 36, FIELD.height),
      wall(FIELD.width - 36, 0, 36, FIELD.height),
      wall(180, 120, 46, 180),
      wall(1020, 380, 46, 200),
    ],
    low: [
      { x: 460, y: 600, w: 150, h: 40 },
    ],
    hayPiles: [],
    pumpkins: [{ x: 220, y: 140, r: 15 }],
    corn: cornAt(rng, [
      [220, 300], [420, 140], [640, 260], [820, 160], [1000, 340],
      [240, 560], [760, 620], [1120, 420],
    ]),
    key: { x: 150, y: 95, taken: false, label: 'DRAWER KEY' },
    goldenFeather: { x: 1150, y: 120, taken: false },
    door: { x: FIELD.width - 36, y: 120, w: 36, h: 90, label: 'WINDOW', open: false },
    clues: [],
    oven: { x: 520, y: 560, w: 240, h: 110 },
    knifeSpots: [
      { x: 560, y: 330 },
      { x: 720, y: 420 },
      { x: 880, y: 300 },
    ],
    escape: { x: FIELD.width - 60, y: 165 },
  };
}

export function buildStage(index, rng) {
  if (index === 0) return buildFarmyard(rng);
  if (index === 1) return buildBarn(rng);
  return buildKitchen(rng);
}

/** Circle-vs-rectangle test used for walls and the oven. */
export function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

/** True when the segment (x1,y1)-(x2,y2) passes through any wall: line of sight is blocked. */
export function segmentBlocked(x1, y1, x2, y2, walls) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 8);
  for (let i = 1; i < steps; i += 1) {
    const x = x1 + ((x2 - x1) * i) / steps;
    const y = y1 + ((y2 - y1) * i) / steps;
    for (let w = 0; w < walls.length; w += 1) {
      const r = walls[w];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
    }
  }
  return false;
}
