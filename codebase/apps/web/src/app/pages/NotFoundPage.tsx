import { Link } from '@tanstack/react-router'

export default function NotFoundPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-zinc-300">
        That page doesn't exist.{' '}
        <Link to="/" className="underline hover:text-zinc-100">
          Back to the dashboard
        </Link>
        .
      </p>
    </div>
  )
}
