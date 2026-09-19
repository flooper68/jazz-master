/**
 * Page columns. Content is centred in the room beside the sidebar and capped,
 * so on a very wide screen it neither hugs the left edge nor stretches until
 * rows are too long to scan. The practice stage is the exception: it is a
 * full-bleed surface and frames itself.
 */

/**
 * The top-level pages (Home, Exercises, Goals, History): wide, and a step wider on the largest
 * screens, where the card grid adds columns. They share one frame so their headings sit on one line
 * as you move between them.
 */
export const PAGE_WIDE = 'mx-auto w-full max-w-6xl min-[2000px]:max-w-[90rem]'

/** Pages you read or fill in from top to bottom (an editor, account settings): narrower, so a label and its field stay in one glance. */
export const PAGE_READING = 'mx-auto w-full max-w-4xl'
