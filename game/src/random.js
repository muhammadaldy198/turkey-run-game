// A tiny seeded random generator (mulberry32) so a seed always replays the same game.
// Used for corn scatter and knife timing; stage layouts themselves are hand-placed.
export function createRandom(seed) {
  let state = seed >>> 0;
  function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(min, max) {
    return min + next() * (max - min);
  }
  function int(min, max) {
    return Math.floor(range(min, max + 1));
  }
  function pick(list) {
    return list[Math.floor(next() * list.length)];
  }
  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }
  return { next, range, int, pick, shuffle };
}
