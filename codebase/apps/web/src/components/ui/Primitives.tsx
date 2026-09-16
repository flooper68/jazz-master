import type { ComponentProps } from 'react'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const buttonVariants = {
  primary: 'bg-cta text-cta-fg hover:bg-cta-hover disabled:bg-panel-2 disabled:text-muted',
  secondary: 'border border-line-strong bg-panel text-fg hover:border-fg disabled:border-line disabled:text-muted',
  quiet: 'text-fg-2 hover:bg-panel-2 hover:text-fg disabled:text-muted disabled:hover:bg-transparent',
} as const

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ComponentProps<'button'> & { variant?: keyof typeof buttonVariants }) {
  return <button type={type} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${focus} ${buttonVariants[variant]} ${className}`} {...props} />
}

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`rounded-2xl border border-line bg-panel p-5 ${className}`} {...props} />
}

export function Badge({ className = '', ...props }: ComponentProps<'span'>) {
  return <span className={`rounded-full bg-panel-2 px-2.5 py-0.5 text-xs font-medium text-fg-2 ${className}`} {...props} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`rounded-lg border border-line-strong bg-field px-2.5 py-1.5 text-sm text-fg ${focus} ${className}`} {...props} />
}

export function Radio({ className = '', ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return <input type="radio" className={`accent-cta ${className}`} {...props} />
}

export function Checkbox({ className = '', ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return <input type="checkbox" className={`accent-cta ${className}`} {...props} />
}
