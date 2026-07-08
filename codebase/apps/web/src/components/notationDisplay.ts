import type { NotationDisplayMode } from '../storage/notationPreferences'

export const NOTATION_DISPLAY_LABELS: Record<NotationDisplayMode, string> = {
  both: 'staff and tablature',
  staff: 'staff notation',
  tab: 'tablature',
}
