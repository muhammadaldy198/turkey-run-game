// The turkey: movement, running (loud), hopping over low obstacles, gobbling to scare
// the farmer, and feathers as lives. A caught turkey with feathers left escapes by luck,
// losing one feather — the first catch is never the last.
import { TURKEY } from './config.js';

export function createTurkey(x, y) {
  return {
    x,
    y,
    dir: 1,
    feathers: 3,
    hidden: false,
    moving: false,
    running: false,
    hopTimer: 0,
    hopCooldown: 0,
    gobbleCooldown: 0,
    invulnerable: 0,
    gobbleFlash: 0,
    frame: 0,
  };
}

/**
 * Move the turkey. `move` is a normalized {x, y}; `run` is Shift; `hop` is the E key.
 * `resolvePos(x, y, hopping)` returns the position after pushing the turkey's circle
 * out of every solid rectangle, so it slides along walls instead of sticking to corners.
 * Returns 1 when the turkey hopped, else 0.
 */
export function stepTurkey(turkey, dt, move, run, hop, resolvePos) {
  turkey.frame += dt;
  if (turkey.invulnerable > 0) turkey.invulnerable -= dt;
  if (turkey.hopCooldown > 0) turkey.hopCooldown -= dt;
  if (turkey.gobbleCooldown > 0) turkey.gobbleCooldown -= dt;
  if (turkey.gobbleFlash > 0) turkey.gobbleFlash -= dt;

  const hopping = turkey.hopTimer > 0;
  if (hopping) turkey.hopTimer -= dt;

  let speed = run ? TURKEY.runSpeed : TURKEY.walkSpeed;
  if (hopping) speed = TURKEY.hopSpeed;
  if (turkey.hidden) speed *= 0.55;

  turkey.moving = move.x !== 0 || move.y !== 0;
  turkey.running = run && turkey.moving && !hopping;

  if (turkey.moving) {
    if (move.x !== 0) turkey.dir = move.x > 0 ? 1 : -1;
    const nx = turkey.x + move.x * speed * dt;
    const ny = turkey.y + move.y * speed * dt;
    const resolved = resolvePos(nx, ny, hopping);
    turkey.x = resolved.x;
    turkey.y = resolved.y;
  }

  if (hop && turkey.hopCooldown <= 0 && turkey.hopTimer <= 0 && turkey.moving) {
    turkey.hopTimer = TURKEY.hopSeconds;
    turkey.hopCooldown = TURKEY.hopCooldown;
    return 1; // hopped
  }
  return 0;
}

/** The turkey is hidden only when it stands still (or creeps) inside a hay pile. */
export function updateHidden(turkey, inHay) {
  turkey.hidden = inHay && !turkey.running && turkey.hopTimer <= 0;
}

/** Gobble: scares the farmer for a while. Returns true when the gobble fired. */
export function tryGobble(turkey) {
  if (turkey.gobbleCooldown > 0) return false;
  turkey.gobbleCooldown = TURKEY.gobbleCooldown;
  turkey.gobbleFlash = 0.6;
  return true;
}

/** Lose one feather to a catch. Returns 'caught' when no feathers are left. */
export function loseFeather(turkey) {
  turkey.feathers -= 1;
  turkey.invulnerable = 2.5;
  return turkey.feathers <= 0 ? 'caught' : 'escaped';
}
