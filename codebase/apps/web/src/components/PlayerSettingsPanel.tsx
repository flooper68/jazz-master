import type { ReactNode } from 'react'
import { VOICES } from '../audio/voices'
import { BothIcon, MinusIcon, NotesIcon, PlusIcon, TabIcon } from './icons'
import { clampZoom, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, type PlayerPrefs } from './playerPrefs'
import { Select } from './ui/Select'

/**
 * The choices that outlive one exercise — what is heard and what is read.
 * They sit in two places, and deliberately look the same in both: behind the
 * player's Advanced button while an exercise is on the stage, and under the
 * account menu when there is no player to open.
 */

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const ICON_BASE = `inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line text-fg hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`
const ICON_BUTTON = `${ICON_BASE} bg-panel hover:bg-panel-2`
const ICON_ON = `${ICON_BASE} border-fg bg-fg text-panel hover:border-fg`

const GUITAR_OPTIONS = VOICES.map((voice) => ({
  value: voice.id,
  label: voice.label,
  group: voice.kind === 'synth' ? 'Synthesized' : 'Sampled',
}))

const VIEW_CHOICES = [
  ['tab', 'Tab', <TabIcon key="tab" />, 'Tablature only'],
  ['notation', 'Notes', <NotesIcon key="notes" />, 'Standard notation only'],
  ['both', 'Both', <BothIcon key="both" />, 'Notation over tablature'],
] as const

export interface PlayerSettingsPanelProps {
  prefs: PlayerPrefs
  onPrefsChange: (prefs: PlayerPrefs) => void
}

export function PlayerSettingsPanel({ prefs, onPrefsChange }: PlayerSettingsPanelProps) {
  return (
    <div className="space-y-5" data-player-settings>
      <SettingsSection title="Sound">
        <SwitchRow
          label="Click"
          hint="A metronome on every beat."
          checked={prefs.click}
          onChange={(click) => onPrefsChange({ ...prefs, click })}
        />
        <SwitchRow
          label="Count-in"
          hint="One bar of clicks before the music starts."
          checked={prefs.countIn}
          onChange={(countIn) => onPrefsChange({ ...prefs, countIn })}
        />
        <SwitchRow
          label="Play along"
          hint="A guitar plays the line with you."
          checked={prefs.voice}
          onChange={(voice) => onPrefsChange({ ...prefs, voice })}
        />
        <SettingsRow label="Guitar" hint="Which guitar plays along.">
          <Select
            options={GUITAR_OPTIONS}
            value={prefs.guitar}
            onChange={(guitar) => onPrefsChange({ ...prefs, guitar })}
            aria-label="Guitar"
            data-tip="Guitar for playing along"
            compact
            className="w-44"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="View">
        <SettingsRow label="Score" hint="What the stage shows.">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Score view">
            {VIEW_CHOICES.map(([choice, text, icon, description]) => (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={prefs.view === choice}
                aria-label={text}
                data-tip={`${text}: ${description}`}
                onClick={() => onPrefsChange({ ...prefs, view: choice })}
                className={prefs.view === choice ? ICON_ON : ICON_BUTTON}
              >
                {icon}
              </button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label="Size" hint="How big the engraving is.">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPrefsChange({ ...prefs, zoom: clampZoom(prefs.zoom - ZOOM_STEP) })}
              disabled={prefs.zoom <= ZOOM_MIN}
              aria-label="Smaller score"
              className={ICON_BUTTON}
            >
              <MinusIcon />
            </button>
            <span className="w-12 text-center text-xs font-semibold text-fg tabular-nums" aria-live="polite">
              {Math.round(prefs.zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => onPrefsChange({ ...prefs, zoom: clampZoom(prefs.zoom + ZOOM_STEP) })}
              disabled={prefs.zoom >= ZOOM_MAX}
              aria-label="Larger score"
              className={ICON_BUTTON}
            >
              <PlusIcon />
            </button>
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">{title}</h3>
      <div className="divide-y divide-line rounded-xl border border-line">{children}</div>
    </section>
  )
}

/** One setting per line: what it is on the left, the control on the right. */
export function SettingsRow({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** A labelled on/off switch — the same choice the stage offers as an icon toggle. */
function SwitchRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        className={`size-5 shrink-0 cursor-pointer accent-cta ${FOCUS}`}
      />
    </label>
  )
}
