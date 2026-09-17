import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { PlayerAudio } from '../audio/engine'
import { VOICES } from '../audio/voices'
import { DEFAULT_BEATS_PER_BAR, noteIndexAt, type Exercise } from '../content'
import { formatBarBeat, formatSeconds } from '../player/formatting'
import type { LoopRegion, TempoLadder } from '../player/plan'
import { MAX_TEMPO, MIN_TEMPO } from '../player/transport'
import { usePlayerTransport } from '../player/usePlayerTransport'
import { Score, type ScoreHandle } from '../score/Score'
import { AboutPanel } from './AboutPanel'
import { Select } from './ui/Select'
import {
  BarIcon,
  BothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClearIcon,
  ClickIcon,
  CountInIcon,
  FullscreenIcon,
  GuitarIcon,
  GuitarPickIcon,
  InfoIcon,
  SlidersIcon,
  LoopEndIcon,
  LoopIcon,
  LoopStartIcon,
  MinusIcon,
  NextIcon,
  NotesIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RampIcon,
  RepeatIcon,
  ResetIcon,
  SkipBackIcon,
  TabIcon,
} from './icons'
import { clampZoom, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, type PlayerPrefs } from './playerPrefs'
import { useViewFocus } from './useViewFocus'

/**
 * The stage for one exercise: the score as a canvas, with the readouts,
 * the tool menus (loop, repeat, tempo ramp, sound, view) and the transport
 * floating over it. Session flow (begin, finish) is the runner's; this
 * component reports it and otherwise owns playback.
 */

interface ExercisePlayerProps {
  exercise: Exercise
  isFirst: boolean
  /** The lesson intro, shown with the first exercise's notes. */
  intro?: readonly string[]
  prefs: PlayerPrefs
  onPrefsChange: (prefs: PlayerPrefs) => void
  onBegin: () => void
  onFinish: () => void
  createAudio?: () => PlayerAudio
  now?: () => number
}

const REPEAT_CHOICES: Array<number | null> = [null, 2, 4, 8, 16]
const GUITAR_OPTIONS = VOICES.map((voice) => ({
  value: voice.id,
  label: voice.label,
  group: voice.kind === 'synth' ? 'Synthesized' : 'Sampled',
}))
const TEMPO_STEP = 4
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
// Base without a background: the "on" state sets its own, so neither wins by stylesheet order.
const ICON_BASE = `inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line text-fg hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`
const ICON_BUTTON = `${ICON_BASE} bg-panel hover:bg-panel-2`
const ICON_ON = `${ICON_BASE} border-fg bg-fg text-panel hover:border-fg`
const PLAY_BUTTON = `inline-flex h-10 w-16 cursor-pointer items-center justify-center rounded-xl bg-cta text-cta-fg hover:bg-cta-hover ${FOCUS}`
const FLOAT = 'rounded-2xl border border-line bg-panel/90 shadow-lg backdrop-blur-md'
const TOGGLE_ON = 'border-fg bg-fg text-panel'
const TOGGLE_OFF = 'border-line bg-panel text-fg-2 hover:border-line-strong'
const CHIP = `inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${FOCUS}`
const FIELD = `h-8 rounded-md border border-line bg-field px-2 text-sm text-fg tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg`

export function ExercisePlayer({
  exercise,
  isFirst,
  intro,
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
  // The intro opens with the exercise and steps aside when playing starts.
  const hasAbout = (isFirst && (intro?.length ?? 0) > 0) || (exercise.about?.length ?? 0) > 0
  const [aboutOpen, setAboutOpen] = useState(hasAbout)
  const toggleMenu = (id: MenuId) => setOpenMenu((current) => (current === id ? null : id))
  const stageRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const fullscreenAvailable = typeof document !== 'undefined' && typeof document.exitFullscreen === 'function'
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === stageRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  function toggleFullscreen(): void {
    if (!fullscreenAvailable) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void stageRef.current?.requestFullscreen?.()
  }
  const scoreRef = useRef<ScoreHandle>(null)
  const headingRef = useViewFocus<HTMLHeadingElement>(exercise.id, { focusOnMount: !isFirst })
  const ids = { tempo: useId(), repeat: useId() }

  // Apply the shared preferences to this exercise's transport.
  useEffect(() => transport.setClick(prefs.click), [transport, prefs.click])
  useEffect(() => transport.setVoice(prefs.voice), [transport, prefs.voice])
  useEffect(() => transport.setCountIn(prefs.countIn), [transport, prefs.countIn])
  useEffect(() => transport.setGuitar(prefs.guitar), [transport, prefs.guitar])

  // The cursor follows the transport every frame; React state only changes
  // when something visible in the chrome changes (note, bar, tempo).
  useEffect(() => {
    let frame = 0
    const tick = () => {
      const at = transport.position()
      // The count-in is one bar: walk the cursor in over it.
      scoreRef.current?.moveCursor(at.beat, playing, at.countInBeatsLeft / beatsPerBar)
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
      f: toggleFullscreen,
      i: () => setAboutOpen((open) => !open),
    }
    if (event.key === 'Escape' && (openMenu || aboutOpen)) {
      setOpenMenu(null)
      setAboutOpen(false)
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

  return (
    <section
      className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-panel"
      onKeyDown={onKeyDown}
      aria-label={`${exercise.title} player`}
    >
      <header className="px-4 pt-2 pb-1.5">
        {/* One line: the title, then what the title does not already say. */}
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-sm font-semibold tracking-tight text-fg focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-dashed focus-visible:outline-line-strong"
        >
          {exercise.title}{' '}
          <span className="ml-1 font-sans text-xs font-normal text-muted tabular-nums">
            {[
              exercise.key && !exercise.title.includes(`${exercise.key} major`) ? `${exercise.key} major` : null,
              `${beatsPerBar}/4`,
              `${exercise.tempoBpm} BPM`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </h2>
      </header>

      {/* The scene: the score is the canvas; the chrome and the intro float over it. */}
      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-b-2xl border-t border-line bg-panel-2/60 fullscreen:rounded-none fullscreen:border-0 fullscreen:bg-canvas"
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
          contentInset={{ top: 16, bottom: 120 }}
          zoom={prefs.zoom}
          aria-label={`${exercise.title} ${prefs.view === 'both' ? 'score' : prefs.view === 'tab' ? 'tab' : 'notation'}, ${exercise.notes.length} notes${
            started && currentIndex !== null ? `, on note ${currentIndex + 1}` : ''
          }`}
        />

        {/* Everything floats in one bar at the bottom, icons only, grouped by job; menus open upward. */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
          <div className={`${FLOAT} pointer-events-auto flex w-full flex-col items-stretch gap-1.5 px-3 py-2`}>
            {/* Main lane: tempo left, transport dead centre (Play in the middle of the screen), readouts right. */}
            {/* Equal side columns (minmax 0) so the transport, and Play, sit at the exact centre. */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3" data-lane="main">
            <div className="flex justify-start">
            <Group label="Readouts">
              <Readout
                label="Position"
                value={playing ? barBeat : formatBarBeat(transport.position().beat, beatsPerBar)}
                data-tip="Bar and beat under the cursor"
              />
              <Readout label="Passes" value={passLabel} data-tip="Passes through the loop so far" live />
              {secondsLeft !== null && (
                <Readout label="Time left" value={formatSeconds(secondsLeft)} data-tip="Playing time left on this exercise" />
              )}
            </Group>
            </div>
            <Group label="Transport">
              <IconButton onClick={() => transport.stop()} label="Back to the start" shortcut="Home" className="h-9 w-9"><SkipBackIcon /></IconButton>
              <IconButton onClick={() => seekBars(-1)} label="Previous bar" shortcut="←" className="h-9 w-9"><ChevronLeftIcon /></IconButton>
              {playing ? (
                <button
                  type="button"
                  onClick={() => transport.pause()}
                  aria-label={`Pause ${exercise.title}`}
                  data-tip="Pause (Space)"
                  className={PLAY_BUTTON}
                >
                  <PauseIcon />
                </button>
              ) : (
                <button type="button" onClick={play} aria-label={`Play ${exercise.title}`} data-tip="Play (Space)" className={PLAY_BUTTON}>
                  <PlayIcon />
                </button>
              )}
              <IconButton onClick={() => seekBars(1)} label="Next bar" shortcut="→" className="h-9 w-9"><ChevronRightIcon /></IconButton>
              <IconButton onClick={finish} label={`Next: finish ${exercise.title}`} data-tip="Finish this exercise and move to the next" className="h-9 w-9 border-line-strong">
              <NextIcon />
            </IconButton>
            </Group>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <Group label="Tempo">
              <IconButton onClick={() => transport.setTempo(snapshot.tempoBpm - TEMPO_STEP)} label="Slower" data-tip={`Slower by ${TEMPO_STEP} BPM`} shortcut="−"><MinusIcon /></IconButton>
              <label htmlFor={ids.tempo} className="sr-only">
                Tempo in BPM
              </label>
              <input
                id={ids.tempo}
                type="number"
                min={MIN_TEMPO}
                max={MAX_TEMPO}
                value={snapshot.tempoBpm}
                data-tip="Tempo in beats per minute"
                onChange={(event) => transport.setTempo(Number(event.target.value))}
                className={`${FIELD} h-7 w-14 text-center font-display text-sm font-semibold`}
              />
              <IconButton onClick={() => transport.setTempo(snapshot.tempoBpm + TEMPO_STEP)} label="Faster" data-tip={`Faster by ${TEMPO_STEP} BPM`} shortcut="+"><PlusIcon /></IconButton>
              {snapshot.tempoBpm !== exercise.tempoBpm && (
                <IconButton onClick={() => transport.setTempo(exercise.tempoBpm)} label={`Reset to ${exercise.tempoBpm}`} data-tip={`Back to the exercise tempo, ${exercise.tempoBpm} BPM`}><ResetIcon /></IconButton>
              )}
              <IconButton
                onClick={() => setLadder(snapshot.ladder ? null : {})}
                pressed={snapshot.ladder !== null}
                label={`Tempo ramp: ${snapshot.ladder ? `+${snapshot.ladder.stepBpm}/${snapshot.ladder.everyPasses} → ${snapshot.ladder.toBpm}` : 'off'}`}
                data-tip={`Tempo ramp ${snapshot.ladder ? `on: +${snapshot.ladder.stepBpm} BPM every ${snapshot.ladder.everyPasses} passes up to ${snapshot.ladder.toBpm}` : 'off'}. Raise the tempo every few passes`}
              >
                <RampIcon />
              </IconButton>
              <Menu
                id="ramp"
                label="Tempo ramp settings"
                icon={<SlidersIcon />}
                value={snapshot.ladder ? `+${snapshot.ladder.stepBpm}/${snapshot.ladder.everyPasses} → ${snapshot.ladder.toBpm}` : 'off'}
                badge={null}
                data-tip="Tempo ramp settings: step, passes per step and target"
                active={false}
                open={openMenu === 'ramp'}
                onToggle={toggleMenu}
              >
                <p className="text-xs text-muted">Raise the tempo by a step every few passes, up to a target.</p>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-fg-2" data-ramp-settings>
                  <span>+</span>
                  <NumberField label="BPM per step" data-tip="BPM added at each step" value={snapshot.ladder?.stepBpm ?? 4} min={1} max={60} onChange={(stepBpm) => setLadder({ stepBpm })} />
                  <span>every</span>
                  <NumberField label="Passes per step" data-tip="Passes between steps" value={snapshot.ladder?.everyPasses ?? 2} min={1} max={20} onChange={(everyPasses) => setLadder({ everyPasses })} />
                  <span>passes →</span>
                  <NumberField label="Target tempo" data-tip="Tempo the ramp stops at" value={snapshot.ladder?.toBpm ?? Math.min(snapshot.tempoBpm + 40, MAX_TEMPO)} min={MIN_TEMPO} max={MAX_TEMPO} onChange={(toBpm) => setLadder({ toBpm })} />
                </div>
                <p className="mt-2 text-[11px] text-muted">Changing a setting switches the ramp on.</p>
              </Menu>
              {snapshot.ladder && tempoNow !== snapshot.tempoBpm && (
                <span className="text-xs text-accent-text tabular-nums" data-tip="Tempo of the current pass on the ramp">
                  now {tempoNow}
                </span>
              )}
            </Group>
              <button
                type="button"
                onClick={() => setAboutOpen((open) => !open)}
                aria-pressed={aboutOpen}
                aria-label="About this exercise"
                data-tip="About this exercise: the theory and the shape on the neck (I)"
                className={`${ICON_BASE} ${aboutOpen ? 'border-accent bg-accent text-on-accent' : 'border-accent/60 bg-accent/15 text-accent-text hover:bg-accent/25'}`}
              >
                <InfoIcon />
              </button>
            </div>



            </div>
            {/* Second lane: the rest, smaller, one click each. */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5" data-lane="more">
            <Group label="Practice">
              <Menu
                id="loop"
                label="Loop"
                icon={<LoopIcon />}
                value={snapshot.loop ? `beats ${snapshot.loop.startBeat + 1}–${snapshot.loop.endBeat}` : 'whole'}
                badge={snapshot.loop ? `${snapshot.loop.startBeat + 1}–${snapshot.loop.endBeat}` : null}
                data-tip={`Loop: ${snapshot.loop ? `beats ${snapshot.loop.startBeat + 1}–${snapshot.loop.endBeat}` : 'the whole exercise'}. Loop a part for detailed practice`}
                active={snapshot.loop !== null}
                open={openMenu === 'loop'}
                onToggle={toggleMenu}
              >
                <p className="text-xs text-muted">Press or drag on the bar numbers above the score, or:</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button type="button" onClick={loopCurrentBar} data-tip="Loop the bar under the cursor (L)" className={`${CHIP} ${TOGGLE_OFF}`}>
                    <BarIcon /> This bar
                  </button>
                  <button
                    type="button"
                    onClick={() => markLoop('start')}
                    className={`${CHIP} ${TOGGLE_OFF}`}
                    aria-label="Set loop start at cursor"
                    data-tip="Start the loop at the cursor ([)"
                  >
                    <LoopStartIcon /> Start here
                  </button>
                  <button
                    type="button"
                    onClick={() => markLoop('end')}
                    className={`${CHIP} ${TOGGLE_OFF}`}
                    aria-label="Set loop end at cursor"
                    data-tip="End the loop at the cursor (])"
                  >
                    <LoopEndIcon /> End here
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoop(null)}
                    disabled={!snapshot.loop}
                    data-tip="Play the whole exercise again (⇧L)"
                    className={`${CHIP} ${TOGGLE_OFF} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <ClearIcon /> Clear
                  </button>
                </div>
              </Menu>

              <Menu
                id="repeat"
                label="Repeat"
                icon={<RepeatIcon />}
                value={snapshot.repeat === null ? '∞' : `${snapshot.repeat}×`}
                badge={snapshot.repeat === null ? '∞' : `${snapshot.repeat}×`}
                data-tip={`Repeat: ${snapshot.repeat === null ? 'until you stop' : `${snapshot.repeat} passes`}. How many passes to play before stopping`}
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
                      data-tip={choice === null ? 'Loop until you stop' : `Play ${choice} times`}
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
                    data-tip="Any number of passes"
                    onChange={(event) =>
                      transport.setRepeat(event.target.value === '' ? null : Number(event.target.value))
                    }
                    className={`${FIELD} w-14 text-center`}
                  />
                </div>
              </Menu>
            </Group>

            <Group label="Sound">
              <Toggle label="Click" icon={<ClickIcon />} data-tip="Click: metronome on every beat" checked={prefs.click} onChange={(click) => onPrefsChange({ ...prefs, click })} />
              <Toggle label="Count-in" icon={<CountInIcon />} data-tip="Count-in: one bar of clicks before the music starts" checked={prefs.countIn} onChange={(countIn) => onPrefsChange({ ...prefs, countIn })} />
              <Toggle label="Play along" icon={<GuitarIcon />} data-tip="Play along: a guitar plays the line with you" checked={prefs.voice} onChange={(voice) => onPrefsChange({ ...prefs, voice })} />
              <Select
                options={GUITAR_OPTIONS}
                value={prefs.guitar}
                onChange={(guitar) => onPrefsChange({ ...prefs, guitar })}
                aria-label="Guitar"
                data-tip="Guitar for playing along"
                placement="above"
                icon={<GuitarPickIcon />}
              />
            </Group>

            <Group label="View">
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Score view">
                {(
                  [
                    ['tab', 'Tab', <TabIcon key="tab" />, 'Tablature only'],
                    ['notation', 'Notes', <NotesIcon key="notes" />, 'Standard notation only'],
                    ['both', 'Both', <BothIcon key="both" />, 'Notation over tablature'],
                  ] as const
                ).map(([choice, text, icon, description]) => (
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
              <IconButton
                onClick={() => onPrefsChange({ ...prefs, zoom: clampZoom(prefs.zoom - ZOOM_STEP) })}
                disabled={prefs.zoom <= ZOOM_MIN}
                label="Smaller score"
              >
                <MinusIcon />
              </IconButton>
              <span className="w-10 text-center text-xs font-semibold text-fg tabular-nums" aria-live="polite" data-tip="Score magnification">
                {Math.round(prefs.zoom * 100)}%
              </span>
              <IconButton
                onClick={() => onPrefsChange({ ...prefs, zoom: clampZoom(prefs.zoom + ZOOM_STEP) })}
                disabled={prefs.zoom >= ZOOM_MAX}
                label="Larger score"
              >
                <PlusIcon />
              </IconButton>
            </Group>

            <Group label="Help">
              {fullscreenAvailable && (
                <IconButton onClick={toggleFullscreen} pressed={fullscreen} label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} shortcut="F">
                  <FullscreenIcon exit={fullscreen} />
                </IconButton>
              )}
            </Group>
            </div>
          </div>
        </div>
        {/* The intro is a drawer down the full height of the screen, sliding in
            over a light backdrop that closes it when pressed. */}
        {aboutOpen && (
          <>
            <div
              className="fade-in fixed inset-0 z-10 bg-fg/15 backdrop-blur-[1px]"
              onPointerDown={() => setAboutOpen(false)}
              data-about-backdrop
            />
            <div className="drawer-in fixed inset-y-0 right-0 z-20 w-[38%] max-w-xl min-w-[320px]">
              <AboutPanel exercise={exercise} intro={isFirst ? intro : undefined} onClose={() => setAboutOpen(false)} />
            </div>
          </>
        )}
      </div>

      {snapshot.audioUnavailable && (
        <p role="alert" className="border-t border-line px-5 py-3 text-sm text-danger-text">
          The click is unavailable in this browser. The cursor still runs; play along with your own count.
        </p>
      )}
    </section>
  )
}

type MenuId = 'loop' | 'repeat' | 'ramp' | 'view'

/** A labelled popover: the button shows the setting's current value, the panel holds its controls. */
function Menu({
  id,
  label,
  icon,
  value,
  badge,
  'data-tip': tip,
  active,
  open,
  onToggle,
  children,
}: {
  id: MenuId
  label: string
  icon: ReactNode
  value: string
  /** Tiny text on the button when there is a setting worth showing. */
  badge: string | null
  'data-tip': string
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
        data-tip={tip}
        className={`${ICON_BASE} relative ${open || active ? 'border-line-strong bg-panel-2' : 'bg-panel hover:bg-panel-2'} ${active ? 'text-accent-text' : ''}`}
      >
        {icon}
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-fg px-1 text-[9px] leading-[14px] font-bold text-panel tabular-nums">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          className="absolute bottom-full left-1/2 z-10 mb-2 min-w-64 -translate-x-1/2 rounded-xl border border-line bg-panel p-3 shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  )
}

/** A cluster of related controls, separated from its neighbours by a rule. */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 border-l border-line pl-2.5 first:border-l-0 first:pl-0">
      {children}
    </div>
  )
}

/** An icon-only button; the text lives in the tooltip and the accessible name. */
function IconButton({
  onClick,
  label,
  'data-tip': tip,
  shortcut,
  pressed,
  disabled,
  className = '',
  children,
}: {
  onClick: () => void
  label: string
  'data-tip'?: string
  shortcut?: string
  pressed?: boolean
  disabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      data-tip={`${tip ?? label}${shortcut ? ` (${shortcut})` : ''}`}
      className={`${ICON_BASE} ${className} ${pressed ? 'border-line-strong bg-panel-2 text-accent-text' : 'bg-panel hover:bg-panel-2'}`}
    >
      {children}
    </button>
  )
}

function Readout({ label, value, 'data-tip': tip, live = false }: { label: string; value: string; 'data-tip': string; live?: boolean }) {
  return (
    <p className="flex cursor-default flex-col leading-tight" aria-live={live ? 'polite' : undefined} data-tip={tip}>
      <span className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</span>
      <span className="font-display text-sm font-semibold text-fg tabular-nums">{value}</span>
    </p>
  )
}

function Toggle({
  label,
  icon,
  'data-tip': tip,
  checked,
  onChange,
}: {
  label: string
  icon: ReactNode
  'data-tip': string
  checked: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <label className={checked ? ICON_ON : ICON_BUTTON} data-tip={tip}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" aria-label={label} />
      <span className={checked ? 'text-accent' : 'text-muted'}>{icon}</span>
    </label>
  )
}

/** A numeric field that keeps what is being typed and commits only whole, in-range values. */
function NumberField({
  label,
  'data-tip': tip,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  'data-tip': string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
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
      data-tip={tip}
      value={text}
      min={min}
      max={max}
      onChange={(event) => {
        setText(event.target.value)
        const next = Number(event.target.value)
        if (event.target.value !== '' && Number.isInteger(next) && next >= min && next <= max) onChange(next)
      }}
      onBlur={() => setText(String(value))}
      className={`${FIELD} h-7 w-12 text-center text-xs`}
    />
  )
}
