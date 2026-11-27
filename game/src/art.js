// All art is drawn with canvas paths — the turkey, the farmer, the farm and the kitchen
// are the game's own drawings in one coherent autumn palette. No images, no clip-art.
import { PALETTE as P } from './config.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** The turkey, drawn big enough to read at a glance. dir is -1 (left) or 1 (right). */
export function drawTurkey(ctx, x, y, dir, frame, hidden, hopLift) {
  const lift = hopLift > 0 ? -10 * Math.sin((hopLift / 0.35) * Math.PI) : 0;
  const bob = Math.sin(frame * 8) * (hidden ? 0 : 1.5);
  ctx.save();
  ctx.translate(x, y + lift + bob * 0.4);
  if (hidden) ctx.globalAlpha = 0.55;
  // Tail fan: five feathers fanning behind.
  ctx.fillStyle = P.turkeyFeather;
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.rotate((i * 0.42) - (dir > 0 ? 0 : 0));
    ctx.translate(-dir * 14, -8);
    ctx.beginPath();
    ctx.ellipse(0, -12, 5, 15, i * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = P.turkeyBody;
  ellipse(ctx, 0, 0, 17, 14);
  ctx.fillStyle = P.turkeyDark;
  ellipse(ctx, -dir * 4, 4, 11, 8);
  // Wing.
  ctx.fillStyle = P.turkeyDark;
  ctx.beginPath();
  ctx.ellipse(-dir * 2, -1, 9, 6, dir * 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Head + beak + wattle.
  ctx.fillStyle = P.turkeyHead;
  circle(ctx, dir * 13, -13, 8);
  ctx.fillStyle = P.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(dir * 19, -14);
  ctx.lineTo(dir * 27, -11);
  ctx.lineTo(dir * 19, -9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = P.turkeyWattle;
  ctx.beginPath();
  ctx.ellipse(dir * 16, -6, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye.
  ctx.fillStyle = '#1c1210';
  circle(ctx, dir * 15, -15, 1.8);
  // Legs.
  ctx.strokeStyle = P.turkeyBeak;
  ctx.lineWidth = 2.5;
  const step = Math.sin(frame * 10) * 3;
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.lineTo(-4 + step, 20);
  ctx.moveTo(5, 12);
  ctx.lineTo(5 - step, 20);
  ctx.stroke();
  ctx.restore();
}

/** The farmer: straw hat, blue shirt, overalls, apron, pitchfork. dir is -1 or 1. */
export function drawFarmer(ctx, x, y, dir, frame, state) {
  const bob = Math.sin(frame * 6) * 1.2;
  ctx.save();
  ctx.translate(x, y + bob * 0.4);
  // Pitchfork in the back hand.
  ctx.strokeStyle = '#7a5a33';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-dir * 14, -6);
  ctx.lineTo(-dir * 20, -34);
  ctx.stroke();
  ctx.strokeStyle = '#c9ced4';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-dir * 20 + i * 4, -34);
    ctx.lineTo(-dir * 20 + i * 4, -42);
    ctx.stroke();
  }
  // Legs (overalls).
  ctx.fillStyle = P.farmerOveralls;
  const step = Math.sin(frame * 6) * 4;
  ctx.fillRect(-9, 6, 7, 14 + step * 0.4);
  ctx.fillRect(2, 6, 7, 14 - step * 0.4);
  // Body: shirt + overalls bib.
  ctx.fillStyle = P.farmerShirt;
  ellipse(ctx, 0, -2, 15, 13);
  ctx.fillStyle = P.farmerOveralls;
  ctx.fillRect(-8, -12, 16, 14);
  ctx.fillStyle = P.farmerShirt;
  ctx.fillRect(-8, -12, 16, 3);
  // Arms.
  ctx.strokeStyle = P.farmerShirt;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(-16, 2 + step * 0.3);
  ctx.moveTo(10, -8);
  ctx.lineTo(15, 0);
  ctx.stroke();
  // Head + nose + moustache.
  ctx.fillStyle = P.farmerSkin;
  circle(ctx, 0, -22, 10);
  ctx.fillStyle = '#8a5a2e';
  ctx.beginPath();
  ctx.ellipse(0, -16, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1210';
  circle(ctx, dir * 4, -24, 1.6);
  // Straw hat.
  ctx.fillStyle = P.farmerHat;
  ctx.beginPath();
  ctx.ellipse(0, -28, 15, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -31, 9, 6, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#a63d2f';
  ctx.fillRect(-9, -32, 18, 2.5);
  // State badge: ? while suspicious, ! while chasing.
  if (state === 'suspicious') {
    ctx.fillStyle = '#f2c14e';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', 0, -52);
  } else if (state === 'chase') {
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -52);
  }
  ctx.restore();
}

/** A hay pile the turkey can hide in (crouch = invisible while still). */
export function drawHay(ctx, x, y, w, h) {
  ctx.fillStyle = P.hayDark;
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2 + 3, h / 2 + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = P.hay;
  ctx.beginPath();
  ctx.ellipse(x, y - 3, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.hayDark;
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + i * (w / 6), y - h / 2 + 4);
    ctx.quadraticCurveTo(x + i * (w / 6) + 6, y, x + i * (w / 6) - 3, y + h / 2 - 4);
    ctx.stroke();
  }
}

export function drawCorn(ctx, x, y, frame) {
  const sway = Math.sin(frame * 3 + x) * 2;
  ctx.save();
  ctx.translate(x + sway * 0.3, y);
  ctx.fillStyle = '#4e7a35';
  ctx.beginPath();
  ctx.ellipse(-3, -8, 3, 7, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3, -8, 3, 7, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = P.gold;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9a520';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 3, -9);
    ctx.lineTo(i * 3, 9);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawKey(ctx, x, y, frame) {
  const bob = Math.sin(frame * 4 + y) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(Math.sin(frame * 2) * 0.15);
  ctx.strokeStyle = P.gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(-4, 0, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(14, 0);
  ctx.moveTo(10, 0);
  ctx.lineTo(10, 6);
  ctx.moveTo(14, 0);
  ctx.lineTo(14, 6);
  ctx.stroke();
  ctx.restore();
}

export function drawGoldenFeather(ctx, x, y, frame) {
  const bob = Math.sin(frame * 4 + x) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(0.5 + Math.sin(frame * 2) * 0.1);
  ctx.fillStyle = P.gold;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9a520';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(0, 13);
  ctx.stroke();
  ctx.restore();
}

export function drawPumpkin(ctx, x, y, r) {
  ctx.fillStyle = P.pumpkinDark;
  ellipse(ctx, x, y, r, r * 0.85);
  ctx.fillStyle = P.pumpkin;
  ellipse(ctx, x, y - 1, r * 0.85, r * 0.78);
  ctx.strokeStyle = P.pumpkinDark;
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x + i * r * 0.35, y, r * 0.3, r * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#4e7a35';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.8);
  ctx.quadraticCurveTo(x + 3, y - r * 1.2, x + 7, y - r * 1.1);
  ctx.stroke();
}

export function drawOven(ctx, x, y, w, h, frame) {
  ctx.fillStyle = P.oven;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#33333a';
  ctx.fillRect(x + 8, y + 8, w - 16, h * 0.45);
  const flicker = 0.75 + Math.sin(frame * 9) * 0.15 + Math.sin(frame * 23) * 0.1;
  ctx.fillStyle = `rgba(255, 122, 26, ${flicker})`;
  ctx.fillRect(x + 14, y + 14, w - 28, h * 0.45 - 12);
  // Flames licking the oven window.
  ctx.fillStyle = 'rgba(255, 200, 90, 0.95)';
  for (let i = 0; i < 4; i += 1) {
    const fx = x + 24 + i * ((w - 48) / 3);
    const fh = 10 + Math.sin(frame * 7 + i * 2.1) * 5;
    ctx.beginPath();
    ctx.moveTo(fx - 8, y + h * 0.45 - 2);
    ctx.quadraticCurveTo(fx, y + h * 0.45 - 12 - fh, fx + 8, y + h * 0.45 - 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
  ctx.fillRect(x + 14, y + 14, w - 28, 6);
  // Oven glow on the floor — strong, so the danger reads across the room.
  const glow = ctx.createRadialGradient(x + w / 2, y + h, 10, x + w / 2, y + h, 170);
  glow.addColorStop(0, 'rgba(255, 122, 26, 0.45)');
  glow.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 150, y + h - 10, w + 300, 170);
  ctx.fillStyle = '#dfe6ea';
  for (let i = 0; i < 3; i += 1) {
    circle(ctx, x + 24 + i * 26, y + h - 12, 5);
  }
}

/** The kitchen window: the way out, dawn light coming through so the goal reads. */
export function drawWindow(ctx, x, y, w, h, open) {
  ctx.fillStyle = open ? '#ffe9a8' : '#9fc3e8';
  ctx.fillRect(x, y, w, h);
  // Dawn sky gradient.
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, '#ffd98a');
  sky.addColorStop(1, '#ffb35c');
  ctx.fillStyle = sky;
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = '#7a5a33';
  ctx.fillRect(x + w / 2 - 3, y, 6, h);
  ctx.fillRect(x, y + h / 2 - 3, w, 6);
  ctx.strokeStyle = '#5a4632';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  if (open) {
    ctx.fillStyle = 'rgba(255, 233, 168, 0.35)';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x - 60, y + h + 60);
    ctx.lineTo(x + w + 60, y + h + 60);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawKnife(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = P.knife;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(7, 6);
  ctx.lineTo(0, 12);
  ctx.lineTo(-7, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = P.knifeHandle;
  ctx.fillRect(-3.5, 12, 7, 12);
  ctx.restore();
}

export function drawDoor(ctx, x, y, w, h, open, label) {
  ctx.fillStyle = open ? '#3d2b1a' : P.barnWood;
  ctx.fillRect(x, y, w, h);
  if (!open) {
    ctx.fillStyle = P.barnWoodDark;
    ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    ctx.strokeStyle = P.barnRed;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
    ctx.fillStyle = P.gold;
    circle(ctx, x + w - 14, y + h / 2, 5);
  }
  if (label) {
    ctx.fillStyle = P.cream;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y - 8);
  }
}

export function drawFence(ctx, x, y, w, h) {
  ctx.fillStyle = P.barnWood;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = P.barnWoodDark;
  for (let px = x; px < x + w; px += 34) {
    ctx.fillRect(px, y - 6, 5, h + 12);
  }
}
