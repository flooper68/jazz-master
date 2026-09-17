import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

/**
 * A select that is ours to style: a button showing the current choice and
 * a listbox that opens beneath (or above) it, with full keyboard handling —
 * arrows, Home/End, Enter/Space, Escape, and typing the first letters.
 * Options may be grouped; groups get a heading in the list.
 */

export interface SelectOption<T extends string> {
  value: T
  label: string
  group?: string
}

interface SelectProps<T extends string> {
  options: readonly SelectOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
  /** Tooltip text (the app's `data-tip` tooltip). */
  'data-tip'?: string
  /** Open the list above the button — for a select that sits at the bottom of the screen. */
  placement?: 'below' | 'above'
  /** A tighter, smaller-type button. */
  compact?: boolean
  /** Show only this icon on the button; the choice goes into the name and tooltip. */
  icon?: ReactNode
  className?: string
  disabled?: boolean
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

export function Select<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  'data-tip': tip,
  placement = 'below',
  compact = false,
  icon,
  className = '',
  disabled = false,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => Math.max(options.findIndex((option) => option.value === value), 0))
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const listId = useId()
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current?.focus()
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active])

  function openList(): void {
    if (disabled) return
    setActive(Math.max(options.findIndex((option) => option.value === value), 0))
    setOpen(true)
  }

  function choose(index: number): void {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openList()
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>): void {
    const last = options.length - 1
    const handlers: Record<string, () => void> = {
      ArrowDown: () => setActive((index) => Math.min(index + 1, last)),
      ArrowUp: () => setActive((index) => Math.max(index - 1, 0)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => {
        setOpen(false)
        buttonRef.current?.focus()
      },
      Tab: () => setOpen(false),
    }
    const handler = handlers[event.key]
    if (handler) {
      if (event.key !== 'Tab') event.preventDefault()
      handler()
      return
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      // Typeahead: letters typed within a second accumulate.
      const now = Date.now()
      const text = (now - typed.current.at < 1000 ? typed.current.text : '') + event.key.toLowerCase()
      typed.current = { text, at: now }
      const index = options.findIndex((option) => option.label.toLowerCase().startsWith(text))
      if (index >= 0) setActive(index)
    }
  }

  // Group headings appear where the group changes, in option order.
  const rows = options.map((option, index) => ({
    option,
    index,
    heading: option.group && (index === 0 || options[index - 1].group !== option.group) ? option.group : null,
  }))

  return (
    <div ref={rootRef} className={`relative ${className}`} data-select>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={icon ? `${ariaLabel}: ${selected?.label ?? ''}` : ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-tip={icon ? `${tip ?? ariaLabel}: ${selected?.label ?? ''}` : tip}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onButtonKeyDown}
        className={
          icon
            ? `inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-panel text-fg hover:border-line-strong hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS} ${open ? 'border-line-strong bg-panel-2' : ''}`
            : `inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-line bg-field text-left text-fg hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS} ${
                compact ? 'h-7 px-2 text-xs' : 'px-2.5 py-1.5 text-sm'
              }`
        }
      >
        {icon ?? (
          <>
            <span className="truncate">{selected?.label ?? ''}</span>
            <svg viewBox="0 0 16 16" width={10} height={10} fill="currentColor" aria-hidden="true" className="shrink-0 text-muted">
              <path d="M2.5 5.5 8 11l5.5-5.5-1.4-1.4L8 8.2 3.9 4.1z" />
            </svg>
          </>
        )}
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={`${listId}-${active}`}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className={`absolute z-30 max-h-72 min-w-full overflow-y-auto rounded-xl border border-line bg-panel p-1 shadow-lg outline-none ${
            placement === 'above' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${icon ? 'left-1/2 -translate-x-1/2' : 'left-0'}`}
        >
          {rows.map(({ option, index, heading }) => (
            <li key={option.value} className="contents">
              {heading && (
                <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-muted uppercase" role="presentation">
                  {heading}
                </div>
              )}
              <div
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                data-index={index}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap ${
                  index === active ? 'bg-panel-2 text-fg' : 'text-fg-2'
                }`}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <svg viewBox="0 0 16 16" width={12} height={12} fill="currentColor" aria-hidden="true" className="text-accent">
                    <path d="M6.4 12.3 2 7.9l1.4-1.4 3 3 6.2-6.2L14 4.7z" />
                  </svg>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
