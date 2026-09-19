import type { ReactNode } from 'react'

/** Small 16px line-and-fill icons for the player chrome; every path is a theme-coloured `currentColor`. */

function Icon({ children, size = 14 }: { children: ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  )
}

export const PlayIcon = () => <Icon><path d="M3 2.5v11l10-5.5z" /></Icon>
export const PauseIcon = () => <Icon><path d="M3 2.5h3.5v11H3zM9.5 2.5H13v11H9.5z" /></Icon>
export const StopIcon = () => <Icon><path d="M3 3h10v10H3z" /></Icon>
export const SkipBackIcon = () => <Icon><path d="M2.5 2.5H4v11H2.5zM13 2.5 5 8l8 5.5z" /></Icon>
export const ChevronLeftIcon = () => <Icon><path d="M10.5 2.5 5 8l5.5 5.5 1.4-1.4L7.8 8l4.1-4.1z" /></Icon>
export const ChevronRightIcon = () => <Icon><path d="M5.5 2.5 11 8l-5.5 5.5-1.4-1.4L8.2 8 4.1 3.9z" /></Icon>
export const ChevronDownIcon = () => (
  <Icon size={10}><path d="M2.5 5.5 8 11l5.5-5.5-1.4-1.4L8 8.2 3.9 4.1z" /></Icon>
)
export const MinusIcon = () => <Icon><path d="M2.5 7.25h11v1.5h-11z" /></Icon>
export const PlusIcon = () => <Icon><path d="M7.25 2.5h1.5v4.75h4.75v1.5H8.75v4.75h-1.5V8.75H2.5v-1.5h4.75z" /></Icon>
export const ArrowUpIcon = () => <Icon><path d="M8 2.5 13 8l-1.1 1.1-3.15-3.4v7.8h-1.5V5.7L4.1 9.1 3 8z" /></Icon>
export const ArrowDownIcon = () => <Icon><path d="M8 13.5 3 8l1.1-1.1 3.15 3.4V2.5h1.5v7.8l3.15-3.4L13 8z" /></Icon>
export const ResetIcon = () => (
  <Icon>
    <path d="M8 2.5a5.5 5.5 0 1 1-5.2 3.7l1.4.5A4 4 0 1 0 8 4v2.2L4.5 3.3 8 .4z" />
  </Icon>
)
export const LoopIcon = () => (
  <Icon>
    <path d="M3.5 6.5V5h6V2.7L13 5.5l-3.5 2.8V6.5zM12.5 9.5V11h-6v2.3L3 10.5l3.5-2.8v1.8z" />
  </Icon>
)
export const RepeatIcon = () => (
  <Icon>
    <path d="M4 4.5h7V2.6l3 2.4-3 2.4V5.9H5v3H4zM12 11.5H5v1.9l-3-2.4 3-2.4v1.5h6v-3h1z" />
  </Icon>
)
export const RampIcon = () => (
  <Icon>
    <path d="M2 12.5 6 8.5l2.5 2.5 4.6-4.6V8.5H14.5V3.5h-5v1.5h2.1L8.5 8.1 6 5.6l-5 5z" />
  </Icon>
)
export const SoundIcon = () => (
  <Icon>
    <path d="M2 6h2.5L8 3v10L4.5 10H2zM10 5.2a3.3 3.3 0 0 1 0 5.6V9.4a2 2 0 0 0 0-2.8zM10 2.6a5.6 5.6 0 0 1 0 10.8v-1.5a4.1 4.1 0 0 0 0-7.8z" />
  </Icon>
)
export const ClickIcon = () => (
  <Icon>
    <path d="M6.2 2h3.6l2.7 11.5H3.5zM7.5 3.5 5.4 12h5.2L8.5 3.5zM7.3 9.8l4.6-5.4.9.8-4.7 5.3z" />
  </Icon>
)
export const GuitarIcon = () => (
  <Icon>
    <path d="M12.6 2 14 3.4l-3.4 3.4a3.6 3.6 0 0 1-.6 4.4 3.3 3.3 0 0 1-2.4 1c-.9 0-1.5.5-1.7 1.1a2.6 2.6 0 1 1-2.8-2.8c.6-.2 1.1-.8 1.1-1.7a3.3 3.3 0 0 1 1-2.4 3.6 3.6 0 0 1 4.4-.6zM6.5 9.5a1 1 0 1 0 0 .1z" />
  </Icon>
)
export const CountInIcon = () => (
  <Icon>
    <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm0 1.5a5 5 0 1 0 0 10A5 5 0 0 0 8 3zm-.75 1.5h1.5v3.7l2.4 1.4-.75 1.3-3.15-1.85z" />
  </Icon>
)
export const TabIcon = () => (
  <Icon>
    <path d="M2 3h12v1H2zM2 5.5h12v1H2zM2 8h12v1H2zM2 10.5h12v1H2zM2 13h12v1H2zM7 4.5h2v3H7z" />
  </Icon>
)
export const NotesIcon = () => (
  <Icon>
    <path d="M10.5 2v8.1a2.6 2.6 0 1 1-1.5-2.3V4.4L6 5.3v6.8a2.6 2.6 0 1 1-1.5-2.3V3.4z" />
  </Icon>
)
export const BothIcon = () => (
  <Icon>
    <path d="M2 2.5h12v1H2zM2 4.5h12v1H2zM2 6.5h12v1H2zM2 9.5h12v1H2zM2 11.5h12v1H2zM2 13.5h12v1H2zM7 3.4a1.3 1.3 0 1 1 0 .1zM7 10.4a1.3 1.3 0 1 1 0 .1z" />
  </Icon>
)
export const BarIcon = () => <Icon><path d="M3 2.5h1.5v11H3zM11.5 2.5H13v11h-1.5zM6 4h4v1.5H6zM6 10.5h4V12H6z" /></Icon>
export const LoopStartIcon = () => <Icon><path d="M3 2.5h1.5v11H3zM6 7.25h4.3V5l3.2 3-3.2 3V8.75H6z" /></Icon>
export const LoopEndIcon = () => <Icon><path d="M11.5 2.5H13v11h-1.5zM10 7.25H5.7V5L2.5 8l3.2 3V8.75H10z" /></Icon>
export const ClearIcon = () => (
  <Icon><path d="M3.6 2.5 8 6.9l4.4-4.4 1.1 1.1L9.1 8l4.4 4.4-1.1 1.1L8 9.1l-4.4 4.4-1.1-1.1L6.9 8 2.5 3.6z" /></Icon>
)
export const NextIcon = () => <Icon><path d="M2.5 2.5 10 8l-7.5 5.5zM11 2.5h2.5v11H11z" /></Icon>
export const GuitarPickIcon = () => (
  <Icon>
    <path d="M8 1.5c3.4 0 6 1.6 6 4.2 0 3.6-3.1 8.8-6 8.8S2 9.3 2 5.7c0-2.6 2.6-4.2 6-4.2zm0 1.5C5.4 3 3.5 4.1 3.5 5.7c0 2.9 2.6 7.3 4.5 7.3s4.5-4.4 4.5-7.3C12.5 4.1 10.6 3 8 3z" />
  </Icon>
)
export const SlidersIcon = () => (
  <Icon>
    <path d="M2 4h6v1.5H2zM10.5 2.5h1.5v4.5h-1.5zM10 4h4v1.5h-4zM2 10.5h4V12H2zM6.5 9H8v4.5H6.5zM8 10.5h6V12H8z" />
  </Icon>
)
export const InfoIcon = ({ size = 14 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm0 1.5a5 5 0 1 0 0 10A5 5 0 0 0 8 3zm-.9 3.8h1.8V12H7.1zM8 4.3a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
  </Icon>
)
export const CloseIcon = () => (
  <Icon size={12}><path d="M3.6 2.5 8 6.9l4.4-4.4 1.1 1.1L9.1 8l4.4 4.4-1.1 1.1L8 9.1l-4.4 4.4-1.1-1.1L6.9 8 2.5 3.6z" /></Icon>
)
export const CheckIcon = () => <Icon size={12}><path d="M6.4 12.3 2 7.9l1.4-1.4 3 3 6.2-6.2L14 4.7z" /></Icon>
export const FullscreenIcon = ({ exit }: { exit: boolean }) => (
  <Icon>
    {exit ? (
      <path d="M6 2v4H2v1.5h5.5V2zM10 2h-1.5v5.5H14V6h-4zM2 9v1.5h4V14h1.5V9zM8.5 9V14H10v-3.5h4V9z" />
    ) : (
      <path d="M2 2h5v1.5H3.5V7H2zM9 2h5v5h-1.5V3.5H9zM2 9h1.5v3.5H7V14H2zM12.5 9H14v5H9v-1.5h3.5z" />
    )}
  </Icon>
)
export const ListIcon = () => (
  <Icon size={16}><path d="M2 3h2v2H2zM6 3.25h8v1.5H6zM2 7h2v2H2zM6 7.25h8v1.5H6zM2 11h2v2H2zM6 11.25h8v1.5H6z" /></Icon>
)
export const HistoryIcon = () => (
  <Icon size={16}><path d="M8 1.5a6.5 6.5 0 1 1-6.3 8.1l1.45-.37A5 5 0 1 0 4.3 4.6L6 6.3H1.5V1.8l1.74 1.74A6.48 6.48 0 0 1 8 1.5zm-.75 3h1.5v3.2l2.3 1.35-.76 1.3-3.04-1.8z" /></Icon>
)
export const ClockIcon = () => (
  <Icon size={12}><path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3zm-.75 1.75h1.5v2.95l2.1 1.2-.75 1.3-2.85-1.65z" /></Icon>
)
export const SidebarIcon = () => (
  <Icon size={16}><path d="M2 2.5h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm.5 1.5v8h3V4zm4.5 0v8h6.5V4z" /></Icon>
)
export const GridIcon = () => (
  <Icon size={14}><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" /></Icon>
)
export const RowsIcon = () => (
  <Icon size={14}><path d="M2 2.5h12v3H2zM2 6.5h12v3H2zM2 10.5h12v3H2z" /></Icon>
)
export const ShuffleIcon = () => (
  <Icon><path d="M11 2.6 14 5l-3 2.4V5.9H9.6L4.9 11.5H2V10h2.2l4.7-5.6H11zM2 4.5h2.9l1.6 1.9-1 1.2L4.2 6H2zM11 8.6l3 2.4-3 2.4v-1.9H8.9L7.6 10l1-1.2 1 1.2H11z" /></Icon>
)
export const HomeIcon = () => (
  <Icon size={16}><path d="M8 1.6 14.5 7v7.4H9.75V10h-3.5v4.4H1.5V7zm0 1.95L3 7.7v5.2h1.75V8.5h6.5v4.4H13V7.7z" /></Icon>
)
/** A target: the thing being worked toward. */
export const GoalIcon = () => (
  <Icon size={16}><path d="M8 1a7 7 0 1 0 7 7h-1.5A5.5 5.5 0 1 1 8 2.5zm0 3a4 4 0 1 0 4 4h-1.5A2.5 2.5 0 1 1 8 5.5zm0 2.75A1.25 1.25 0 1 0 9.25 9L13 5.25V3h-2.25L7 6.75A1.25 1.25 0 0 0 8 6.75z" /></Icon>
)

export const RoutineIcon = () => (
  <Icon size={16}><path d="M4.5 1.5h7A1.5 1.5 0 0 1 13 3v10a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13V3a1.5 1.5 0 0 1 1.5-1.5zm0 1.5v10h7V3zm1.25 1.75h4.5v1.5h-4.5zm0 2.75h4.5V9h-4.5zm0 2.75h3v1.5h-3z" /></Icon>
)

/** A person: the account itself. */
export const PersonIcon = () => (
  <Icon size={16}><path d="M8 1.5a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5zm0 1.5a1.75 1.75 0 1 0 0 3.5A1.75 1.75 0 0 0 8 3zM2.5 14.5c0-2.9 2.46-5 5.5-5s5.5 2.1 5.5 5H12c0-2-1.74-3.5-4-3.5S4 12.5 4 14.5z" /></Icon>
)

/** The sun and the moon, for the theme the press switches to. */
export const ThemeIcon = ({ dark }: { dark: boolean }) => (
  <Icon size={16}>
    {dark ? (
      <path d="M9.6 1.7a6.5 6.5 0 1 0 4.7 9.9A5.5 5.5 0 0 1 7.4 4.3a6.6 6.6 0 0 1 2.2-2.6zM6.3 6.6a7 7 0 0 0 5.2 5.2 5 5 0 1 1-5.2-5.2z" />
    ) : (
      <path d="M7.25 1h1.5v2.25h-1.5zm0 11.75h1.5V15h-1.5zM1 7.25h2.25v1.5H1zm11.75 0H15v1.5h-2.25zM3.1 2.04l1.6 1.6-1.06 1.06-1.6-1.6zm8.2 8.2 1.6 1.6-1.06 1.06-1.6-1.6zm1.6-8.2 1.06 1.06-1.6 1.6-1.06-1.06zM4.7 12.36 3.64 13.42l-1.6-1.6L3.1 10.76zM8 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 1.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    )}
  </Icon>
)

/** A door with an arrow out: the way out of the account. */
export const SignOutIcon = () => (
  <Icon size={16}><path d="M2.5 2h6v1.5h-4.5v9H8.5V14h-6zM10.2 4.44 13.76 8 10.2 11.56 9.14 10.5l1.74-1.75H6v-1.5h4.88L9.14 5.5z" /></Icon>
)
