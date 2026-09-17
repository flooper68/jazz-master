import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'

/** Root error boundary body: a fixed sentence for the player, detail to the console. */
export default function ErrorPage({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <main className="min-h-screen bg-canvas px-4 py-10 text-fg md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-4 text-fg-2">
        The page could not be shown. Reloading usually fixes it.
      </p>
      <p className="mt-4 text-fg-2">
        <Link
          to="/"
          className="underline hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          Back home
        </Link>
        .
      </p>
    </main>
  )
}
