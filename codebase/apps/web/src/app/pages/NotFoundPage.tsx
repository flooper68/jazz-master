import { Link } from '@tanstack/react-router'

export default function NotFoundPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-fg-2">
        That page doesn't exist.{' '}
        <Link to="/" className="underline hover:text-fg">
          Back to the dashboard
        </Link>
        .
      </p>
    </div>
  )
}
