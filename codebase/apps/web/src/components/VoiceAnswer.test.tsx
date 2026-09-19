import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpeechAvailability, SpeechEngine, SpeechHandlers } from '../audio/speech'
import { VoiceAnswer } from './VoiceAnswer'
import { VOICE_ANSWER_KEY } from './voiceAnswerPrefs'

/** A recogniser the test speaks through: it records what it was asked, and says things on command. */
function fakeEngine(availability: SpeechAvailability = 'available') {
  const state = { started: 0, stopped: 0, expected: [] as readonly string[], handlers: null as SpeechHandlers | null }
  const engine: SpeechEngine = {
    availableOnDevice: async () => availability,
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

beforeEach(() => {
  localStorage.clear()
})

describe('VoiceAnswer', () => {
  it('listens as soon as the screen appears, without being asked', async () => {
    const engine = fakeEngine()
    renderVoice(engine)
    expect(await screen.findByRole('button', { name: 'Stop listening for a spoken answer' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(engine.state.started).toBe(1)
    expect(screen.getByText('Listening — say how it went, and how it felt')).toBeInTheDocument()
  })

  it('hands both answers over from one sentence, and says back what it heard', async () => {
    const engine = fakeEngine()
    const { onAnswer } = renderVoice(engine)
    await screen.findByRole('button', { name: 'Stop listening for a spoken answer' })

    engine.state.handlers?.onTranscript('hard, but loved it')
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith({ difficulty: 'hard', feel: 'loved' }))
    expect(screen.getByText('hard, but loved it')).toBeInTheDocument()
  })

  it('says nothing to the summary when nothing said was an answer', async () => {
    const engine = fakeEngine()
    const { onAnswer } = renderVoice(engine)
    await screen.findByRole('button', { name: 'Stop listening for a spoken answer' })

    engine.state.handlers?.onTranscript('what time is it')
    expect(onAnswer).not.toHaveBeenCalled()
  })

  it('closes the microphone when turned off, and remembers that next time', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine()
    const { unmount } = renderVoice(engine)

    await user.click(await screen.findByRole('button', { name: 'Stop listening for a spoken answer' }))
    expect(engine.state.stopped).toBe(1)
    expect(screen.getByText('Voice answers are off')).toBeInTheDocument()
    expect(localStorage.getItem(VOICE_ANSWER_KEY)).toBe('off')

    unmount()
    renderVoice(fakeEngine())
    expect(await screen.findByRole('button', { name: 'Answer out loud' })).toBeInTheDocument()
  })

  it('closes the microphone when the summary goes away', async () => {
    const engine = fakeEngine()
    const { unmount } = renderVoice(engine)
    await screen.findByRole('button', { name: 'Stop listening for a spoken answer' })
    unmount()
    expect(engine.state.stopped).toBe(1)
  })

  it('offers the one-off download rather than listening, when the pack is not there', async () => {
    const user = userEvent.setup()
    const engine = fakeEngine('downloadable')
    renderVoice(engine)

    const offer = await screen.findByRole('button', { name: 'Answer out loud' })
    expect(engine.state.started).toBe(0)
    expect(screen.getByText(/nothing you say leaves this device/)).toBeInTheDocument()

    await user.click(offer)
    await waitFor(() => expect(engine.state.started).toBe(1))
  })

  it('says so plainly when the browser cannot recognise speech on the device', async () => {
    renderVoice(null)
    expect(await screen.findByText(/need on-device speech recognition/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('explains a blocked microphone instead of pretending to listen', async () => {
    const engine = fakeEngine()
    renderVoice(engine)
    await screen.findByRole('button', { name: 'Stop listening for a spoken answer' })

    engine.state.handlers?.onFailure('denied')
    expect(await screen.findByText(/microphone is blocked/)).toBeInTheDocument()
    expect(engine.state.stopped).toBe(1)
  })

  it('tells the recogniser which phrases to expect', () => {
    const engine = fakeEngine()
    renderVoice(engine)
    expect(engine.state.expected).toContain('again')
    expect(engine.state.expected).toContain('loved it')
  })
})
