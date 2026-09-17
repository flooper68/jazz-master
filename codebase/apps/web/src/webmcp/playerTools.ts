import { z } from 'zod'
import { objectSchema } from '../agentTools/descriptors'
import { MAX_TEMPO, MIN_TEMPO } from '../player/transport'
import { registerPageTools, type ModelContextLike, type PageTool, type PageToolAnswer } from './modelContext'

/**
 * The player's tools exist only while a player is on the page: an agent that
 * lists tools on the exercises page is not offered a Play that has nothing to
 * play. The player hands over the same controls its own buttons use.
 */

export interface PlayerState {
  exerciseId: string
  title: string
  playing: boolean
  /** True while Play has been pressed but the browser has not let the sound start. */
  waitingForSound: boolean
  tempoBpm: number
  exerciseTempoBpm: number
  bar: number
  beat: number
  passesDone: number
  finished: boolean
  soundAvailable: boolean
}

export interface PlayerControls {
  state(): PlayerState
  play(): void
  pause(): void
  /** Pause and go back to the start. */
  stop(): void
  setTempo(bpm: number): void
}

let active: PlayerControls | null = null

/** The player on the page now, for tools that report on the whole view. */
export function activePlayerState(): PlayerState | null {
  return active?.state() ?? null
}

const NO_ARGUMENTS = objectSchema({}, [])
const ACTS = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const
const tempoInput = z.strictObject({ bpm: z.number().min(MIN_TEMPO).max(MAX_TEMPO).describe(`Beats per minute, ${MIN_TEMPO} to ${MAX_TEMPO}.`) })

/** How long Play gives the browser to let the sound start, and how often it looks. */
const SOUND_START_MS = 1000
const SOUND_POLL_MS = 50

function answer(controls: PlayerControls, extra: Record<string, unknown> = {}): PageToolAnswer {
  return { status: 'ok', player: controls.state(), ...extra }
}

export function playerPageTools(controls: PlayerControls, wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))): PageTool[] {
  return [
    {
      name: 'get_player_state',
      title: 'Look at the player',
      description: 'What the exercise player on the page is doing: which exercise, playing or not, the tempo, the bar and beat, and how many passes are done.',
      inputSchema: NO_ARGUMENTS,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false, untrustedContentHint: true },
      execute: async () => answer(controls),
    },
    {
      name: 'player_play',
      title: 'Play',
      description:
        'Start the exercise on the page, as the Play button does: a count-in, then the click and the moving cursor. A browser may hold the sound back until the user has clicked the page once; the answer then says `waiting_for_user`, and the user has only to click anywhere.',
      inputSchema: NO_ARGUMENTS,
      annotations: ACTS,
      async execute() {
        controls.play()
        for (let waited = 0; controls.state().waitingForSound && waited < SOUND_START_MS; waited += SOUND_POLL_MS) await wait(SOUND_POLL_MS)
        if (!controls.state().waitingForSound) return answer(controls)
        return { status: 'waiting_for_user', message: 'The browser will not start sound for a page the user has not clicked yet. Ask the user to click anywhere on the page; playback starts by itself.', player: controls.state() }
      },
    },
    {
      name: 'player_pause',
      title: 'Pause',
      description: 'Pause the exercise where it is. player_play carries on from there.',
      inputSchema: NO_ARGUMENTS,
      annotations: ACTS,
      async execute() {
        controls.pause()
        return answer(controls)
      },
    },
    {
      name: 'player_stop',
      title: 'Back to the start',
      description: 'Pause the exercise and go back to its first bar, forgetting the passes played.',
      inputSchema: NO_ARGUMENTS,
      annotations: ACTS,
      async execute() {
        controls.stop()
        return answer(controls)
      },
    },
    {
      name: 'player_set_tempo',
      title: 'Set the tempo',
      description: "Set the player's tempo in beats per minute, playing or not. It belongs to this sitting: the exercise keeps the tempo it was written with, which get_player_state reports as `exerciseTempoBpm`.",
      inputSchema: z.toJSONSchema(tempoInput, { io: 'input' }),
      annotations: ACTS,
      async execute(args) {
        const parsed = tempoInput.safeParse(args)
        if (!parsed.success) return { status: 'invalid', problems: [`bpm: give a number from ${MIN_TEMPO} to ${MAX_TEMPO}`] }
        controls.setTempo(parsed.data.bpm)
        return answer(controls)
      },
    },
  ]
}

/** Offer a mounted player's tools; the function returned takes them back. One player at a time, as on the page. */
export function offerPlayer(controls: PlayerControls, modelContext?: ModelContextLike | null): () => void {
  active = controls
  const withdraw = modelContext === undefined ? registerPageTools(playerPageTools(controls)) : registerPageTools(playerPageTools(controls), modelContext)
  return () => {
    withdraw()
    if (active === controls) active = null
  }
}
