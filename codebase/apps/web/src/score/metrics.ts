import { STRING_NUMBERS } from '@jazz-master/theory'

/** Vertical metrics of the staves, shared by the score and its renderers. */

export const LINE_GAP = 8
export const HALF_GAP = LINE_GAP / 2

export const NOTATION_ABOVE = 3 * LINE_GAP + 4
export const NOTATION_BELOW = 3 * LINE_GAP + 6
export const NOTATION_HEIGHT = NOTATION_ABOVE + 4 * LINE_GAP + NOTATION_BELOW

export const STRING_GAP = 11
export const TAB_LINES_HEIGHT = (STRING_NUMBERS.length - 1) * STRING_GAP
export const TAB_STEMS_HEIGHT = 22
export const TAB_HEIGHT = TAB_LINES_HEIGHT + TAB_STEMS_HEIGHT + 6
