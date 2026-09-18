import type {
  ExerciseContext,
  ExerciseFeel,
  ExerciseStyle,
  ExerciseTechnique,
  ExerciseVoicing,
} from '../content'

/** Rendered names for the exercise facets (identifiers stay lowercase slugs in code). */
export const STYLE_LABELS: Record<ExerciseStyle, string> = {
  jazz: 'Jazz',
  'jazz/swing': 'Swing',
  'jazz/bebop': 'Bebop',
  'jazz/blues': 'Jazz blues',
  'jazz/bossa-latin': 'Bossa & Latin jazz',
  'jazz/gypsy': 'Gypsy jazz',
  'jazz/modal': 'Modal',
  'jazz/fusion': 'Fusion',
  blues: 'Blues',
  rock: 'Rock',
  metal: 'Metal',
  'funk-soul': 'Funk & soul',
  country: 'Country',
  'country/bluegrass': 'Bluegrass',
  'folk-acoustic': 'Folk & acoustic',
  classical: 'Classical',
  'latin-flamenco': 'Latin & flamenco',
  pop: 'Pop',
}

export const CONTEXT_LABELS: Record<ExerciseContext, string> = {
  diatonic: 'Diatonic harmony',
  'I-IV-V': 'I–IV–V',
  'I-V-vi-IV': 'I–V–vi–IV',
  '12-bar-blues': '12-bar blues',
  'minor-blues': 'Minor blues',
  'jazz-blues': 'Jazz blues',
  'major-ii-V-I': 'Major ii–V–I',
  'minor-ii-V-i': 'Minor ii–V–i',
  turnaround: 'Turnaround',
  'rhythm-changes': 'Rhythm changes',
  'cycle-of-fourths': 'Cycle of fourths',
  'modal-vamp': 'Modal vamp',
  'andalusian-cadence': 'Andalusian cadence',
  substitution: 'Substitution',
}

export const TECHNIQUE_LABELS: Record<ExerciseTechnique, string> = {
  alternate: 'Alternate picking',
  economy: 'Economy picking',
  sweep: 'Sweep picking',
  hybrid: 'Hybrid picking',
  fingerstyle: 'Fingerstyle',
  travis: 'Travis picking',
  'rest-stroke': 'Rest-stroke picking',
  tremolo: 'Tremolo picking',
  'palm-mute': 'Palm muting',
  strumming: 'Strumming',
  legato: 'Legato',
  bends: 'Bends',
  vibrato: 'Vibrato',
  slides: 'Slides',
  tapping: 'Tapping',
  harmonics: 'Harmonics',
  'double-stops': 'Double-stops',
  'string-skipping': 'String skipping',
  'position-shift': 'Position shifts',
  'single-string': 'Single string',
}

export const FEEL_LABELS: Record<ExerciseFeel, string> = {
  'straight-8': 'Straight eighths',
  'swing-8': 'Swing eighths',
  shuffle: 'Shuffle',
  'triplet-12-8': 'Triplets (12/8)',
  'straight-16': 'Straight sixteenths',
  'swung-16': 'Swung sixteenths',
  bossa: 'Bossa',
  waltz: 'Waltz',
}

export const VOICING_LABELS: Record<ExerciseVoicing, string> = {
  open: 'Open chords',
  barre: 'Barre chords',
  power: 'Power chords',
  triad: 'Triads',
  shell: 'Shell voicings',
  'drop-2': 'Drop 2',
  'drop-3': 'Drop 3',
  rootless: 'Rootless',
  quartal: 'Quartal',
  'double-stop': 'Double-stops',
}

/** A key as it is read, not as it is written in code: `Bb` → `B♭`, `F#` → `F♯`. */
export function keyLabel(key: string): string {
  return key.replace(/b/g, '♭').replace(/#/g, '♯')
}
