/**
 * The sidebar as the player left it: how wide, and whether it is folded to
 * its icon rail — remembered separately for the practice stage, where it
 * starts folded so the score keeps the room.
 */
export interface SidebarPrefs {
  width: number
  collapsed: boolean
  collapsedOnStage: boolean
}

export const SIDEBAR_MIN = 184
export const SIDEBAR_MAX = 360
export const SIDEBAR_STEP = 16

export const DEFAULT_SIDEBAR_PREFS: SidebarPrefs = {
  width: 224,
  collapsed: false,
  collapsedOnStage: true,
}

export const SIDEBAR_PREFS_KEY = 'jazz-master.sidebar'

export function clampSidebarWidth(width: number): number {
  if (!Number.isFinite(width)) return DEFAULT_SIDEBAR_PREFS.width
  return Math.round(Math.min(Math.max(width, SIDEBAR_MIN), SIDEBAR_MAX))
}

/** The last saved sidebar, or the defaults; storage that is missing or broken is ignored. */
export function loadSidebarPrefs(storage: Pick<Storage, 'getItem'> | null = safeStorage()): SidebarPrefs {
  try {
    const raw = storage?.getItem(SIDEBAR_PREFS_KEY)
    if (!raw) return DEFAULT_SIDEBAR_PREFS
    const parsed = JSON.parse(raw) as Partial<Record<keyof SidebarPrefs, unknown>>
    return {
      width: typeof parsed.width === 'number' ? clampSidebarWidth(parsed.width) : DEFAULT_SIDEBAR_PREFS.width,
      collapsed: typeof parsed.collapsed === 'boolean' ? parsed.collapsed : DEFAULT_SIDEBAR_PREFS.collapsed,
      collapsedOnStage:
        typeof parsed.collapsedOnStage === 'boolean' ? parsed.collapsedOnStage : DEFAULT_SIDEBAR_PREFS.collapsedOnStage,
    }
  } catch {
    return DEFAULT_SIDEBAR_PREFS
  }
}

export function saveSidebarPrefs(prefs: SidebarPrefs, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(SIDEBAR_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private mode or a full quota: the choice still holds for this page.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
