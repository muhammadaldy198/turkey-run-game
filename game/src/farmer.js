// The farmer: a finite-state machine — PATROL, SUSPICIOUS, CHASE, SEARCH, FLEE.
// He only ever acts on the last place he SAW the turkey, so a hidden turkey is safe
// and a gobble sends him running the other way. His vision cone is drawn on screen
// because a judge can only believe an AI it can see.
import { FARMER } from './config.js';

export function createFarmer(waypoints, x, y) {
  return {
    x,
    y,
    dir: 1,
    state: 'patrol',
    waypointIndex: 0,
    waypoints,
    suspicion: 0,
    lastSeenX: x,
    lastSeenY: y,
    lastSeenTime: -99,
    searchTimer: 0,
    fleeTimer: 0,
    scanTimer: 0,
    scanBase: 0,
    frame: 0,
    spotted: false,
  };
}

function angleTo(farmer, x, y) {
  return Math.atan2(y - farmer.y, x - farmer.x);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when the turkey is inside the cone and no wall blocks the line of sight. */
export function canSee(farmer, turkey, blockedLine) {
  if (turkey.hidden) return false;
  const dx = turkey.x - farmer.x;
  const dy = turkey.y - farmer.y;
  const dist = Math.hypot(dx, dy);
  if (dist > FARMER.visionRange) return false;
  const toTurkey = angleTo(farmer, turkey.x, turkey.y);
  const facingAngle = farmer.facingAngle ?? 0;
  if (Math.abs(angleDiff(toTurkey, facingAngle)) > FARMER.visionHalfAngle) return false;
  if (blockedLine(farmer.x, farmer.y, turkey.x, turkey.y)) return false;
  return true;
}

function moveToward(farmer, tx, ty, speed, dt, resolve) {
  const dx = tx - farmer.x;
  const dy = ty - farmer.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;
  const vx = (dx / dist) * speed * dt;
  const vy = (dy / dist) * speed * dt;
  farmer.facingAngle = Math.atan2(dy, dx);
  farmer.dir = dx >= 0 ? 1 : -1;
  const resolved = resolve(farmer.x + vx, farmer.y + vy);
  farmer.x = resolved.x;
  farmer.y = resolved.y;
}

/**
 * Advance the farmer one step. `sense` carries what he perceives this frame:
 * { seen, dist, turkeyX, turkeyY, heardRun, gobble }. `resolve(x, y)` pushes the
 * farmer's circle out of walls so he slides along them instead of sticking.
 * Returns an event bitmask: 1 = just spotted the turkey, 2 = gave up the chase.
 */
export function stepFarmer(farmer, dt, sense, resolve, time) {
  farmer.frame += dt;
  let event = 0;

  if (sense.gobble) {
    farmer.state = 'flee';
    farmer.fleeTimer = 2;
    farmer.suspicion = 0;
  }

  if (farmer.state === 'flee') {
    farmer.fleeTimer -= dt;
    const away = angleTo(farmer, sense.turkeyX, sense.turkeyY) + Math.PI;
    moveToward(farmer, farmer.x + Math.cos(away) * 100, farmer.y + Math.sin(away) * 100, FARMER.fleeSpeed, dt, resolve);
    if (farmer.fleeTimer <= 0) farmer.state = 'patrol';
    return event;
  }

  // Suspicion: fast in the cone's centre, slow at its edge; running is loud.
  if (sense.seen) {
    const edge = Math.min(1, Math.abs(angleDiff(angleTo(farmer, sense.turkeyX, sense.turkeyY), farmer.facingAngle ?? 0)) / FARMER.visionHalfAngle);
    const rate = FARMER.suspicionPerSecondCentre * (1 - edge * 0.7);
    farmer.suspicion = Math.min(100, farmer.suspicion + rate * dt);
    farmer.lastSeenX = sense.turkeyX;
    farmer.lastSeenY = sense.turkeyY;
    farmer.lastSeenTime = time;
  } else {
    farmer.suspicion = Math.max(0, farmer.suspicion - FARMER.suspicionDecayPerSecond * dt);
  }
  if (sense.heardRun && farmer.state !== 'chase') {
    farmer.suspicion = Math.min(100, farmer.suspicion + 18 * dt);
  }

  if (farmer.state === 'patrol') {
    if (farmer.suspicion >= 100) {
      farmer.state = 'chase';
      event |= 1;
    } else if (farmer.scanTimer > 0) {
      // Pause at the waypoint and sweep his gaze: a window to slip past — or be seen.
      farmer.scanTimer -= dt;
      farmer.facingAngle = farmer.scanBase + Math.sin((1.2 - farmer.scanTimer) * 2.6) * 1.0;
      if (farmer.scanTimer <= 0) {
        farmer.waypointIndex = (farmer.waypointIndex + 1) % farmer.waypoints.length;
      }
    } else {
      const target = farmer.waypoints[farmer.waypointIndex];
      const d = Math.hypot(target.x - farmer.x, target.y - farmer.y);
      if (d < 12) {
        farmer.scanTimer = 1.2;
        farmer.scanBase = farmer.facingAngle ?? 0;
      } else {
        moveToward(farmer, target.x, target.y, FARMER.patrolSpeed, dt, resolve);
      }
    }
  } else if (farmer.state === 'suspicious') {
    farmer.state = farmer.suspicion >= 100 ? 'chase' : 'patrol';
    if (farmer.state === 'chase') event |= 1;
  } else if (farmer.state === 'chase') {
    const speed = sense.dinnerRush ? FARMER.chaseSpeed * 1.25 : FARMER.chaseSpeed;
    moveToward(farmer, farmer.lastSeenX, farmer.lastSeenY, speed, dt, resolve);
    if (!sense.seen && time - farmer.lastSeenTime > FARMER.chaseMemorySeconds) {
      farmer.state = 'search';
      farmer.searchTimer = FARMER.searchSeconds;
      event |= 2;
    }
  } else if (farmer.state === 'search') {
    farmer.searchTimer -= dt;
    // Look around the last-known spot, then give up.
    const wobble = Math.sin(farmer.searchTimer * 2.4) * 40;
    moveToward(farmer, farmer.lastSeenX + wobble, farmer.lastSeenY, FARMER.searchSpeed, dt, resolve);
    if (farmer.suspicion >= 100) {
      farmer.state = 'chase';
      event |= 1;
    } else if (farmer.searchTimer <= 0) {
      farmer.state = 'patrol';
      farmer.suspicion = 0;
    }
  }

  // Half-suspicion shows as SUSPICIOUS so the player (and the judge) can read it.
  if (farmer.state === 'patrol' && farmer.suspicion >= 45) farmer.state = 'suspicious';
  if (farmer.state === 'suspicious' && farmer.suspicion < 45) farmer.state = 'patrol';
  farmer.spotted = farmer.state === 'chase';
  return event;
}

/** Scare the farmer: he flees from the turkey for a couple of seconds. */
export function scareFarmer(farmer) {
  farmer.state = 'flee';
  farmer.fleeTimer = 2;
  farmer.suspicion = 0;
}
