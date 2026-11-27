// The world: one run of the game — state, the step function, collisions, pickups,
// the oven and the falling knives, the dinner-bell timer, doors, decisions and the
// win/lose conditions. It knows nothing about the DOM except the input object it is
// handed, so the same code runs in the browser and in a headless test.
import { FIELD, STEP, TIMER_TOTAL, FARMER, TURKEY } from './config.js';
import { createRandom } from './random.js';
import { buildStage, circleHitsRect, segmentBlocked } from './stages.js';
import { createTurkey, stepTurkey, updateHidden, tryGobble, loseFeather } from './turkey.js';
import { createFarmer, stepFarmer, canSee, scareFarmer } from './farmer.js';
import { createDecision, updateDecision } from './decisions.js';
import { allCluesFound, cluesFoundCount } from './puzzles.js';

export const EVENT_NONE = 0;

export function createWorld(seed) {
  const rng = createRandom(seed);
  const stage = buildStage(0, rng);
  const world = {
    seed,
    rng,
    stageIndex: 0,
    stage,
    turkey: createTurkey(stage.spawn.x, stage.spawn.y),
    farmer: createFarmer(stage.farmerWaypoints, stage.farmerSpawn.x, stage.farmerSpawn.y),
    cornCount: 0,
    scoreBonus: 0,
    score: 0,
    distance: 0,
    timeLeft: TIMER_TOTAL,
    time: 0,
    phase: 'title',
    ending: null,
    caughtReason: '',
    goldenCount: 0,
    objective: '',
    flash: '',
    flashColor: '#f2c14e',
    flashTimer: 0,
    decision: null,
    nextStageFarmerSuspicion: 0,
    nextStageFarmerChase: false,
    nextStageFarmerFar: false,
    windowSprint: false,
    windowSprintTimer: 0,
    knives: [],
    knifeTimer: 2,
    ovenBurn: 0,
    escapeBonus: 0,
  };
  world.objective = objectiveFor(world);
  return world;
}

export function resetWorld(world, seed) {
  const fresh = createWorld(seed ?? world.seed);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
}

function objectiveFor(world) {
  const s = world.stage;
  if (s.index === 0) {
    return s.key.taken ? 'Key found — open DOOR 1, the farm gate.' : 'Find the HAY KEY behind the big hay bale, top right.';
  }
  if (s.index === 1) {
    const found = cluesFoundCount(s.clues);
    if (allCluesFound(s.clues)) return 'Code found — open DOOR 2, the barn lock.';
    return `Find the code clues: nest, pumpkins, clock (${found}/3 found).`;
  }
  if (s.key && !s.key.taken) return 'Find the DRAWER KEY — mind the burning oven.';
  if (world.windowSprint || world.decision) return 'Out the WINDOW — run!';
  return 'Open the WINDOW — run for the dawn!';
}

function setFlash(world, text, color) {
  world.flash = text;
  world.flashColor = color || '#f2c14e';
  world.flashTimer = 2.2;
}

/** Push a circle out of one rectangle along the shortest exit. */
function pushOutRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return [x, y];
  if (d2 > 0.0001) {
    const d = Math.sqrt(d2);
    const push = (r - d) / d;
    return [x + dx * push, y + dy * push];
  }
  // Centre inside the rectangle: leave along the smallest penetration.
  const left = x - rect.x;
  const right = rect.x + rect.w - x;
  const top = y - rect.y;
  const bottom = rect.y + rect.h - y;
  const m = Math.min(left, right, top, bottom);
  if (m === left) return [rect.x - r, y];
  if (m === right) return [rect.x + rect.w + r, y];
  if (m === top) return [x, rect.y - r];
  return [x, rect.y + rect.h + r];
}

/** Resolve a circle's position against the stage's solids (walls, and low obstacles
 *  unless hopping over them). Two passes so corners between two rects settle. */
function resolveCircle(world, x, y, r, hopping) {
  for (let pass = 0; pass < 2; pass += 1) {
    for (const w of world.stage.walls) {
      [x, y] = pushOutRect(x, y, r, w);
    }
    if (!hopping) {
      for (const l of world.stage.low) {
        [x, y] = pushOutRect(x, y, r, l);
      }
    }
  }
  return { x, y };
}

function inHay(world, x, y) {
  for (const h of world.stage.hayPiles) {
    if (x > h.x - h.w / 2 && x < h.x + h.w / 2 && y > h.y - h.h / 2 && y < h.y + h.h / 2) return true;
  }
  return false;
}

function nearDoor(world) {
  const d = world.stage.door;
  const t = world.turkey;
  return t.x > d.x - 26 && t.x < d.x + d.w + 10 && t.y > d.y - 10 && t.y < d.y + d.h + 10;
}

function doorReady(world) {
  const s = world.stage;
  if (s.index === 0) return s.key.taken;
  if (s.index === 1) return true;
  return s.key.taken;
}

function advanceStage(world) {
  world.stageIndex += 1;
  world.stage = buildStage(world.stageIndex, world.rng);
  const s = world.stage;
  world.turkey.x = s.spawn.x;
  world.turkey.y = s.spawn.y;
  world.turkey.invulnerable = 1;
  world.farmer = createFarmer(s.farmerWaypoints, s.farmerSpawn.x, s.farmerSpawn.y);
  if (world.nextStageFarmerSuspicion > 0) {
    world.farmer.suspicion = world.nextStageFarmerSuspicion;
    world.nextStageFarmerSuspicion = 0;
  }
  if (world.nextStageFarmerChase) {
    world.farmer.state = 'chase';
    world.farmer.lastSeenX = s.spawn.x;
    world.farmer.lastSeenY = s.spawn.y;
    world.farmer.lastSeenTime = world.time;
    world.nextStageFarmerChase = false;
  }
  if (world.nextStageFarmerFar) {
    const far = s.farmerWaypoints[s.farmerWaypoints.length - 1];
    world.farmer.x = far.x;
    world.farmer.y = far.y;
    world.nextStageFarmerFar = false;
  }
  world.knives = [];
  world.knifeTimer = 2;
  world.objective = objectiveFor(world);
}

function endRun(world, ending, reason) {
  world.phase = 'over';
  world.ending = ending;
  world.caughtReason = reason || '';
  if (ending === 'escaped') {
    world.escapeBonus = Math.floor(world.timeLeft) * 5;
  }
}

function catchTurkey(world, audio) {
  const t = world.turkey;
  if (t.invulnerable > 0) return;
  const result = loseFeather(t);
  if (audio) audio.play('hit');
  if (result === 'caught') {
    endRun(world, 'caught', 'The farmer caught the turkey with no feathers left. Dinner is served.');
  } else {
    setFlash(world, 'LUCKY ESCAPE — the farmer only got a tail feather!', '#f2c14e');
    t.x = world.stage.spawn.x;
    t.y = world.stage.spawn.y;
    world.farmer.state = 'patrol';
    world.farmer.suspicion = 0;
    world.farmer.x = world.stage.farmerSpawn.x;
    world.farmer.y = world.stage.farmerSpawn.y;
  }
}

/**
 * One fixed step. `ctrl` is { move:{x,y}, run, hop, gobble, confirm, restart, click }.
 * `demo` runs the title-screen attract mode: no timer, no catches.
 */
export function stepWorld(world, dt, ctrl, audio, demo) {
  if (world.phase === 'over') return;
  world.time += dt;

  if (world.flashTimer > 0) {
    world.flashTimer -= dt;
    if (world.flashTimer <= 0) world.flash = '';
  }

  // The farmer keeps patrolling behind the title screen.
  if (world.phase === 'title') {
    const sense = { seen: false, dist: 9999, turkeyX: world.turkey.x, turkeyY: world.turkey.y, heardRun: false, gobble: false, dinnerRush: false };
    stepFarmer(world.farmer, dt, sense, (x, y) => resolveCircle(world, x, y, FARMER.radius - 2, false), world.time);
    return;
  }

  if (world.phase === 'decision' && world.decision) {
    updateDecision(world.decision, dt);
    // Click or keys 1/2 choose.
    if (ctrl.click) {
      const picked = pickOptionAt(world.decision, ctrl.click.x, ctrl.click.y);
      if (picked) world.decision.chosen = picked;
    }
    if (ctrl.key1) {
      const opt = world.decision.def.options[0];
      if (!opt.disabled) world.decision.chosen = opt;
    }
    if (ctrl.key2) {
      const opt = world.decision.def.options[1];
      if (!opt.disabled) world.decision.chosen = opt;
    }
    if (world.decision.chosen) {
      const chosen = world.decision.chosen;
      const doorIndex = world.decision.def.door;
      chosen.apply(world);
      if (audio) audio.play('door');
      world.decision = null;
      world.phase = 'play';
      if (doorIndex === 2) {
        world.stage.door.open = true;
        setFlash(world, 'THE WINDOW IS OPEN — RUN!', '#7dd87d');
      } else {
        advanceStage(world);
        setFlash(world, doorIndex === 0 ? 'DOOR 1 OPEN — INTO THE BARN!' : 'DOOR 2 OPEN — INTO THE KITCHEN!', '#7dd87d');
      }
      world.objective = objectiveFor(world);
    }
    return;
  }

  if (world.phase !== 'play') return;

  // Dinner-bell timer.
  if (!demo) {
    world.timeLeft -= dt;
    if (world.timeLeft <= 0) {
      world.timeLeft = 0;
      endRun(world, 'caught', 'The dinner bell rang. Dinner is served at noon.');
      if (audio) audio.play('bell');
      return;
    }
  }
  const dinnerRush = world.timeLeft <= 20 && !demo;

  // The turkey.
  const beforeX = world.turkey.x;
  const beforeY = world.turkey.y;
  const hopped = stepTurkey(
    world.turkey,
    dt,
    ctrl.move,
    ctrl.run,
    ctrl.hop,
    (x, y, hopping) => resolveCircle(world, x, y, TURKEY.radius - 2, hopping),
  );
  if (hopped && audio) audio.play('hop');
  world.distance += Math.hypot(world.turkey.x - beforeX, world.turkey.y - beforeY) / 10;
  updateHidden(world.turkey, inHay(world, world.turkey.x, world.turkey.y));

  if (ctrl.gobble && tryGobble(world.turkey)) {
    scareFarmer(world.farmer);
    if (audio) audio.play('gobble');
    setFlash(world, 'GOBBLE! The farmer is scared off!', '#7dd87d');
  }

  // The farmer.
  const seen = canSee(world.farmer, world.turkey, (x1, y1, x2, y2) => segmentBlocked(x1, y1, x2, y2, world.stage.walls));
  const dist = Math.hypot(world.turkey.x - world.farmer.x, world.turkey.y - world.farmer.y);
  const heardRun = world.turkey.running && dist < TURKEY.hearRunRange;
  const events = stepFarmer(
    world.farmer,
    dt,
    {
      seen,
      dist,
      turkeyX: world.turkey.x,
      turkeyY: world.turkey.y,
      heardRun,
      gobble: false,
      dinnerRush,
    },
    (x, y) => resolveCircle(world, x, y, FARMER.radius - 2, false),
    world.time,
  );
  if (events & 1) {
    if (audio) audio.play('spotted');
    setFlash(world, 'SPOTTED! RUN!', '#ff6b4a');
  }

  // Caught?
  if (dist < FARMER.catchRadius && !world.turkey.hidden && world.turkey.invulnerable <= 0) {
    catchTurkey(world, audio);
    if (world.phase === 'over') return;
  }

  // Corn.
  for (const c of world.stage.corn) {
    if (!c.taken && Math.hypot(c.x - world.turkey.x, c.y - world.turkey.y) < 30) {
      c.taken = true;
      world.cornCount += 1;
      if (audio) audio.play('pickup');
    }
  }
  // Key.
  const key = world.stage.key;
  if (key && !key.taken && Math.hypot(key.x - world.turkey.x, key.y - world.turkey.y) < 34) {
    key.taken = true;
    if (audio) audio.play('key');
    setFlash(world, `${key.label} FOUND!`, '#f2c14e');
    world.objective = objectiveFor(world);
  }
  // Golden feather.
  const gf = world.stage.goldenFeather;
  if (gf && !gf.taken && Math.hypot(gf.x - world.turkey.x, gf.y - world.turkey.y) < 32) {
    gf.taken = true;
    world.goldenCount += 1;
    if (audio) audio.play('clue');
    setFlash(world, `GOLDEN FEATHER ${world.goldenCount}/3!`, '#f2c14e');
  }
  // Clues.
  for (const clue of world.stage.clues) {
    if (!clue.found && Math.hypot(clue.x - world.turkey.x, clue.y - world.turkey.y) < 42) {
      clue.found = true;
      if (audio) audio.play('clue');
      setFlash(world, `CLUE: ${clue.text}`, '#f2c14e');
      world.objective = objectiveFor(world);
    }
  }

  // The oven burns.
  const oven = world.stage.oven;
  if (oven) {
    const inOven = circleHitsRect(world.turkey.x, world.turkey.y, TURKEY.radius, { x: oven.x - 6, y: oven.y - 6, w: oven.w + 12, h: oven.h + 12 });
    if (inOven && world.turkey.invulnerable <= 0) {
      world.ovenBurn += dt;
      if (world.ovenBurn > 0.8) {
        world.ovenBurn = 0;
        catchTurkey(world, audio);
        setFlash(world, 'THE OVEN BURNS! A feather is gone!', '#ff6b4a');
        if (world.phase === 'over') return;
      }
    } else {
      world.ovenBurn = 0;
    }
  }

  // Falling carving knives (kitchen only).
  if (world.stage.knifeSpots.length > 0) {
    world.knifeTimer -= dt;
    if (world.knifeTimer <= 0) {
      world.knifeTimer = 2.2;
      const spot = world.stage.knifeSpots[Math.floor(world.rng.next() * world.stage.knifeSpots.length)];
      world.knives.push({ x: spot.x, y: spot.y, state: 'warn', timer: 0.8 });
    }
    for (const k of world.knives) {
      k.timer -= dt;
      if (k.state === 'warn' && k.timer <= 0) {
        k.state = 'fall';
        k.timer = 0.15;
      } else if (k.state === 'fall' && k.timer <= 0) {
        k.state = 'stuck';
        k.timer = 2;
        if (Math.hypot(k.x - world.turkey.x, k.y - world.turkey.y) < 30 && world.turkey.invulnerable <= 0 && world.turkey.hopTimer <= 0) {
          catchTurkey(world, audio);
          setFlash(world, 'THE CARVING KNIFE! A feather is gone!', '#ff6b4a');
          if (world.phase === 'over') return;
        }
      } else if (k.state === 'stuck' && k.timer <= 0) {
        k.state = 'gone';
      }
    }
    world.knives = world.knives.filter((k) => k.state !== 'gone');
  }

  // The window sprint.
  if (world.windowSprint) {
    world.windowSprintTimer -= dt;
    if (world.windowSprintTimer <= 0) world.windowSprint = false;
  }

  // The escape: reach the window once it is open. Checked before the door so a
  // turkey standing at an open door escapes instead of re-opening the panel.
  const esc = world.stage.escape;
  if (esc && world.stage.door.open && Math.hypot(esc.x - world.turkey.x, esc.y - world.turkey.y) < 44) {
    endRun(world, 'escaped', '');
    if (audio) audio.play('escaped');
    return;
  }

  // The door: requirements met + turkey at the door = the decision panel.
  // Only while the door is still shut — an open door never asks twice.
  if (nearDoor(world) && doorReady(world) && !world.stage.door.open && world.phase === 'play') {
    world.decision = createDecision(world.stage.index, world);
    world.phase = 'decision';
    if (audio) audio.play('bell');
    return;
  }

  // Score: corn + bonus + distance + escape bonus.
  world.score = world.cornCount * 10 + world.scoreBonus + Math.floor(world.distance) + world.escapeBonus;
}

/** Which decision option (if any) sits under a click, in screen coordinates. */
export function pickOptionAt(decision, x, y) {
  const boxes = optionBoxes(decision);
  for (let i = 0; i < boxes.length; i += 1) {
    const b = boxes[i];
    const opt = decision.def.options[i];
    if (!opt.disabled && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return opt;
  }
  return null;
}

/** The two option boxes, laid out by the renderer — shared so clicks line up. */
export function optionBoxes(decision) {
  const panelX = FIELD.width / 2 - 430;
  const panelY = 190;
  return [
    { x: panelX + 24, y: panelY + 96, w: 390, h: 150 },
    { x: panelX + 446, y: panelY + 96, w: 390, h: 150 },
  ];
}
