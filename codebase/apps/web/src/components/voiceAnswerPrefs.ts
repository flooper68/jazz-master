/**
 * Whether the summary listens for a spoken answer.
 *
 * **Off until asked for, and deliberately so.** Finding out whether a browser
 * can recognise speech on the device means calling
 * `SpeechRecognition.available({ processLocally: true })`, and that call has
 * been observed to *crash the renderer* — on a blank page, with no app
 * involved (Chromium 2026-09-19, reproduced in the e2e suite). A crash cannot
 * be caught, so the app never makes that call on its own: the first press of
 * the mic does, and only a browser that survived it ever gets asked again.
 * From then on the summary listens the moment it opens, which is the point.
 */

export const VOICE_ANSWER_KEY = 'jazz-master.voice-answer'

export function loadVoiceAnswerOn(storage: Pick<Storage, 'getItem'> | null = safeStorage()): boolean {
  try {
    // Nothing stored means never asked for, which is not the same as refused.
    return storage?.getItem(VOICE_ANSWER_KEY) === 'on'
  } catch {
    return false
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
