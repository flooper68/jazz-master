import { useNavigate, useRouter } from '@tanstack/react-router'

/**
 * Back to wherever the player came from — home, the exercise list, a routine,
 * a goal — rather than always the same page. A stage opened cold (a shared
 * link, a reload) has nothing behind it in this tab, so it falls back to the
 * exercises rather than walking the player out of the app.
 */
export function useGoBack(): () => void {
  const router = useRouter()
  const navigate = useNavigate()
  return () => {
    if (router.history.canGoBack()) return router.history.back()
    void navigate({ to: '/exercises' })
  }
}
