import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const databaseUrl = process.env.DATABASE_URL

const maxAttempts = 10
const retryDelayMs = 2_000

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run database migrations')
}

const connectionString = databaseUrl

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
