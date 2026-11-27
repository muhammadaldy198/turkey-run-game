// The renderer: paints the world — ground, walls, props, the farmer's vision cone,
// the turkey, the HUD and the screens. The decision panel and the end screens live
// here too, so the screenshots are exactly what a player sees.
import { FIELD, PALETTE as P, STAGE_NAMES } from './config.js';
import { drawTurkey, drawFarmer, drawHay, drawCorn, drawKey, drawGoldenFeather, drawPumpkin, drawOven, drawKnife, drawDoor, drawWindow, drawFence } from './art.js';
import { drawHud, drawTitle, drawEnd } from './hud.js';
import { optionBoxes } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_DECISION = 'decision';
export const SCREEN_OVER = 'over';

function drawGround(ctx, stage, frame) {
  if (stage.ground === 'yard') {
    ctx.fillStyle = P.grass;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = P.grassDark;
    for (let i = 0; i < 40; i += 1) {
      const x = ((i * 173) % FIELD.width) + 20;
      const y = ((i * 97) % FIELD.height) + 20;
      ctx.fillRect(x, y, 26, 4);
    }
    // Dirt paths.
    ctx.fillStyle = P.dirt;
    ctx.fillRect(0, 330, FIELD.width, 60);
    ctx.fillRect(560, 0, 60, FIELD.height);
    ctx.fillStyle = P.dirtDark;
    for (let i = 0; i < 24; i += 1) {
      ctx.fillRect((i * 53) % FIELD.width, 352 + ((i * 7) % 16), 14, 5);
    }
  } else if (stage.ground === 'barn') {
    ctx.fillStyle = P.barnWood;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = P.barnWoodDark;
    for (let y = 60; y < FIELD.height; y += 64) ctx.fillRect(0, y, FIELD.width, 4);
    for (let x = 80; x < FIELD.width; x += 120) ctx.fillRect(x, 0, 4, FIELD.height);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, FIELD.width, 40);
  } else {
    ctx.fillStyle = P.kitchenFloor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = P.kitchenTile;
    for (let y = 0; y < FIELD.height; y += 72) {
      for (let x = (y / 72) % 2 === 0 ? 0 : 36; x < FIELD.width; x += 72) {
        ctx.fillRect(x, y, 68, 68);
      }
    }
    // Kitchen rug.
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(420, 300, 440, 130);
    ctx.fillStyle = '#c9a06b';
    ctx.fillRect(436, 316, 408, 98);
  }
}

function drawWalls(ctx, stage) {
  for (const w of stage.walls) {
    if (stage.ground === 'yard') {
      drawFence(ctx, w.x, w.y, w.w, w.h);
    } else if (stage.ground === 'barn') {
      ctx.fillStyle = P.barnRed;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = P.barnRedDark;
      ctx.fillRect(w.x, w.y + w.h - 8, w.w, 8);
    } else {
      ctx.fillStyle = '#5a4632';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#6f5a40';
      ctx.fillRect(w.x, w.y, w.w, 6);
    }
  }
  for (const l of stage.low) {
    ctx.fillStyle = stage.ground === 'kitchen' ? '#8a6a44' : P.hayDark;
    ctx.fillRect(l.x, l.y, l.w, l.h);
    ctx.fillStyle = stage.ground === 'kitchen' ? '#a5825a' : P.hay;
    ctx.fillRect(l.x + 4, l.y + 4, l.w - 8, l.h - 8);
  }
}

function drawCone(ctx, farmer) {
  const range = 265;
  const half = 0.61;
  const angle = farmer.facingAngle ?? 0;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(farmer.x, farmer.y);
  ctx.arc(farmer.x, farmer.y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fillStyle = farmer.state === 'chase' ? 'rgba(192, 57, 43, 0.20)' : 'rgba(242, 193, 78, 0.16)';
  ctx.fill();
  ctx.strokeStyle = farmer.state === 'chase' ? 'rgba(192, 57, 43, 0.45)' : 'rgba(242, 193, 78, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawDecisionPanel(ctx, world) {
  const d = world.decision;
  const panelX = FIELD.width / 2 - 430;
  const panelY = 190;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 12, 6, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#f7ead0';
  ctx.fillRect(panelX, panelY, 860, 290);
  ctx.strokeStyle = '#8a5a2e';
  ctx.lineWidth = 4;
  ctx.strokeRect(panelX + 2, panelY + 2, 856, 286);
  ctx.fillStyle = '#2b1d12';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(d.def.title, FIELD.width / 2, panelY + 44);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#c0392b';
  ctx.fillText(`CHOOSE IN ${Math.max(0, Math.ceil(d.countdown))}…`, FIELD.width / 2, panelY + 76);
  const boxes = optionBoxes(d);
  d.def.options.forEach((opt, i) => {
    const b = boxes[i];
    const hover = d.hover === i;
    ctx.fillStyle = opt.disabled ? '#d8cfc0' : hover ? '#ffe9b0' : '#fff6dd';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = opt.disabled ? '#9a8f7d' : '#8a5a2e';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = opt.disabled ? '#8a8378' : '#2b1d12';
    ctx.font = 'bold 19px sans-serif';
    ctx.textAlign = 'center';
    const words = opt.name.split(' ');
    let line = '';
    let lineY = b.y + 38;
    for (const word of words) {
      if ((line + ' ' + word).trim().length > 22 && line) {
        ctx.fillText(line.trim(), b.x + b.w / 2, lineY);
        line = word;
        lineY += 24;
      } else {
        line = `${line} ${word}`;
      }
    }
    ctx.fillText(line.trim(), b.x + b.w / 2, lineY);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = opt.disabled ? '#8a8378' : '#5a4632';
    const detailWords = opt.detail.split(' ');
    let dline = '';
    let dy = lineY + 28;
    for (const word of detailWords) {
      if ((dline + ' ' + word).trim().length > 42 && dline) {
        ctx.fillText(dline.trim(), b.x + b.w / 2, dy);
        dline = word;
        dy += 18;
      } else {
        dline = `${dline} ${word}`;
      }
    }
    ctx.fillText(dline.trim(), b.x + b.w / 2, dy);
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = opt.disabled ? '#8a8378' : '#a63d2f';
    ctx.fillText(opt.disabled ? 'LOCKED' : `PRESS ${opt.key}`, b.x + b.w / 2, b.y + b.h - 14);
  });
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function draw(state, screen, best) {
    const world = state;
    const stage = world.stage;
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawGround(ctx, stage, world.time);
    // Props under the actors.
    for (const h of stage.hayPiles) drawHay(ctx, h.x, h.y, h.w, h.h);
    for (const p of stage.pumpkins) drawPumpkin(ctx, p.x, p.y, p.r);
    if (stage.oven) drawOven(ctx, stage.oven.x, stage.oven.y, stage.oven.w, stage.oven.h, world.time);
    drawWalls(ctx, stage);
    // Clues.
    for (const clue of stage.clues) {
      if (clue.found) continue;
      ctx.fillStyle = '#f2c14e';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`? ${clue.label}`, clue.x, clue.y - 14);
      ctx.fillStyle = '#fff6dd';
      ctx.beginPath();
      ctx.arc(clue.x, clue.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b1d12';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('?', clue.x, clue.y + 5);
    }
    // Corn, key, golden feather.
    for (const c of stage.corn) {
      if (!c.taken) drawCorn(ctx, c.x, c.y, world.time);
    }
    if (stage.key && !stage.key.taken) drawKey(ctx, stage.key.x, stage.key.y, world.time);
    if (stage.goldenFeather && !stage.goldenFeather.taken) drawGoldenFeather(ctx, stage.goldenFeather.x, stage.goldenFeather.y, world.time);
    // The door — in the kitchen it is the window, dawn light coming through.
    if (stage.door.label === 'WINDOW') {
      drawWindow(ctx, stage.door.x, stage.door.y, stage.door.w, stage.door.h, stage.door.open);
      ctx.fillStyle = P.cream;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WINDOW', stage.door.x + stage.door.w / 2, stage.door.y - 8);
    } else {
      drawDoor(ctx, stage.door.x, stage.door.y, stage.door.w, stage.door.h, stage.door.open, stage.door.label);
    }
    // Falling knives: telegraph, then the blade.
    for (const k of world.knives) {
      if (k.state === 'warn') {
        ctx.fillStyle = 'rgba(192, 57, 43, 0.35)';
        ctx.beginPath();
        ctx.ellipse(k.x, k.y, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c0392b';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', k.x, k.y - 14);
      } else if (k.state === 'fall' || k.state === 'stuck') {
        drawKnife(ctx, k.x, k.y, 0);
      }
    }
    // The farmer (cone first, then the man) and the turkey.
    drawCone(ctx, world.farmer);
    drawFarmer(ctx, world.farmer.x, world.farmer.y, world.farmer.dir, world.farmer.frame, world.farmer.state);
    // Farmer suspicion meter above his head.
    if (world.farmer.suspicion > 5 && world.farmer.state !== 'chase') {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(world.farmer.x - 24, world.farmer.y - 48, 48, 6);
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(world.farmer.x - 24, world.farmer.y - 48, 48 * (world.farmer.suspicion / 100), 6);
    }
    const t = world.turkey;
    const blink = t.invulnerable > 0 && Math.floor(world.time * 8) % 2 === 0;
    if (!blink) {
      drawTurkey(ctx, t.x, t.y, t.dir, t.frame, t.hidden, t.hopTimer);
    }
    if (t.gobbleFlash > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOBBLE!', t.x, t.y - 40);
    }
    if (screen === SCREEN_TITLE) {
      drawTitle(ctx, world, best);
    } else if (screen === SCREEN_OVER) {
      // The end screen carries its own stats — the HUD would only collide with it.
      drawEnd(ctx, world, best);
    } else {
      drawHud(ctx, world);
      if (screen === SCREEN_DECISION && world.decision) drawDecisionPanel(ctx, world);
    }
  }

  return { draw };
}
