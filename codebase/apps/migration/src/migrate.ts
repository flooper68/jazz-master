import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const databaseUrl = process.env.DATABASE_URL

const maxAttempts = 10
const retryDelayMs = 2_000

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run database migrations')
}

const connectionString = databaseUrl

assertRailwayDatabaseUrlIsNotLoopback(connectionString)

function assertRailwayDatabaseUrlIsNotLoopback(urlString: string): void {
  if (!process.env.RAILWAY_PROJECT_ID) {
    return
  }

  let url: URL

  try {
    url = new URL(urlString)
  } catch {
    return
  }

  const loopbackHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])

  if (!loopbackHosts.has(url.hostname) && !url.hostname.startsWith('127.')) {
    return
  }

  throw new Error(
    [
      `DATABASE_URL points at "${url.hostname}" inside Railway.`,
      'That is the migration container itself, not the Railway Postgres service.',
      'Set the migration service DATABASE_URL to a Railway reference variable such as ${{Postgres.DATABASE_URL}},',
      'replacing "Postgres" with the actual database service name.',
    ].join(' '),
  )
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause ? `\nCause: ${describeError(error.cause)}` : ''

    return `${error.name}: ${error.message}${cause}\n${error.stack ?? ''}`
  }

  return String(error)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function runMigrations(): Promise<void> {
  const db = drizzle(connectionString)

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
  } finally {
    await db.$client.end()
  }
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    console.log(`Running database migrations, attempt ${attempt}/${maxAttempts}`)
    await runMigrations()
    console.log('Database migrations applied successfully')
    process.exit(0)
  } catch (error) {
    console.error(`Database migration attempt ${attempt}/${maxAttempts} failed`)
    console.error(describeError(error))

    if (attempt === maxAttempts) {
      console.error('Database migrations failed after all retry attempts')
      process.exit(1)
    }

    await wait(retryDelayMs)
  }
}
