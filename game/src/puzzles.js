// The barn code lock and the golden feather.
// The code is three numbers the player reads off the barn itself: eggs in the nest,
// pumpkins in the patch, the hour on the wall clock. Finding all three clues reveals
// the code; the CRACK option at Door 2 then opens it silently.
export function codeFromClues(clues) {
  const nest = clues.find((c) => c.id === 'nest');
  const pumpkins = clues.find((c) => c.id === 'pumpkins');
  const clock = clues.find((c) => c.id === 'clock');
  if (!nest || !pumpkins || !clock) return null;
  return `${nest.value}${pumpkins.value}${clock.value}`;
}

export function allCluesFound(clues) {
  return clues.length > 0 && clues.every((c) => c.found);
}

export function cluesFoundCount(clues) {
  return clues.filter((c) => c.found).length;
}
