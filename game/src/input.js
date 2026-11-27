// Keyboard + mouse input for the turkey game.
// WASD / arrows move, Shift runs (loud), Space gobbles, E hops, P pauses, R restarts.
// Clicks are reported with canvas coordinates so menus and decision panels can use them.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_GOBBLE = 4;
export const ACTION_HOP = 8;
export const ACTION_RESTART = 16;
export const ACTION_DECISION_1 = 32;
export const ACTION_DECISION_2 = 64;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let mouseX = 0;
  let mouseY = 0;
  let clicked = false;
  let clickX = 0;
  let clickY = 0;

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  function onKeyDown(event) {
    const key = keyName(event);
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
    if (event.repeat) return;
    keys.add(key);
    if (key === ' ' || key === 'Enter') actions |= ACTION_CONFIRM | ACTION_GOBBLE;
    else if (key === 'p' || key === 'Escape') actions |= ACTION_PAUSE;
    else if (key === 'e') actions |= ACTION_HOP;
    else if (key === 'r') actions |= ACTION_RESTART;
    else if (key === '1') actions |= ACTION_DECISION_1;
    else if (key === '2') actions |= ACTION_DECISION_2;
  }

  function onKeyUp(event) {
    keys.delete(keyName(event));
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
  }

  function onMouseDown(event) {
    onMouseMove(event);
    clicked = true;
    clickX = mouseX;
    clickY = mouseY;
    actions |= ACTION_CONFIRM;
  }

  function onBlur() {
    keys.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  function direction() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('d') || keys.has('ArrowRight')) x += 1;
    if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('s') || keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  function running() {
    return keys.has('Shift');
  }

  function takeActions() {
    const out = actions;
    actions = 0;
    return out;
  }

  function takeClick() {
    if (!clicked) return null;
    clicked = false;
    return { x: clickX, y: clickY };
  }

  function mouse() {
    return { x: mouseX, y: mouseY };
  }

  return { direction, running, takeActions, takeClick, mouse };
}
