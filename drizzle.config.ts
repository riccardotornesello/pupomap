import { defineConfig } from "drizzle-kit"
import { isPostgresUrl } from "./lib/db-config"

const databaseUrl = process.env.DATABASE_URL
const isPostgres = isPostgresUrl(databaseUrl)

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
