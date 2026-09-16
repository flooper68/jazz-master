import type { ComponentProps } from 'react'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400'
const buttonVariants = {
  primary: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-400',
  secondary: 'border border-zinc-700 text-zinc-100 hover:border-amber-500 hover:text-amber-400 disabled:text-zinc-500',
  quiet: 'text-zinc-400 hover:text-zinc-200 disabled:text-zinc-600',
} as const

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ComponentProps<'button'> & { variant?: keyof typeof buttonVariants }) {
  return <button type={type} className={`rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed ${focus} ${buttonVariants[variant]} ${className}`} {...props} />
}

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`rounded-lg border border-zinc-800 bg-zinc-900 p-4 ${className}`} {...props} />
}

export function Badge({ className = '', ...props }: ComponentProps<'span'>) {
  return <span className={`rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-amber-400 ${className}`} {...props} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 ${focus} ${className}`} {...props} />
}

export function Radio({ className = '', ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return <input type="radio" className={`accent-amber-500 ${className}`} {...props} />
}

export function Checkbox({ className = '', ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return <input type="checkbox" className={`accent-amber-500 ${className}`} {...props} />
}
