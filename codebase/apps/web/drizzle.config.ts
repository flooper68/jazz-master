import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run Drizzle migrations')
}

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: '../migration/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
})
