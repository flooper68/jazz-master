/**
 * Convert ASCII accidentals in note/degree/chord labels to Unicode for
 * rendered text (`Bb7` → `B♭7`, `F#` → `F♯`). Lowercase b is always a flat
 * in these labels; B natural is uppercase, and no chord quality uses `b`
 * outside an alteration (`m7b5`), so a global replace is safe.
 */
export function displayAccidentals(label: string): string {
  return label.replace(/b/g, '♭').replace(/#/g, '♯')
}
