import { Link } from '@tanstack/react-router'
import { PAGE_READING } from '../../components/pageFrame'

export default function NotFoundPage() {
  return (
    <div className={PAGE_READING}>
      <h1 className="font-display text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-fg-2">
        That page doesn't exist.{' '}
        <Link
          to="/"
          className="underline hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          Back home
        </Link>
        .
      </p>
    </div>
  )
}
