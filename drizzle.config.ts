import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env.DATABASE_URL

// Determine if we're using PostgreSQL or SQLite
const isPostgres = databaseUrl && (
  databaseUrl.startsWith("postgres://") || 
  databaseUrl.startsWith("postgresql://")
)

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: isPostgres
    ? {
        url: databaseUrl!,
      }
    : {
        url: databaseUrl || "./data/pupi.db",
      },
})
