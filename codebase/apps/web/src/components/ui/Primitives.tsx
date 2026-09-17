import type { ComponentProps } from 'react'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

const buttonVariants = {
  primary: 'bg-cta text-cta-fg hover:bg-cta-hover disabled:bg-panel-2 disabled:text-muted',
  secondary: 'border border-line-strong bg-panel text-fg hover:border-fg disabled:border-line disabled:text-muted',
  quiet: 'text-fg-2 hover:bg-panel-2 hover:text-fg disabled:text-muted disabled:hover:bg-transparent',
  /** The beat: the one amber action of a view. It carries the dot. */
  accent: 'bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-60',
  /** On an amber ground, where amber cannot be the button: ink instead. */
  onAccent: 'bg-on-accent text-accent hover:opacity-90 disabled:opacity-60 focus-visible:outline-on-accent',
  /** An action that reads as text: underlined, no box. Takes no size. */
  link: 'text-fg-2 underline decoration-line-strong underline-offset-4 hover:text-fg hover:decoration-fg disabled:text-muted',
} as const

const buttonSizes = {
  md: 'rounded-xl px-4 py-2 text-sm',
  lg: 'rounded-xl px-5 py-3.5 text-[15px] leading-none',
} as const

export type ButtonVariant = keyof typeof buttonVariants
export type ButtonSize = keyof typeof buttonSizes

interface ButtonLook {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Where the label sits in a button wider than its text; a menu row starts at the left. */
  align?: 'center' | 'start'
}

function buttonClass({ variant = 'primary', size = 'md', align = 'center' }: ButtonLook, className: string): string {
  const box = variant === 'link' ? 'rounded-sm text-left text-[13px]' : `${align === 'start' ? 'justify-start text-left' : 'justify-center'} ${buttonSizes[size]}`
  return `inline-flex items-center gap-2 font-medium transition-colors disabled:cursor-not-allowed ${box} ${focus} ${buttonVariants[variant]} ${className}`
}

function Beat({ variant }: { variant: ButtonVariant | undefined }) {
  return variant === 'accent' ? <span className="size-2 shrink-0 rounded-full bg-current" aria-hidden="true" /> : null
}

export function Button({ variant, size, align, className = '', type = 'button', children, ...props }: ComponentProps<'button'> & ButtonLook) {
  return (
    <button type={type} className={buttonClass({ variant, size, align }, className)} {...props}>
      <Beat variant={variant} />
      {children}
    </button>
  )
}

/** A link that looks and behaves like a button: same variants, same sizes. */
export function ButtonLink({ variant, size, align, className = '', children, ...props }: ComponentProps<'a'> & ButtonLook) {
  return (
    <a className={buttonClass({ variant, size, align }, className)} {...props}>
      <Beat variant={variant} />
      {children}
    </a>
  )
}

const inputTones = {
  default: 'border-line-strong bg-field text-fg placeholder:text-muted focus-visible:border-fg focus-visible:outline-fg',
  /** On an amber ground. */
  onAccent: 'border-on-accent/40 bg-transparent text-on-accent placeholder:text-on-accent/55 focus-visible:border-on-accent focus-visible:outline-on-accent',
} as const

export function Input({ tone = 'default', className = '', ...props }: ComponentProps<'input'> & { tone?: keyof typeof inputTones }) {
  return (
    <input
      className={`w-full rounded-xl border px-3.5 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${inputTones[tone]} ${className}`}
      {...props}
    />
  )
}

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`rounded-2xl border border-line bg-panel p-5 ${className}`} {...props} />
}

export function Badge({ className = '', ...props }: ComponentProps<'span'>) {
  return <span className={`rounded-full bg-panel-2 px-2.5 py-0.5 text-xs font-medium text-fg-2 ${className}`} {...props} />
}

export function Radio({ className = '', ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return <input type="radio" className={`accent-cta ${className}`} {...props} />
}

export function Checkbox({ className = '', ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return <input type="checkbox" className={`accent-cta ${className}`} {...props} />
}
