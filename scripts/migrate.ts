#!/usr/bin/env node
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import Database from "better-sqlite3"
import postgres from "postgres"
import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator"
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator"
import path from "path"
import fs from "fs"

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL

  console.log("Running database migrations...")

  if (!databaseUrl) {
    // Default to SQLite
    console.log("No DATABASE_URL found, using SQLite (data/pupi.db)")
    const dataDir = path.join(process.cwd(), "data")
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    const dbPath = path.join(dataDir, "pupi.db")
    const sqlite = new Database(dbPath)
    sqlite.pragma("journal_mode = WAL")
    const db = drizzleSqlite(sqlite)

    await migrateSqlite(db, { migrationsFolder: "./drizzle" })
    console.log("SQLite migrations completed successfully!")
    sqlite.close()
    return
  }

  if (
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://")
  ) {
    console.log("Using PostgreSQL database")
    const queryClient = postgres(databaseUrl, {
      max: 1,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    })
    const db = drizzlePostgres(queryClient)

    await migratePostgres(db, { migrationsFolder: "./drizzle" })
    console.log("PostgreSQL migrations completed successfully!")
    await queryClient.end()
    return
  }

  if (databaseUrl.startsWith("sqlite://") || databaseUrl.startsWith("file:")) {
    console.log("Using SQLite database")
    const dbPath = databaseUrl.replace(/^(sqlite:\/\/|file:)/, "")
    const sqlite = new Database(dbPath)
    sqlite.pragma("journal_mode = WAL")
    const db = drizzleSqlite(sqlite)

    await migrateSqlite(db, { migrationsFolder: "./drizzle" })
    console.log("SQLite migrations completed successfully!")
    sqlite.close()
    return
  }

  // Default: treat as SQLite path
  console.log("Using SQLite database")
  const sqlite = new Database(databaseUrl)
  sqlite.pragma("journal_mode = WAL")
  const db = drizzleSqlite(sqlite)

  await migrateSqlite(db, { migrationsFolder: "./drizzle" })
  console.log("SQLite migrations completed successfully!")
  sqlite.close()
}

runMigrations()
  .then(() => {
    console.log("Migrations finished!")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Migration failed:", err)
    process.exit(1)
  })
