/**
 * The Count-in mark and lockup. Three counts swell into the downbeat: the
 * first three dots take the text colour, the last is always amber. Sized in
 * `em`, so a lockup scales with its font size.
 */

/** The mark on its own; 58 × 24, sized by `className`. */
export function Mark({ className = 'h-[0.72em] w-[1.74em]' }: { className?: string }) {
  return (
    <svg viewBox="4 20 58 24" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="8" cy="32" r="2.5" className="fill-current" />
      <circle cx="20" cy="32" r="3.5" className="fill-current" />
      <circle cx="34" cy="32" r="4.5" className="fill-current" />
      <circle cx="52" cy="32" r="9" className="fill-accent" />
    </svg>
  )
}

/** The name, with the hyphen as the beat. */
export function Wordmark() {
  return (
    <span>
      count<span className="text-accent">-</span>in
    </span>
  )
}

/** Mark and wordmark together. Pass a text size; everything else follows it. */
export function Lockup({ className = 'text-xl' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.36em] font-display leading-none font-semibold tracking-[-0.035em] whitespace-nowrap ${className}`}>
      <Mark />
      <Wordmark />
    </span>
  )
}
