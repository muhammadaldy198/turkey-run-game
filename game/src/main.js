// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. Screens: title, play, decision, paused,
// game over.
//
// ?seed=N fixes the random pattern. ?shot=chase|title|decision|escaped (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createWorld, resetWorld, stepWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_GOBBLE, ACTION_HOP, ACTION_RESTART, ACTION_DECISION_1, ACTION_DECISION_2, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_DECISION, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, seed);
  let painted = 0;
  function paint() {
    renderer.draw(scene.world, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const world = createWorld(seed);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let pausedFrom = null;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    resetWorld(world, seed);
    world.phase = 'play';
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. 3 feathers. Escape before the dinner bell.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
    announce(world.ending === 'escaped' ? `Escaped! Score ${world.score}. Best ${best}.` : `Caught. Score ${world.score}. Best ${best}.`);
  }

  function buildCtrl(actions) {
    const click = input.takeClick();
    const dir = input.direction();
    return {
      move: dir,
      run: input.running(),
      hop: Boolean(actions & ACTION_HOP),
      gobble: Boolean(actions & ACTION_GOBBLE),
      confirm: Boolean(actions & ACTION_CONFIRM),
      restart: Boolean(actions & ACTION_RESTART),
      click,
      key1: Boolean(actions & ACTION_DECISION_1),
      key2: Boolean(actions & ACTION_DECISION_2),
    };
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    const ctrl = buildCtrl(actions);

    if (actions & ACTION_RESTART && (screen === SCREEN_OVER || screen === SCREEN_PLAY)) {
      startGame();
      return;
    }
    if (screen === SCREEN_TITLE && (actions & ACTION_CONFIRM || ctrl.click)) {
      audio.ensure();
      startGame();
      return;
    }
    if (screen === SCREEN_OVER && (actions & ACTION_CONFIRM || ctrl.click)) {
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        pausedFrom = SCREEN_PLAY;
        screen = 'paused';
        announce('Paused.');
      } else if (screen === 'paused') {
        screen = pausedFrom || SCREEN_PLAY;
        announce('Playing.');
      }
    }

    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY || screen === SCREEN_DECISION) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY || screen === SCREEN_DECISION)) {
        stepWorld(world, STEP, ctrl, audio, screen === SCREEN_TITLE);
        accumulator -= STEP;
        if (world.phase === 'over' && screen !== SCREEN_OVER) {
          endGame();
          break;
        }
        if (world.phase === 'decision' && screen === SCREEN_PLAY) screen = SCREEN_DECISION;
        if (world.phase === 'play' && screen === SCREEN_DECISION) screen = SCREEN_PLAY;
      }
    } else {
      accumulator = 0;
    }

    renderer.draw(world, screen === 'paused' ? SCREEN_PLAY : screen, best);
    if (screen === 'paused') {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(20, 12, 6, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f7ead0';
      ctx.font = 'bold 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText('Press P to keep running', canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  announce('Gobble or Gone. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
