import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { PlayerAudio } from '../audio/engine'
import { DEFAULT_BEATS_PER_BAR, noteIndexAt, type Exercise } from '../content'
import { formatBarBeat, formatSeconds } from '../player/formatting'
import type { LoopRegion, TempoLadder } from '../player/plan'
import { MAX_TEMPO, MIN_TEMPO } from '../player/transport'
import { usePlayerTransport } from '../player/usePlayerTransport'
import { Score, type ScoreHandle } from '../score/Score'
import type { PlayerPrefs } from './playerPrefs'
import { useViewFocus } from './useViewFocus'

/**
 * The stage for one exercise: the score with its cursor, and the transport
 * bar — play, tempo, loop, repeat, tempo ramp, count-in, click, play-along
 * voice and the view toggle. Session flow (begin, finish) is the runner's;
 * this component reports it and otherwise owns playback.
 */

interface ExercisePlayerProps {
  exercise: Exercise
  isFirst: boolean
  prefs: PlayerPrefs
  onPrefsChange: (prefs: PlayerPrefs) => void
  onBegin: () => void
  onFinish: () => void
  createAudio?: () => PlayerAudio
  now?: () => number
}

const REPEAT_CHOICES: Array<number | null> = [null, 2, 4, 8, 16]
const TEMPO_STEP = 4
const ICON_BUTTON =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-fg hover:border-line-strong hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:opacity-40'
const TOGGLE_ON = 'border-fg bg-fg text-panel'
const TOGGLE_OFF = 'border-line bg-panel text-fg-2 hover:border-line-strong'
const PLAY_BUTTON =
  'inline-flex h-10 min-w-26 items-center justify-center gap-2 rounded-xl bg-cta px-4 font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const FLOAT = 'rounded-2xl border border-line bg-panel/90 shadow-lg backdrop-blur-md'
const CHIP =
  'rounded-md border px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const FIELD =
  'h-8 rounded-md border border-line bg-field px-2 text-sm text-fg tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg'

export function ExercisePlayer({
  exercise,
  isFirst,
  prefs,
  onPrefsChange,
  onBegin,
  onFinish,
  createAudio,
  now,
}: ExercisePlayerProps) {
  const beatsPerBar = exercise.beatsPerBar ?? DEFAULT_BEATS_PER_BAR
  const { transport, snapshot } = usePlayerTransport(exercise, { createAudio, now })
  const playing = snapshot.status === 'playing'
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [barBeat, setBarBeat] = useState(() => formatBarBeat(0, beatsPerBar))
  const [tempoNow, setTempoNow] = useState(snapshot.tempoBpm)
  const [countingIn, setCountingIn] = useState(false)
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null)
  const toggleMenu = (id: MenuId) => setOpenMenu((current) => (current === id ? null : id))
  const scoreRef = useRef<ScoreHandle>(null)
  const headingRef = useViewFocus<HTMLHeadingElement>(exercise.id, { focusOnMount: !isFirst })
  const ids = { tempo: useId(), repeat: useId() }

  // Apply the shared preferences to this exercise's transport.
  useEffect(() => transport.setClick(prefs.click), [transport, prefs.click])
  useEffect(() => transport.setVoice(prefs.voice), [transport, prefs.voice])
  useEffect(() => transport.setCountIn(prefs.countIn), [transport, prefs.countIn])

  // The cursor follows the transport every frame; React state only changes
  // when something visible in the chrome changes (note, bar, tempo).
  useEffect(() => {
    let frame = 0
    const tick = () => {
      const at = transport.position()
      scoreRef.current?.moveCursor(at.beat, playing)
      const index = noteIndexAt(exercise.notes, at.beat)
      setCurrentIndex((previous) => (previous === index ? previous : index))
      const label = formatBarBeat(at.beat, beatsPerBar)
      setBarBeat((previous) => (previous === label ? previous : label))
      setTempoNow((previous) => (previous === at.tempoBpm ? previous : at.tempoBpm))
      const inCountIn = at.phase === 'count-in'
      setCountingIn((previous) => (previous === inCountIn ? previous : inCountIn))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [transport, playing, exercise.notes, beatsPerBar])

  // Clocked exercises: the timer counts playing time and ends the exercise.
  const totalSeconds = exercise.duration.kind === 'minutes' ? exercise.duration.minutes * 60 : null
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const playedRef = useRef(0)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  const expiredRef = useRef(false)
  useEffect(() => {
    if (totalSeconds === null || !playing) return
    let last = Date.now()
    const id = setInterval(() => {
      const current = Date.now()
      playedRef.current += (current - last) / 1000
      last = current
      const left = Math.max(totalSeconds - playedRef.current, 0)
      setSecondsLeft((previous) => (Math.ceil(previous ?? 0) === Math.ceil(left) ? previous : left))
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true
        transport.pause()
        finishRef.current()
      }
    }, 250)
    return () => clearInterval(id)
  }, [playing, totalSeconds, transport])

  // A repetitions exercise ends itself when its run finishes on the whole tab.
  const runFinished = snapshot.finished && snapshot.loop === null
  useEffect(() => {
    if (runFinished && exercise.duration.kind === 'repetitions') finishRef.current()
  }, [runFinished, exercise.duration.kind])

  function play(): void {
    if (!started) {
      setStarted(true)
      onBegin()
    }
    transport.play()
  }

  function finish(): void {
    transport.pause()
    onFinish()
  }

  function seekBars(delta: number): void {
    const at = transport.position()
    const bar = Math.floor(at.beat / beatsPerBar + 1e-9)
    transport.seek((bar + delta) * beatsPerBar)
  }

  function setLoop(loop: LoopRegion | null): void {
    transport.setLoop(loop)
  }

  function loopCurrentBar(): void {
    const at = transport.position()
    const bar = Math.floor(at.beat / beatsPerBar + 1e-9)
    setLoop({ startBeat: bar * beatsPerBar, endBeat: (bar + 1) * beatsPerBar })
  }

  function markLoop(edge: 'start' | 'end'): void {
    const beat = Math.round(transport.position().beat * 2) / 2
    const current = snapshot.loop ?? { startBeat: 0, endBeat: snapshot.totalBeats }
    setLoop(edge === 'start' ? { ...current, startBeat: beat } : { ...current, endBeat: beat })
  }

  function setLadder(patch: Partial<TempoLadder> | null): void {
    if (patch === null) {
      transport.setLadder(null)
      return
    }
    const base = snapshot.ladder ?? { stepBpm: 4, everyPasses: 2, toBpm: Math.min(snapshot.tempoBpm + 40, MAX_TEMPO) }
    transport.setLadder({ ...base, ...patch })
  }

  function onKeyDown(event: React.KeyboardEvent): void {
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return
    const handlers: Record<string, () => void> = {
      ' ': () => (playing ? transport.pause() : play()),
      Home: () => transport.stop(),
      ArrowLeft: () => seekBars(-1),
      ArrowRight: () => seekBars(1),
      '[': () => markLoop('start'),
      ']': () => markLoop('end'),
      l: loopCurrentBar,
      L: () => setLoop(null),
      '+': () => transport.setTempo(snapshot.tempoBpm + TEMPO_STEP),
      '=': () => transport.setTempo(snapshot.tempoBpm + TEMPO_STEP),
      '-': () => transport.setTempo(snapshot.tempoBpm - TEMPO_STEP),
    }
    if (event.key === 'Escape' && openMenu) {
      setOpenMenu(null)
      return
    }
    const handler = handlers[event.key]
    if (!handler) return
    event.preventDefault()
    handler()
  }

  const passLabel =
    snapshot.repeat === null
      ? `Pass ${snapshot.pass + (playing && !countingIn ? 1 : 0)}`
      : snapshot.finished
        ? `${snapshot.pass} of ${snapshot.repeat} passes`
        : `Pass ${Math.min(snapshot.pass + 1, snapshot.repeat)} of ${snapshot.repeat}`

  const transportButtons = (
    <>
      <button type="button" onClick={() => transport.stop()} className={ICON_BUTTON} aria-label="Back to start">
        <StopIcon />
      </button>
      <button type="button" onClick={() => seekBars(-1)} className={ICON_BUTTON} aria-label="Previous bar">
        <ChevronIcon direction="left" />
      </button>
      {playing ? (
        <button
          type="button"
          onClick={() => transport.pause()}
          aria-label={`Pause ${exercise.title}`}
          className={PLAY_BUTTON}
        >
          <PauseIcon /> Pause
        </button>
      ) : (
        <button type="button" onClick={play} aria-label={`Play ${exercise.title}`} className={PLAY_BUTTON}>
          <PlayIcon /> Play
        </button>
      )}
      <button type="button" onClick={() => seekBars(1)} className={ICON_BUTTON} aria-label="Next bar">
        <ChevronIcon direction="right" />
      </button>
    </>
  )

  return (
    <section
      className="mt-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-panel shadow-[0_1px_0_var(--c-line)]"
      onKeyDown={onKeyDown}
      aria-label={`${exercise.title} player`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4 pb-3">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-lg font-semibold tracking-tight text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {exercise.title}
        </h2>
        <p className="text-sm text-muted tabular-nums">
          {exercise.key ? `${exercise.key} major · ` : ''}
          {beatsPerBar}/4 · {exercise.tempoBpm} BPM
        </p>
      </header>

      {/* The scene: the score is the canvas, everything else floats over it. */}
      <div
        className="relative mx-2 mb-2 min-h-[420px] flex-1 overflow-hidden rounded-xl border border-line bg-panel-2/70"
        data-stage
      >
        <Score
          ref={scoreRef}
          notes={exercise.notes}
          beatsPerBar={beatsPerBar}
          keyName={exercise.key}
          view={prefs.view}
          currentIndex={started ? currentIndex : null}
          loop={snapshot.loop}
          cursorVisible={started}
          onSeek={(beat) => transport.seek(beat)}
          onLoopChange={setLoop}
          className="absolute inset-0"
          contentInset={{ top: 76, bottom: 100 }}
          aria-label={`${exercise.title} ${prefs.view === 'both' ? 'score' : prefs.view === 'tab' ? 'tab' : 'notation'}, ${exercise.notes.length} notes${
            started && currentIndex !== null ? `, on note ${currentIndex + 1}` : ''
          }`}
        />

        {/* Top: readouts on the left, tool menus on the right. */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
          <div className={`${FLOAT} pointer-events-auto flex items-center gap-5 px-4 py-2`}>
            <Readout
              label="Position"
              value={playing ? barBeat : formatBarBeat(transport.position().beat, beatsPerBar)}
            />
            <Readout label="Passes" value={passLabel} live />
            {secondsLeft !== null && <Readout label="Time left" value={formatSeconds(secondsLeft)} />}
            {countingIn && (
              <span className="rounded-md bg-accent/20 px-2 py-1 text-xs font-semibold text-accent-text" aria-live="polite">
                Counting in
              </span>
            )}
          </div>
          <div className={`${FLOAT} pointer-events-auto flex flex-wrap items-center gap-1.5 p-1.5`}>
            <Menu
              id="loop"
              label="Loop"
              value={snapshot.loop ? `beats ${snapshot.loop.startBeat + 1}–${snapshot.loop.endBeat}` : 'whole'}
              active={snapshot.loop !== null}
              open={openMenu === 'loop'}
              onToggle={toggleMenu}
            >
              <p className="text-xs text-muted">Drag on the bar numbers above the score to loop a range, or:</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={loopCurrentBar} className={`${CHIP} ${TOGGLE_OFF}`}>
                  This bar
                </button>
                <button type="button" onClick={() => markLoop('start')} className={`${CHIP} ${TOGGLE_OFF}`} aria-label="Set loop start at cursor">
                  [ A
                </button>
                <button type="button" onClick={() => markLoop('end')} className={`${CHIP} ${TOGGLE_OFF}`} aria-label="Set loop end at cursor">
                  B ]
                </button>
                <button
                  type="button"
                  onClick={() => setLoop(null)}
                  disabled={!snapshot.loop}
                  className={`${CHIP} ${TOGGLE_OFF} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  Clear
                </button>
              </div>
            </Menu>

            <Menu
              id="repeat"
              label="Repeat"
              value={snapshot.repeat === null ? '∞' : `${snapshot.repeat}×`}
              active={snapshot.repeat !== null}
              open={openMenu === 'repeat'}
              onToggle={toggleMenu}
            >
              <p className="text-xs text-muted">Passes through the loop before the player stops.</p>
              <div className="mt-2 flex items-center gap-1.5">
                {REPEAT_CHOICES.map((choice) => (
                  <button
                    key={choice ?? 'loop'}
                    type="button"
                    onClick={() => transport.setRepeat(choice)}
                    aria-pressed={snapshot.repeat === choice}
                    className={`${CHIP} ${snapshot.repeat === choice ? TOGGLE_ON : TOGGLE_OFF}`}
                  >
                    {choice === null ? '∞' : `${choice}×`}
                  </button>
                ))}
                <label htmlFor={ids.repeat} className="sr-only">
                  Custom repeat count
                </label>
                <input
                  id={ids.repeat}
                  type="number"
                  min={1}
                  max={99}
                  value={snapshot.repeat ?? ''}
                  placeholder="n"
                  onChange={(event) =>
                    transport.setRepeat(event.target.value === '' ? null : Number(event.target.value))
                  }
                  className={`${FIELD} w-14 text-center`}
                />
              </div>
            </Menu>

            <Menu
              id="ramp"
              label="Tempo ramp"
              value={snapshot.ladder ? `+${snapshot.ladder.stepBpm}/${snapshot.ladder.everyPasses} → ${snapshot.ladder.toBpm}` : 'off'}
              active={snapshot.ladder !== null}
              open={openMenu === 'ramp'}
              onToggle={toggleMenu}
            >
              <p className="text-xs text-muted">Raise the tempo every few passes until a target.</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLadder(snapshot.ladder ? null : {})}
                  aria-pressed={snapshot.ladder !== null}
                  className={`${CHIP} ${snapshot.ladder ? TOGGLE_ON : TOGGLE_OFF}`}
                >
                  {snapshot.ladder ? 'Ramp on' : 'Ramp off'}
                </button>
                {snapshot.ladder && (
                  <div className="flex items-center gap-1.5 text-sm text-fg-2">
                    <span>+</span>
                    <NumberField label="BPM per step" value={snapshot.ladder.stepBpm} min={1} max={60} onChange={(stepBpm) => setLadder({ stepBpm })} />
                    <span>every</span>
                    <NumberField label="Passes per step" value={snapshot.ladder.everyPasses} min={1} max={20} onChange={(everyPasses) => setLadder({ everyPasses })} />
                    <span>passes, up to</span>
                    <NumberField label="Target tempo" value={snapshot.ladder.toBpm} min={MIN_TEMPO} max={MAX_TEMPO} onChange={(toBpm) => setLadder({ toBpm })} />
                  </div>
                )}
              </div>
            </Menu>

            <Menu
              id="sound"
              label="Sound"
              value={[prefs.click && 'click', prefs.voice && 'guide', prefs.countIn && 'count-in'].filter(Boolean).join(' · ') || 'silent'}
              active={false}
              open={openMenu === 'sound'}
              onToggle={toggleMenu}
            >
              <div className="flex items-center gap-1.5">
                <Toggle label="Click" checked={prefs.click} onChange={(click) => onPrefsChange({ ...prefs, click })} />
                <Toggle label="Play along" checked={prefs.voice} onChange={(voice) => onPrefsChange({ ...prefs, voice })} />
                <Toggle label="Count-in" checked={prefs.countIn} onChange={(countIn) => onPrefsChange({ ...prefs, countIn })} />
              </div>
            </Menu>

            <Menu
              id="view"
              label="View"
              value={prefs.view === 'tab' ? 'tab' : prefs.view === 'notation' ? 'notes' : 'both'}
              active={false}
              open={openMenu === 'view'}
              onToggle={toggleMenu}
            >
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Score view">
                {(['tab', 'notation', 'both'] as const).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    role="radio"
                    aria-checked={prefs.view === choice}
                    onClick={() => onPrefsChange({ ...prefs, view: choice })}
                    className={`${CHIP} ${prefs.view === choice ? TOGGLE_ON : TOGGLE_OFF}`}
                  >
                    {choice === 'tab' ? 'Tab' : choice === 'notation' ? 'Notes' : 'Both'}
                  </button>
                ))}
              </div>
            </Menu>
          </div>
        </div>

        {/* Bottom: the transport and tempo, centred; Next at the right. */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-center gap-2">
          <div className={`${FLOAT} pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2`}>
            <div className="flex items-center gap-1.5">{transportButtons}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted">Tempo</span>
              <button
                type="button"
                onClick={() => transport.setTempo(snapshot.tempoBpm - TEMPO_STEP)}
                className={`${ICON_BUTTON} h-8 w-8`}
                aria-label="Slower"
              >
                −
              </button>
              <label htmlFor={ids.tempo} className="sr-only">
                Tempo in BPM
              </label>
              <input
                id={ids.tempo}
                type="number"
                min={MIN_TEMPO}
                max={MAX_TEMPO}
                value={snapshot.tempoBpm}
                onChange={(event) => transport.setTempo(Number(event.target.value))}
                className={`${FIELD} w-18 text-center font-display text-base font-semibold`}
              />
              <button
                type="button"
                onClick={() => transport.setTempo(snapshot.tempoBpm + TEMPO_STEP)}
                className={`${ICON_BUTTON} h-8 w-8`}
                aria-label="Faster"
              >
                +
              </button>
              {snapshot.tempoBpm !== exercise.tempoBpm && (
                <button
                  type="button"
                  onClick={() => transport.setTempo(exercise.tempoBpm)}
                  className={`${CHIP} ${TOGGLE_OFF}`}
                >
                  Reset to {exercise.tempoBpm}
                </button>
              )}
              {snapshot.ladder && tempoNow !== snapshot.tempoBpm && (
                <span className="text-xs text-accent-text tabular-nums">now {tempoNow}</span>
              )}
            </div>
            <button
              type="button"
              onClick={finish}
              aria-label={`Next: finish ${exercise.title}`}
              className="rounded-lg border border-line-strong bg-panel px-4 py-2 font-medium text-fg hover:border-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <p className="px-5 pb-3 text-xs text-muted">
        Space play/pause · ← → bar · Home start · [ ] loop points · L this bar · ⇧L clear · + − tempo · Esc close menu
      </p>
      {snapshot.audioUnavailable && (
        <p role="alert" className="border-t border-line px-5 py-3 text-sm text-danger-text">
          The click is unavailable in this browser. The cursor still runs; play along with your own count.
        </p>
      )}
    </section>
  )
}

type MenuId = 'loop' | 'repeat' | 'ramp' | 'sound' | 'view'

/** A labelled popover: the button shows the setting's current value, the panel holds its controls. */
function Menu({
  id,
  label,
  value,
  active,
  open,
  onToggle,
  children,
}: {
  id: MenuId
  label: string
  value: string
  active: boolean
  open: boolean
  onToggle: (id: MenuId) => void
  children: ReactNode
}) {
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onToggle(id)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, id, onToggle])
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label}: ${value}`}
        className={`${CHIP} inline-flex items-center gap-1.5 ${open || active ? 'border-line-strong bg-panel-2 text-fg' : TOGGLE_OFF}`}
      >
        <span className="text-muted">{label}</span>
        <span className={active ? 'text-accent-text' : undefined}>{value}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          className="absolute top-full right-0 z-10 mt-1.5 min-w-64 rounded-xl border border-line bg-panel p-3 shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  )
}

function Readout({ label, value, live = false }: { label: string; value: string; live?: boolean }) {
  return (
    <p className="flex flex-col leading-tight" aria-live={live ? 'polite' : undefined}>
      <span className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</span>
      <span className="font-display text-base font-semibold text-fg tabular-nums">{value}</span>
    </p>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className={`${CHIP} flex cursor-pointer items-center gap-1.5 ${checked ? TOGGLE_ON : TOGGLE_OFF}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
      <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${checked ? 'bg-accent' : 'bg-line-strong'}`} />
      {label}
    </label>
  )
}

/** A numeric field that keeps what is being typed and commits only whole, in-range values. */
function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const [text, setText] = useState(String(value))
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setText(String(value))
  }
  return (
    <input
      type="number"
      aria-label={label}
      value={text}
      min={min}
      max={max}
      onChange={(event) => {
        setText(event.target.value)
        const next = Number(event.target.value)
        if (event.target.value !== '' && Number.isInteger(next) && next >= min && next <= max) onChange(next)
      }}
      onBlur={() => setText(String(value))}
      className={`${FIELD} w-16 text-center`}
    />
  )
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  )
}
function PlayIcon() {
  return <Icon><path d="M3 2.5v11l10-5.5z" /></Icon>
}
function PauseIcon() {
  return <Icon><path d="M3 2.5h3.5v11H3zM9.5 2.5H13v11H9.5z" /></Icon>
}
function StopIcon() {
  return <Icon><path d="M3 3h10v10H3z" /></Icon>
}
function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" width={10} height={10} fill="currentColor" aria-hidden="true">
      <path d="M2.5 5.5 8 11l5.5-5.5-1.4-1.4L8 8.2 3.9 4.1z" />
    </svg>
  )
}
function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <Icon>
      {direction === 'left' ? <path d="M10.5 2.5 5 8l5.5 5.5 1.4-1.4L7.8 8l4.1-4.1z" /> : <path d="M5.5 2.5 11 8l-5.5 5.5-1.4-1.4L8.2 8 4.1 3.9z" />}
    </Icon>
  )
}
