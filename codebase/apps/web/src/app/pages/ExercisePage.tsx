import { useNavigate } from '@tanstack/react-router'
import { displayAccidentals } from '@jazz-master/theory'
import {
  CONTEXT_LABELS,
  STYLE_LABELS,
  TECHNIQUE_LABELS,
} from '../../components/facetLabels'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ClickIcon, ClockIcon, PlayIcon, SoundIcon, StopIcon } from '../../components/icons'
import { SourceTag } from '../../components/SourceTag'
import { DEFAULT_BEATS_PER_BAR, exerciseSeconds, homeLabel, isLibraryExerciseId, type Exercise } from '../../content'
import { Score } from '../../score/Score'
import { playerPrefs } from '../../components/playerPrefs'
import { useExercisePreview } from '../../player/useExercisePreview'
import { useViewFocus } from '../../components/useViewFocus'
import { useExerciseCatalog } from '../useExerciseCatalog'
import NotFoundPage from './NotFoundPage'
import { useParams } from '@tanstack/react-router'

/**
 * One exercise, read before it is played: what it is, what it trains, how it
 * is written, and one Play.
 *
 * Playing happens in a practice session and nowhere else, so Play does not
 * start a player here — it makes a session of this exercise alone and sends
 * the page to it. Everything the app records about practice then hangs off a
 * session, whether it was one exercise or ten.
 */
export default function ExercisePage() {
  // Loose params so the page also renders inside Storybook's ad hoc router;
  // the route file's loader already turned an unknown pack id into a 404.
  const { exerciseId } = useParams({ strict: false })
  const { byId, libraryPending } = useExerciseCatalog()
  const exercise = byId.get(exerciseId ?? '')

  if (!exercise) {
    // One of the user's own, and the library is still on its way: not yet a 404.
    if (libraryPending && isLibraryExerciseId(exerciseId ?? ''))
      return <p className="p-6 text-sm text-muted" role="status">Loading your exercise…</p>
    return <NotFoundPage />
  }

  return <ExerciseDetail key={exercise.id} exercise={exercise} />
}

const CHIP = 'rounded-full border border-line px-2 py-0.5 text-xs font-medium text-fg-2'

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const navigate = useNavigate()
  // Hearing it is not practising it: the preview plays once through, right here.
  const { playingId, toggle } = useExercisePreview()
  const previewing = playingId === exercise.id
  // ISSUE-002: arriving here from the list is a view swap as far as the
  // keyboard is concerned, so the title takes focus.
  const headingRef = useViewFocus<HTMLHeadingElement>('detail', { focusOnMount: true })
  const minutes = Math.max(Math.round(exerciseSeconds(exercise) / 60), 1)
  const home = homeLabel(exercise)
  const facets = [
    ...(exercise.styles ?? []).map((style) => STYLE_LABELS[style]),
    ...(exercise.contexts ?? []).map((context) => CONTEXT_LABELS[context]),
    ...(exercise.techniques ?? []).map((technique) => TECHNIQUE_LABELS[technique]),
  ]

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-2xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {exercise.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted tabular-nums">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_BADGE[exercise.area]}`}>
              {AREA_LABELS[exercise.area]}
            </span>
            <SourceTag exerciseId={exercise.id} />
            <span className="inline-flex items-center gap-1">
              <ClockIcon />~{minutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <ClickIcon />
              {exercise.tempoBpm} BPM
            </span>
            {home && <span>{displayAccidentals(home)}</span>}
            <span>Level {exercise.level}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Hearing it costs nothing and records nothing. */}
          <button
            type="button"
            onClick={() => toggle(exercise, playerPrefs().guitar)}
            aria-pressed={previewing}
            data-tip={previewing ? 'Stop the preview' : 'Hear it once through, without practising it'}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-panel px-3.5 py-2 text-sm font-medium text-fg hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg [&>svg]:h-3.5 [&>svg]:w-3.5"
          >
            {previewing ? <StopIcon /> : <SoundIcon />}
            Preview
          </button>
          {/* Practising it is a session of one: nothing plays outside a session. */}
          <button
            type="button"
            onClick={() => void navigate({ to: '/session', search: { x: exercise.id } })}
            data-tip="Practise this on its own, as a session of one"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg [&>svg]:h-3.5 [&>svg]:w-3.5"
          >
            <PlayIcon />
            Start session
          </button>
        </div>
      </div>

      {facets.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {facets.map((facet) => (
            <li key={facet} className={CHIP}>
              {facet}
            </li>
          ))}
        </ul>
      )}

      {/* How it is written, at rest: no cursor, nothing to seek, nothing to loop. */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-panel">
        <Score
          notes={exercise.notes}
          beatsPerBar={exercise.beatsPerBar ?? DEFAULT_BEATS_PER_BAR}
          keyName={exercise.key}
          view="both"
          currentIndex={null}
          loop={null}
          cursorVisible={false}
          aria-label={`${exercise.title} score, ${exercise.notes.length} notes`}
        />
      </div>

      {exercise.about && exercise.about.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="font-display text-base font-semibold tracking-tight text-fg">About this exercise</h2>
          {exercise.about.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-fg-2">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
