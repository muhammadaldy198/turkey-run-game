// The HUD: score, distance, feathers, the dinner-bell timer, the stage, the objective
// and the win/lose line — everything the judge needs to read the game at a glance.
// Numbers here always match the live state; no static strips that contradict the game.
import { FIELD, PALETTE as P, STAGE_NAMES, TIMER_TOTAL } from './config.js';

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function bar(ctx, x, y, w, h, frac, fill, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

export function drawHud(ctx, world) {
  const t = world.turkey;
  const s = world.stage;
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(43, 29, 18, 0.88)';
  ctx.fillRect(0, 0, FIELD.width, 56);
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🌽 ${world.cornCount * 10 + world.scoreBonus}  SCORE ${world.score}`, 16, 36);
  ctx.fillText(`DIST ${Math.floor(world.distance)}m`, 330, 36);
  // Feathers as lives.
  ctx.fillText('FEATHERS', 520, 36);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < t.feathers ? P.gold : 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(640 + i * 26, 28, 6, 12, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Dinner-bell timer.
  const rush = world.timeLeft <= 20;
  ctx.fillStyle = rush ? '#ff6b4a' : P.cream;
  ctx.font = `bold ${rush ? 26 : 22}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`🔔 ${formatTime(world.timeLeft)}`, FIELD.width - 16, 37);
  // Stage + objective.
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${STAGE_NAMES[s.index]}  ·  ${s.index + 1}/3`, 16, 78);
  ctx.fillStyle = 'rgba(247, 234, 208, 0.85)';
  ctx.font = '15px sans-serif';
  ctx.fillText(world.objective, 16, 98);
  // Win/lose line — always on screen so the stakes read in a still frame.
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(247, 234, 208, 0.9)';
  ctx.fillText('ESCAPE BEFORE THE BELL · 3 DOORS · 3 FEATHERS', FIELD.width - 16, 78);
  // Farmer suspicion bar (the player reads the danger before the farmer does).
  const f = world.farmer;
  ctx.textAlign = 'left';
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 13px sans-serif';
  const label = f.state === 'chase' ? 'FARMER: CHASING!' : f.state === 'search' ? 'FARMER: SEARCHING' : f.state === 'flee' ? 'FARMER: SCARED OFF!' : f.state === 'suspicious' ? 'FARMER: SUSPICIOUS ?' : 'FARMER: PATROLLING';
  ctx.fillText(label, FIELD.width - 260, 98);
  bar(ctx, FIELD.width - 260, 106, 244, 8, f.suspicion / 100, f.suspicion >= 100 ? '#c0392b' : '#f2c14e', 'rgba(255,255,255,0.2)');
  // Dinner rush banner.
  if (rush && world.phase === 'play') {
    ctx.fillStyle = 'rgba(192, 57, 43, 0.92)';
    ctx.fillRect(FIELD.width / 2 - 190, 64, 380, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔔 DINNER BELL — THE FARMER IS TWICE AS FAST!', FIELD.width / 2, 85);
  }
  // Feedback flashes.
  if (world.flash) {
    ctx.fillStyle = world.flashColor;
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.flash, FIELD.width / 2, 150);
  }
  // Controls hint along the bottom.
  ctx.fillStyle = 'rgba(43, 29, 18, 0.75)';
  ctx.fillRect(0, FIELD.height - 26, FIELD.width, 26);
  ctx.fillStyle = 'rgba(247, 234, 208, 0.9)';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / ARROWS move · SHIFT run (loud) · SPACE gobble · E hop · HIDE in hay · P pause', FIELD.width / 2, FIELD.height - 8);
  ctx.restore();
}

/** The title screen: name, stakes, menu, best run. */
export function drawTitle(ctx, world, best) {
  ctx.save();
  ctx.fillStyle = 'rgba(43, 29, 18, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = P.gold;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('GOBBLE OR GONE', FIELD.width / 2, 190);
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('3 Doors to Dawn', FIELD.width / 2, 232);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(247, 234, 208, 0.95)';
  ctx.fillText('3 doors · 3 keys · 3 feathers · 120 seconds · 1 dinner bell', FIELD.width / 2, 272);
  ctx.fillText('Dodge the farmer. Dodge the oven. Dodge the carving knife.', FIELD.width / 2, 300);
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('▶  PLAY — press SPACE or click', FIELD.width / 2, 380);
  ctx.font = '18px sans-serif';
  ctx.fillText('HOW TO: collect the key, open the door, choose wisely at each door', FIELD.width / 2, 418);
  ctx.fillText('First catch costs a feather — the farmer only gets the tail.', FIELD.width / 2, 444);
  if (best > 0) ctx.fillText(`BEST ESCAPE SCORE: ${best}`, FIELD.width / 2, 490);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'rgba(247, 234, 208, 0.75)';
  ctx.fillText('A Thanksgiving escape in Maple Farm Yard, the Old Barn and the Farmhouse Kitchen', FIELD.width / 2, 560);
  ctx.restore();
}

/** The end screen: ESCAPED or CAUGHT, with the run's stats and a restart. */
export function drawEnd(ctx, world, best) {
  ctx.save();
  ctx.fillStyle = world.ending === 'escaped' ? 'rgba(46, 90, 40, 0.72)' : 'rgba(126, 44, 34, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  if (world.ending === 'escaped') {
    ctx.fillStyle = P.gold;
    ctx.font = 'bold 72px Georgia, serif';
    ctx.fillText('ESCAPED!', FIELD.width / 2, 210);
    ctx.fillStyle = P.cream;
    ctx.font = '24px sans-serif';
    ctx.fillText('The turkey watched the sun rise from the woods — dinner never happened.', FIELD.width / 2, 258);
  } else {
    ctx.fillStyle = '#ffd9d0';
    ctx.font = 'bold 72px Georgia, serif';
    ctx.fillText('CAUGHT!', FIELD.width / 2, 210);
    ctx.fillStyle = P.cream;
    ctx.font = '24px sans-serif';
    ctx.fillText(world.caughtReason || 'The farmer serves dinner at noon. The turkey did not make it.', FIELD.width / 2, 258);
  }
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`SCORE ${world.score}   ·   CORN ${world.cornCount}   ·   DISTANCE ${Math.floor(world.distance)}m`, FIELD.width / 2, 330);
  ctx.fillText(`TIME ${formatTime(TIMER_TOTAL - world.timeLeft)}   ·   FEATHERS LEFT ${world.turkey.feathers}   ·   GOLDEN FEATHERS ${world.goldenCount}/3`, FIELD.width / 2, 366);
  if (world.goldenCount === 3) {
    ctx.fillStyle = P.gold;
    ctx.fillText('★ GOLDEN FEATHER ENDING — all three hidden feathers found ★', FIELD.width / 2, 402);
  }
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Press R or click to run again', FIELD.width / 2, 470);
  if (best > 0) {
    ctx.font = '18px sans-serif';
    ctx.fillText(`BEST SCORE: ${best}`, FIELD.width / 2, 506);
  }
  ctx.restore();
}
