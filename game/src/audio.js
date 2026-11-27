// All sound is synthesized with WebAudio — no audio files, nothing over the network.
// Every call is guarded: if the browser has no audio (headless screenshots), play() is a no-op.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context) return context;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, seconds, type, gain, when) {
    const ctx = ensure();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const start = ctx.currentTime + (when || 0);
      amp.gain.setValueAtTime(0.0001, start);
      amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + seconds + 0.05);
    } catch {
      // Sound is garnish; a failed blip never stops the game.
    }
  }

  function play(name) {
    if (name === 'gobble') {
      tone(520, 0.09, 'square', 0.12, 0);
      tone(390, 0.09, 'square', 0.12, 0.1);
      tone(300, 0.16, 'square', 0.12, 0.2);
    } else if (name === 'pickup') {
      tone(880, 0.08, 'sine', 0.1, 0);
      tone(1318, 0.12, 'sine', 0.1, 0.07);
    } else if (name === 'key') {
      tone(659, 0.1, 'triangle', 0.12, 0);
      tone(988, 0.18, 'triangle', 0.12, 0.09);
    } else if (name === 'spotted') {
      tone(220, 0.12, 'sawtooth', 0.14, 0);
      tone(330, 0.12, 'sawtooth', 0.14, 0.11);
    } else if (name === 'hit') {
      tone(160, 0.25, 'sawtooth', 0.16, 0);
      tone(110, 0.3, 'sawtooth', 0.16, 0.12);
    } else if (name === 'bell') {
      tone(1046, 0.5, 'sine', 0.14, 0);
      tone(784, 0.7, 'sine', 0.1, 0.05);
    } else if (name === 'door') {
      tone(392, 0.12, 'triangle', 0.1, 0);
      tone(523, 0.12, 'triangle', 0.1, 0.1);
      tone(659, 0.2, 'triangle', 0.1, 0.2);
    } else if (name === 'escaped') {
      tone(523, 0.14, 'triangle', 0.12, 0);
      tone(659, 0.14, 'triangle', 0.12, 0.13);
      tone(784, 0.14, 'triangle', 0.12, 0.26);
      tone(1046, 0.3, 'triangle', 0.12, 0.39);
    } else if (name === 'hop') {
      tone(440, 0.07, 'sine', 0.07, 0);
      tone(660, 0.09, 'sine', 0.07, 0.06);
    } else if (name === 'clue') {
      tone(740, 0.1, 'sine', 0.09, 0);
      tone(1108, 0.14, 'sine', 0.09, 0.08);
    }
  }

  return { play, ensure };
}
