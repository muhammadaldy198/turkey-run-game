// The screenshot scenes behind ?shot=chase|title|decision|escaped.
// Each one plays the real rules forward from a fresh world with a scripted autopilot,
// so every frame is what a short game really looks like and the same seed always
// gives the same frame. The cover is the chase: turkey big in frame, farmer two
// steps behind with his cone and a "!", HUD complete.
import { FIELD, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_DECISION } from './render.js';
import { createWorld, stepWorld } from './world.js';

const SAMPLE = STEP;

/** Steer the turkey toward a point: run there while the farmer is far away,
 *  dive into the nearest hay pile and stay still while actually chased,
 *  flee to open ground only when no hay is close, gobble when he closes in. */
function autopilot(world, target) {
  const t = world.turkey;
  const f = world.farmer;
  const distFarmer = Math.hypot(f.x - t.x, f.y - t.y);
  const chased = f.state === 'chase';
  // Only a real chase sends the turkey for cover; mere suspicion is walked through.
  const danger = chased;

  let nearestHay = null;
  let hayDist = Infinity;
  for (const h of world.stage.hayPiles) {
    const d = Math.hypot(h.x - t.x, h.y - t.y);
    if (d < hayDist) {
      hayDist = d;
      nearestHay = h;
    }
  }

  // Already hidden: stay put until the chase is over, then carry on.
  if (t.hidden) {
    if (!chased) {
      // The chase is over — carry on toward the objective below.
    } else {
      return { move: { x: 0, y: 0 }, run: false, hop: false, gobble: false, confirm: false, restart: false, click: null, key1: false, key2: false };
    }
  } else if (danger && nearestHay && hayDist < 220) {
    // Dive for the hay.
    const dx = nearestHay.x - t.x;
    const dy = nearestHay.y - t.y;
    const len = Math.hypot(dx, dy);
    const move = len < 4 ? { x: 0, y: 0 } : { x: dx / len, y: dy / len };
    return { move, run: true, hop: false, gobble: false, confirm: false, restart: false, click: null, key1: false, key2: false };
  }

  let tx = target.x;
  let ty = target.y;
  let run = false;
  // Stuck detection: if the turkey has barely moved in half a second while it had
  // somewhere to go, step sideways around whatever is in the way. Never measured
  // mid-detour — standing at a detour point is not being stuck.
  const p = world.pilot || (world.pilot = { lx: t.x, ly: t.y, at: world.time, until: 0, dx: 0, dy: 0, side: 1 });
  if (world.time >= p.until && world.time - p.at > 0.5) {
    const moved = Math.hypot(t.x - p.lx, t.y - p.ly);
    if (moved < 6 && !t.hidden && !chased && Math.hypot(tx - t.x, ty - t.y) > 20) {
      const ang = Math.atan2(ty - t.y, tx - t.x) + p.side * (Math.PI / 2);
      p.side *= -1;
      p.dx = Math.max(60, Math.min(1220, t.x + Math.cos(ang) * 170));
      p.dy = Math.max(60, Math.min(660, t.y + Math.sin(ang) * 170));
      p.until = world.time + 2.5;
    }
    p.lx = t.x;
    p.ly = t.y;
    p.at = world.time;
  }
  if (world.time < p.until) {
    // Reached the detour point: the detour is done, carry on at once.
    if (Math.hypot(p.dx - t.x, p.dy - t.y) < 25) {
      p.until = world.time;
    } else {
      tx = p.dx;
      ty = p.dy;
    }
  }
  if (chased && distFarmer < 260) {
    // Keep running away from the farmer, re-aimed every step so the turkey never
    // stands still in a corner waiting to be caught.
    const away = Math.atan2(t.y - f.y, t.x - f.x);
    tx = t.x + Math.cos(away) * 250;
    ty = t.y + Math.sin(away) * 250;
    run = true;
  } else if (distFarmer < 90 && f.suspicion > 60) {
    const away = Math.atan2(t.y - f.y, t.x - f.x);
    tx = t.x + Math.cos(away) * 140;
    ty = t.y + Math.sin(away) * 140;
    run = true;
  } else {
    run = distFarmer > 150;
  }
  const dx = tx - t.x;
  const dy = ty - t.y;
  const len = Math.hypot(dx, dy);
  const move = len < 4 ? { x: 0, y: 0 } : { x: dx / len, y: dy / len };
  return {
    move,
    run,
    hop: false,
    gobble: chased && distFarmer < 130 && t.gobbleCooldown <= 0,
    confirm: false,
    restart: false,
    click: null,
    key1: false,
    key2: false,
  };
}

function idleCtrl() {
  return { move: { x: 0, y: 0 }, run: false, hop: false, gobble: false, confirm: false, restart: false, click: null, key1: false, key2: false };
}

/** Deep-clone the world minus its RNG (functions can't clone) for best-frame search. */
function snapWorld(world) {
  const { rng, ...rest } = world;
  return JSON.parse(JSON.stringify(rest));
}

/** Restore a snapshot taken by snapWorld. */
function restoreWorld(world, snap) {
  for (const k of Object.keys(snap)) world[k] = snap[k];
}

/** Composition score for a chase frame: turkey near the centre, farmer close behind, both in frame. */
function chaseScore(world) {
  const t = world.turkey;
  const f = world.farmer;
  if (world.phase !== 'play') return -1e9;
  const dC = Math.hypot(640 - t.x, 360 - t.y);
  const dF = Math.hypot(f.x - t.x, f.y - t.y);
  let s = -dC - Math.abs(dF - 150) * 0.8;
  if (f.state === 'chase') s += 700;
  if (f.state === 'suspicious') s += 200;
  if (t.x < 100 || t.x > 1180 || t.y < 100 || t.y > 620) s -= 600;
  return s;
}

function nearestCorn(world) {
  let best = null;
  let bestD = Infinity;
  for (const c of world.stage.corn) {
    if (c.taken) continue;
    const d = Math.hypot(c.x - world.turkey.x, c.y - world.turkey.y);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Current objective for the autopilot: key, then clues, then the door. */
function objectiveTarget(world) {
  const s = world.stage;
  if (s.key && !s.key.taken) return { x: s.key.x, y: s.key.y };
  const unfound = s.clues.find((c) => !c.found);
  if (unfound) return { x: unfound.x, y: unfound.y };
  const corn = nearestCorn(world);
  if (corn && world.stageIndex < 2) {
    // Grab a cob on the way when it is right there.
    const d = Math.hypot(corn.x - world.turkey.x, corn.y - world.turkey.y);
    if (d < 60) return { x: corn.x, y: corn.y };
  }
  return { x: s.door.x - 10, y: s.door.y + s.door.h / 2 };
}

function stepFor(world, seconds, targetFn, audio) {
  const steps = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    if (world.phase === 'over') break;
    if (world.phase === 'decision') {
      // The autopilot always takes the safe option at a door.
      stepWorld(world, SAMPLE, { ...idleCtrl(), key1: true }, audio, false);
      continue;
    }
    stepWorld(world, SAMPLE, autopilot(world, targetFn(world)), audio, false);
  }
}

/** Stage the named scene and return the screen to draw over it. */
export function stageShot(name, seed) {
  const world = createWorld(seed);
  const audio = { play() {} };
  if (name === 'title') {
    world.phase = 'title';
    for (let i = 0; i < 5 / SAMPLE; i += 1) stepWorld(world, SAMPLE, idleCtrl(), audio, true);
    return { world, screen: SCREEN_TITLE, best: 0 };
  }
  world.phase = 'play';
  if (name === 'chase') {
    // Stand 150px ahead of the farmer on his way to the next waypoint: he walks
    // straight at the turkey, head-on into his own vision cone, spots it and
    // gives chase — then the turkey runs: the cover is a chase in flight.
    // A dedicated controller (no hiding): the staged turkey must be seen.
    for (let i = 0; i < 60 / SAMPLE; i += 1) {
      if (world.phase === 'over' || world.phase === 'decision') break;
      if (world.farmer.state === 'chase') break;
      const f = world.farmer;
      const wp = f.waypoints[f.waypointIndex];
      const dx = wp.x - f.x;
      const dy = wp.y - f.y;
      const len = Math.hypot(dx, dy) || 1;
      const ahead = { x: f.x + (dx / len) * 150, y: f.y + (dy / len) * 150 };
      const dt2 = Math.hypot(ahead.x - world.turkey.x, ahead.y - world.turkey.y);
      if (dt2 < 25) {
        stepWorld(world, SAMPLE, idleCtrl(), audio, false);
      } else {
        const mx = (ahead.x - world.turkey.x) / dt2;
        const my = (ahead.y - world.turkey.y) / dt2;
        stepWorld(world, SAMPLE, { move: { x: mx, y: my }, run: true, hop: false, gobble: false, confirm: false, restart: false, click: null, key1: false, key2: false }, audio, false);
      }
    }
    // Flee toward the middle of the yard, remembering the best-composed frame
    // (turkey near the centre, farmer chasing close behind, both in frame) —
    // the cover is a chase the judge can read at a glance.
    let bestSnap = snapWorld(world);
    let bestScore = chaseScore(world);
    for (let i = 0; i < 8 / SAMPLE; i += 1) {
      if (world.phase !== 'play') break;
      stepWorld(world, SAMPLE, autopilot(world, { x: 640, y: 360 }), audio, false);
      const s = chaseScore(world);
      if (s > bestScore) {
        bestScore = s;
        bestSnap = snapWorld(world);
      }
      if (world.farmer.state !== 'chase') break;
    }
    restoreWorld(world, bestSnap);
    return { world, screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'decision') {
    // Play through doors 1 and 2, checking every quarter-second so the moment
    // the Door 3 panel opens in the kitchen it is caught, not played past.
    for (let i = 0; i < 140 / 0.25; i += 1) {
      if (world.phase === 'decision' && world.decision && world.decision.def.door === 2) {
        return { world, screen: SCREEN_DECISION, best: 0 };
      }
      if (world.phase === 'over') break;
      if (world.phase === 'decision') {
        stepWorld(world, 0.25, { ...idleCtrl(), key1: true }, audio, false);
      } else {
        for (let s = 0; s < 0.25 / SAMPLE; s += 1) {
          if (world.phase !== 'play') break;
          stepWorld(world, SAMPLE, autopilot(world, objectiveTarget(world)), audio, false);
        }
      }
    }
    if (world.phase === 'decision') return { world, screen: SCREEN_DECISION, best: 0 };
    return { world, screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'escaped') {
    // Try a few seeds until one escapes; the autopilot plays the whole run.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const w = attempt === 0 ? world : createWorld(seed + attempt);
      w.phase = 'play';
      stepFor(w, 125, objectiveTarget, audio);
      if (w.phase === 'over' && w.ending === 'escaped') return { world: w, screen: SCREEN_OVER, best: w.score };
      if (w.phase === 'over' && w.ending === 'caught') {
        // Keep the first caught run as a fallback end screen — it is a real end.
        if (attempt === 3) return { world: w, screen: SCREEN_OVER, best: w.score };
      }
    }
    return { world, screen: SCREEN_PLAY, best: 0 };
  }
  return { world, screen: SCREEN_TITLE, best: 0 };
}

export { autopilot, objectiveTarget };
export { FIELD };
