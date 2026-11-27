// Constants for GOBBLE OR GONE: 3 Doors to Dawn — one turkey, one farmer, one dinner bell.
// Everything the other modules agree on lives here so the numbers are in one place.
export const BEST_KEY = 'gobble-or-gone-best';
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const TIMER_TOTAL = 120;
export const DINNER_RUSH_SECONDS = 20;
export const DECISION_SECONDS = 5;

export const TURKEY = {
  radius: 16,
  walkSpeed: 175,
  runSpeed: 265,
  hopSpeed: 330,
  hopSeconds: 0.35,
  hopCooldown: 3,
  gobbleCooldown: 8,
  gobbleScareSeconds: 2,
  gobbleRange: 300,
  hearRunRange: 230,
};

export const FARMER = {
  radius: 20,
  patrolSpeed: 92,
  chaseSpeed: 205,
  searchSpeed: 120,
  fleeSpeed: 150,
  visionRange: 265,
  visionHalfAngle: 0.75,
  suspicionPerSecondCentre: 95,
  suspicionPerSecondEdge: 30,
  suspicionDecayPerSecond: 22,
  chaseMemorySeconds: 2.5,
  searchSeconds: 3,
  catchRadius: 30,
};

export const STAGE_NAMES = ['MAPLE FARM YARD', 'THE OLD BARN', 'THE FARMHOUSE KITCHEN'];
export const STAGE_SUBTITLES = [
  'Door 1 of 3 — find the hay key',
  'Door 2 of 3 — crack the 3-number code',
  'Door 3 of 3 — past the oven, out the window',
];

// Autumn palette: burnt orange, harvest gold, deep green, barn red, cream.
export const PALETTE = {
  grass: '#7da05c',
  grassDark: '#6b8f4e',
  dirt: '#b98a56',
  dirtDark: '#a1763f',
  barnWood: '#8a5a33',
  barnWoodDark: '#6f4525',
  barnRed: '#a63d2f',
  barnRedDark: '#7e2c22',
  hay: '#e3b93e',
  hayDark: '#c79a2a',
  pumpkin: '#e07b28',
  pumpkinDark: '#b85f16',
  kitchenFloor: '#c9a06b',
  kitchenTile: '#b78d55',
  oven: '#4a4a52',
  ovenGlow: '#ff7a1a',
  knife: '#dfe6ea',
  knifeHandle: '#5a3a22',
  turkeyBody: '#8a5a2e',
  turkeyDark: '#6b4423',
  turkeyHead: '#c98a4b',
  turkeyWattle: '#c0392b',
  turkeyBeak: '#e8a33d',
  turkeyFeather: '#5d3a1a',
  farmerShirt: '#3e6b8e',
  farmerOveralls: '#2e4a68',
  farmerHat: '#d9b23c',
  farmerSkin: '#e8b98a',
  cream: '#f7ead0',
  ink: '#2b1d12',
  gold: '#f2c14e',
  danger: '#c0392b',
  safe: '#2e7d32',
};
