import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpeechAvailability, SpeechEngine, SpeechHandlers } from '../audio/speech'
import { VoiceAnswer } from './VoiceAnswer'
import { VOICE_ANSWER_KEY } from './voiceAnswerPrefs'

/** A recogniser the test speaks through: it records what it was asked, and says things on command. */
function fakeEngine(availability: SpeechAvailability = 'available') {
  const state = {
    probes: 0,
    started: 0,
    stopped: 0,
    expected: [] as readonly string[],
    handlers: null as SpeechHandlers | null,
  }
  const engine: SpeechEngine = {
    availableOnDevice: async () => {
      state.probes += 1
      return availability
    },
    install: async () => true,
    listen(handlers) {
      state.handlers = handlers
      return {
        start: () => {
          state.started += 1
        },
        stop: () => {
          state.stopped += 1
        },
      }
    },
  }
  return { state, create: (expected: readonly string[]) => ((state.expected = expected), engine) }
}

function renderVoice(engine: ReturnType<typeof fakeEngine> | null = fakeEngine()) {
  const onAnswer = vi.fn()
  const view = render(<VoiceAnswer onAnswer={onAnswer} createEngine={engine ? engine.create : () => null} />)
  return { ...view, onAnswer }
}

/** Turn it on the way a player does, and wait for it to be listening. */
async function switchOn(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Answer out loud' }))
  await screen.findByRole('button', { name: 'Stop listening for a spoken answer' })
}

beforeEach(() => {
  localStorage.clear()
})

describe('VoiceAnswer', () => {
  /*
   * The important one: asking the browser whether it can recognise speech on
   * the device has been seen to crash the renderer, and a crash cannot be
   * caught. So nothing may ask until the player does.
   */
  it('does not go near the microphone, or even ask about it, until it is asked to', async () => {
    const engine = fakeEngine()
    renderVoice(engine)

    expect(await screen.findByRole('button', { name: 'Answer out loud' })).toBeInTheDocument()
    expect(engine.state.probes).toBe(0)
    expect(engine.state.started).toBe(0)
  })

  it('asks, then listens, on the first press — and needs no press the next time', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine()
    const { unmount } = renderVoice(engine)

    await switchOn(user)
    expect(engine.state.probes).toBe(1)
    expect(engine.state.started).toBe(1)
    expect(screen.getByText('Listening — say how it went, and how it felt')).toBeInTheDocument()
    // Remembered only now, once this browser has come back from the question alive.
    expect(localStorage.getItem(VOICE_ANSWER_KEY)).toBe('on')

    unmount()
    const next = fakeEngine()
    renderVoice(next)
    expect(await screen.findByRole('button', { name: 'Stop listening for a spoken answer' })).toBeInTheDocument()
    expect(next.state.started).toBe(1)
  })

  it('hands both answers over from one sentence, and says back what it heard', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine()
    const { onAnswer } = renderVoice(engine)
    await switchOn(user)

    engine.state.handlers?.onTranscript('hard, but loved it')
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith({ difficulty: 'hard', feel: 'loved' }))
    expect(screen.getByText('hard, but loved it')).toBeInTheDocument()
  })

  it('says nothing to the summary when nothing said was an answer', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine()
    const { onAnswer } = renderVoice(engine)
    await switchOn(user)

    engine.state.handlers?.onTranscript('what time is it')
    expect(onAnswer).not.toHaveBeenCalled()
  })

  it('closes the microphone when turned off, and stays off next time', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine()
    const { unmount } = renderVoice(engine)
    await switchOn(user)

    await user.click(screen.getByRole('button', { name: 'Stop listening for a spoken answer' }))
    expect(engine.state.stopped).toBe(1)
    expect(localStorage.getItem(VOICE_ANSWER_KEY)).toBe('off')

    unmount()
    const next = fakeEngine()
    renderVoice(next)
    expect(await screen.findByRole('button', { name: 'Answer out loud' })).toBeInTheDocument()
    expect(next.state.probes).toBe(0)
  })

  it('closes the microphone when the summary goes away', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine()
    const { unmount } = renderVoice(engine)
    await switchOn(user)
    unmount()
    expect(engine.state.stopped).toBe(1)
  })

  it('offers the one-off download rather than listening, when the pack is not there', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine('downloadable')
    renderVoice(engine)

    await user.click(await screen.findByRole('button', { name: 'Answer out loud' }))
    const offer = await screen.findByRole('button', { name: 'Get the voice pack' })
    expect(engine.state.started).toBe(0)
    expect(screen.getByText(/nothing you say leaves this device/)).toBeInTheDocument()

    await user.click(offer)
    await waitFor(() => expect(engine.state.started).toBe(1))
  })

  it('says so plainly when the browser cannot recognise speech on the device', async () => {
    const user = userEvent.setup()
    renderVoice(null)
    await user.click(await screen.findByRole('button', { name: 'Answer out loud' }))
    expect(await screen.findByText(/need on-device speech recognition/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('explains a blocked microphone instead of pretending to listen', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine()
    renderVoice(engine)
    await switchOn(user)

    engine.state.handlers?.onFailure('denied')
    expect(await screen.findByText(/microphone is blocked/)).toBeInTheDocument()
    expect(engine.state.stopped).toBe(1)
  })

  it('tells the recogniser which phrases to expect', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine()
    renderVoice(engine)
    await switchOn(user)
    expect(engine.state.expected).toContain('again')
    expect(engine.state.expected).toContain('loved it')
  })
})
