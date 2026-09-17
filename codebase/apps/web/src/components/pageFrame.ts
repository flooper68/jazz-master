/**
 * Page columns. Content is centred in the room beside the sidebar and capped,
 * so on a very wide screen it neither hugs the left edge nor stretches until
 * rows are too long to scan. The practice stage is the exception: it is a
 * full-bleed surface and frames itself.
 */

/** Dashboards and grids: wide, and a step wider on the largest screens, where the card grid adds columns. */
export const PAGE_WIDE = 'mx-auto w-full max-w-6xl min-[2000px]:max-w-[90rem]'

/** Lists read row by row: narrower, so a title and its action stay in one glance. */
export const PAGE_READING = 'mx-auto w-full max-w-4xl'
