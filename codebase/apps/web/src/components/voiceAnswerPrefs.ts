/**
 * Whether the summary listens for a spoken answer. On by default where the
 * browser can recognise speech on the device — the mic button turns it off,
 * and that choice outlives the exercise.
 */

export const VOICE_ANSWER_KEY = 'jazz-master.voice-answer'

export function loadVoiceAnswerOn(storage: Pick<Storage, 'getItem'> | null = safeStorage()): boolean {
  try {
    const raw = storage?.getItem(VOICE_ANSWER_KEY)
    // Nothing stored is not a choice: the default stands.
    return raw === null || raw === undefined ? true : raw === 'on'
  } catch {
    return true
  }
}

export function saveVoiceAnswerOn(on: boolean, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(VOICE_ANSWER_KEY, on ? 'on' : 'off')
  } catch {
    // Private mode or a full quota: the choice still holds for this sitting.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
