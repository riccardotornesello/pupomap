import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import Database from "better-sqlite3"
import postgres from "postgres"
import { pupi } from "./schema"
import { eq } from "drizzle-orm"
import { PupoLocation } from "@/types"
import path from "path"
import fs from "fs"

// Database type definitions
type SqliteDB = ReturnType<typeof drizzleSqlite<{ pupi: typeof pupi }>>
type PostgresDB = ReturnType<typeof drizzlePostgres<{ pupi: typeof pupi }>>

interface DatabaseConnection {
  db: SqliteDB | PostgresDB
  isPostgres: boolean
}

let dbConnection: DatabaseConnection | null = null

// Note: We use `any` type casting in database operations because TypeScript cannot
// properly resolve the union type between SqliteDB and PostgresDB method signatures.
// This is a known limitation when supporting multiple database drivers with Drizzle ORM.
// The runtime behavior is correct, and the type safety is maintained at the function
// parameter and return value level.

function initializeDatabaseConnection(): DatabaseConnection {
  const databaseUrl = process.env.DATABASE_URL

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
    const db = drizzleSqlite(sqlite, { schema: { pupi } })
    return { db, isPostgres: false }
  }

  if (
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://")
  ) {
    console.log("Using PostgreSQL database")
    const queryClient = postgres(databaseUrl, {
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    })
    const db = drizzlePostgres(queryClient, { schema: { pupi } })
    return { db, isPostgres: true }
  }

  if (databaseUrl.startsWith("sqlite://") || databaseUrl.startsWith("file:")) {
    console.log("Using SQLite database")
    const dbPath = databaseUrl.replace(/^(sqlite:\/\/|file:)/, "")
    const sqlite = new Database(dbPath)
    sqlite.pragma("journal_mode = WAL")
    const db = drizzleSqlite(sqlite, { schema: { pupi } })
    return { db, isPostgres: false }
  }

  // Default: treat as SQLite path
  console.log("Using SQLite database")
  const sqlite = new Database(databaseUrl)
  sqlite.pragma("journal_mode = WAL")
  const db = drizzleSqlite(sqlite, { schema: { pupi } })
  return { db, isPostgres: false }
}

export function getDb(): DatabaseConnection {
  if (!dbConnection) {
    dbConnection = initializeDatabaseConnection()
  }
  return dbConnection
}

export async function getAllPupi(): Promise<PupoLocation[]> {
  const { db } = getDb()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (db as any).select().from(pupi)
    return results as PupoLocation[]
  } catch (error) {
    console.error("Error reading pupi data:", error)
    return []
  }
}

export async function getPupoById(
  id: string
): Promise<PupoLocation | undefined> {
  const { db } = getDb()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (db as any)
      .select()
      .from(pupi)
      .where(eq(pupi.id, id))
      .limit(1)
    return results[0] as PupoLocation | undefined
  } catch (error) {
    console.error("Error reading pupo data:", error)
    return undefined
  }
}

export async function createPupo(
  pupo: Omit<PupoLocation, "id">
): Promise<PupoLocation> {
  const { db } = getDb()
  // Generate a more robust ID using timestamp + random string
  const randomSuffix = Math.random().toString(36).substring(2, 9)
  const newPupo = {
    ...pupo,
    id: `${Date.now()}-${randomSuffix}`,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).insert(pupi).values(newPupo)
  return newPupo
}

export async function updatePupo(
  id: string,
  updates: Partial<Omit<PupoLocation, "id">>
): Promise<PupoLocation | null> {
  const { db } = getDb()
  const current = await getPupoById(id)
  if (!current) return null

  const updatedPupo = { ...current, ...updates }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .update(pupi)
    .set(updates)
    .where(eq(pupi.id, id))
  return updatedPupo
}

export async function deletePupo(id: string): Promise<boolean> {
  const { db } = getDb()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .delete(pupi)
    .where(eq(pupi.id, id))
  // Check if the pupo still exists to determine success
  const check = await getPupoById(id)
  return check === undefined
}

export async function insertBulkPupi(pupiData: PupoLocation[]): Promise<void> {
  const { db } = getDb()
  if (pupiData.length === 0) return

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(pupi).values(pupiData)
  } catch (error) {
    console.error("Error inserting bulk pupi:", error)
    throw error
  }
}
