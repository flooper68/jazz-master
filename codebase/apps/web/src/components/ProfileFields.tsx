import { Checkbox, Radio } from './ui/Primitives'
import {
  MINUTES_PER_DAY_OPTIONS,
  PRACTICE_AREAS,
  type PracticeArea,
  type PracticeMinutesPerDay,
  type PracticeProfile,
  type SkillLevel,
} from '../appData/profile'
import { AREA_LABELS } from './profileFieldLabels'

/**
 * Form fields shared by the onboarding wizard and the profile page, so
 * first-run answers and later edits stay the same controls.
 */

const LEVEL_LABELS: Record<SkillLevel, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
}

const LEVELS: readonly SkillLevel[] = [1, 2, 3]

interface LevelFieldsProps {
  levels: PracticeProfile['levels']
  onChange: (levels: PracticeProfile['levels']) => void
}

export function LevelFields({ levels, onChange }: LevelFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      {PRACTICE_AREAS.map((area) => (
        <fieldset key={area}>
          <legend className="text-sm font-medium text-fg-2">
            {AREA_LABELS[area]}
          </legend>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
            {LEVELS.map((level) => (
              <label
                key={level}
                className="flex items-center gap-2 text-sm text-muted has-checked:text-fg"
              >
                <Radio
                  name={`level-${area}`}
                  checked={levels[area] === level}
                  onChange={() => onChange({ ...levels, [area]: level })}
                />
                {LEVEL_LABELS[level]}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

interface GoalAreaFieldsProps {
  goalAreas: PracticeArea[]
  onChange: (goalAreas: PracticeArea[]) => void
}

/** Checkboxes whose selection order is the priority order. */
export function GoalAreaFields({ goalAreas, onChange }: GoalAreaFieldsProps) {
  return (
    <fieldset>
      <legend className="text-sm text-muted">
        Pick in order of priority — first picked matters most.
      </legend>
      <div className="mt-2 flex flex-col gap-2">
        {PRACTICE_AREAS.map((area) => {
          const priority = goalAreas.indexOf(area)
          const checked = priority !== -1
          return (
            <label
              key={area}
              className="flex items-center gap-2 text-sm text-muted has-checked:text-fg"
            >
              <Checkbox
                checked={checked}
                onChange={() =>
                  onChange(
                    checked
                      ? goalAreas.filter((goal) => goal !== area)
                      : [...goalAreas, area],
                  )
                }
              />
              {AREA_LABELS[area]}
              {checked && (
                <span className="text-xs text-accent-text">#{priority + 1}</span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

interface MinutesFieldsProps {
  minutesPerDay: PracticeMinutesPerDay
  onChange: (minutesPerDay: PracticeMinutesPerDay) => void
}

export function MinutesFields({ minutesPerDay, onChange }: MinutesFieldsProps) {
  return (
    <fieldset>
      <legend className="text-sm text-muted">
        Minutes of practice per day.
      </legend>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {MINUTES_PER_DAY_OPTIONS.map((minutes) => (
          <label
            key={minutes}
            className="flex items-center gap-2 text-sm text-muted has-checked:text-fg"
          >
            <Radio
              name="minutes-per-day"
              checked={minutesPerDay === minutes}
              onChange={() => onChange(minutes)}
            />
            {minutes} min
          </label>
        ))}
      </div>
    </fieldset>
  )
}
