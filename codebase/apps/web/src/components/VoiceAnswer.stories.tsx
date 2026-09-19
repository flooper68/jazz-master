import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { SpeechAvailability, SpeechEngine, SpeechHandlers } from '../audio/speech'
import { VoiceAnswer } from './VoiceAnswer'

/** A recogniser that never opens a microphone: Storybook hears what the story says it hears. */
function storyEngine(availability: SpeechAvailability, says?: string): (expected: readonly string[]) => SpeechEngine | null {
  return () => ({
    availableOnDevice: async () => availability,
    install: async () => true,
    listen: (handlers: SpeechHandlers) => ({
      start: () => {
        if (says) setTimeout(() => handlers.onTranscript(says), 1400)
      },
      stop: () => {},
    }),
  })
}

const meta = {
  title: 'Components/VoiceAnswer',
  component: VoiceAnswer,
  render: (args) => <div className="mx-auto max-w-sm rounded-2xl border border-line bg-panel p-4"><VoiceAnswer {...args} /></div>,
  args: { onAnswer: fn(), createEngine: storyEngine('available') },
  parameters: { docs: { description: { component: 'The summary answered out loud. Recognition is on-device or it does not happen: the mic is never a way for practice audio to leave the machine. Listening starts on its own where the language pack is installed, and the mic is always the off switch.' } } },
} satisfies Meta<typeof VoiceAnswer>
export default meta
type Story = StoryObj<typeof meta>

export const Listening: Story = {}
export const HearsAnAnswer: Story = {
  args: { createEngine: storyEngine('available', 'hard, but loved it') },
  parameters: { docs: { description: { story: 'A second and a half in, the story speaks — one sentence answering both questions.' } } },
}
export const NeedsTheVoicePack: Story = { args: { createEngine: storyEngine('downloadable') } }
export const NoOnDeviceRecognition: Story = { args: { createEngine: () => null } }
