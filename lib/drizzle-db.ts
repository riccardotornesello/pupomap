import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import Database from "better-sqlite3"
import postgres from "postgres"
import { pupiSqlite, pupiPostgres } from "./schema"
import { eq } from "drizzle-orm"
import { PupoLocation } from "@/types"
import path from "path"
import fs from "fs"

type DrizzleDB =
  | ReturnType<typeof drizzleSqlite<{ pupi: typeof pupiSqlite }>>
  | ReturnType<typeof drizzlePostgres<{ pupi: typeof pupiPostgres }>>

interface DatabaseConnection {
  db: DrizzleDB
  isPostgres: boolean
  pupiTable: typeof pupiSqlite | typeof pupiPostgres
}

let dbConnection: DatabaseConnection | null = null

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
    const db = drizzleSqlite(sqlite, { schema: { pupi: pupiSqlite } })
    return { db, isPostgres: false, pupiTable: pupiSqlite }
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
    const db = drizzlePostgres(queryClient, { schema: { pupi: pupiPostgres } })
    return { db, isPostgres: true, pupiTable: pupiPostgres }
  }

  if (databaseUrl.startsWith("sqlite://") || databaseUrl.startsWith("file:")) {
    console.log("Using SQLite database")
    const dbPath = databaseUrl.replace(/^(sqlite:\/\/|file:)/, "")
    const sqlite = new Database(dbPath)
    sqlite.pragma("journal_mode = WAL")
    const db = drizzleSqlite(sqlite, { schema: { pupi: pupiSqlite } })
    return { db, isPostgres: false, pupiTable: pupiSqlite }
  }

  // Default: treat as SQLite path
  console.log("Using SQLite database")
  const sqlite = new Database(databaseUrl)
  sqlite.pragma("journal_mode = WAL")
  const db = drizzleSqlite(sqlite, { schema: { pupi: pupiSqlite } })
  return { db, isPostgres: false, pupiTable: pupiSqlite }
}

export function getDb(): DatabaseConnection {
  if (!dbConnection) {
    dbConnection = initializeDatabaseConnection()
  }
  return dbConnection
}

export async function getAllPupi(): Promise<PupoLocation[]> {
  const { db, pupiTable } = getDb()
  try {
    const results = await db.select().from(pupiTable as any)
    return results as PupoLocation[]
  } catch (error) {
    console.error("Error reading pupi data:", error)
    return []
  }
}

export async function getPupoById(
  id: string
): Promise<PupoLocation | undefined> {
  const { db, pupiTable } = getDb()
  try {
    const results = await db
      .select()
      .from(pupiTable as any)
      .where(eq((pupiTable as any).id, id))
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
  const { db, pupiTable } = getDb()
  // Generate a more robust ID using timestamp + random string
  const randomSuffix = Math.random().toString(36).substring(2, 9)
  const newPupo = {
    ...pupo,
    id: `${Date.now()}-${randomSuffix}`,
  }

  await db.insert(pupiTable as any).values(newPupo)
  return newPupo
}

export async function updatePupo(
  id: string,
  updates: Partial<Omit<PupoLocation, "id">>
): Promise<PupoLocation | null> {
  const { db, pupiTable } = getDb()
  const current = await getPupoById(id)
  if (!current) return null

  const updatedPupo = { ...current, ...updates }
  await db
    .update(pupiTable as any)
    .set(updates)
    .where(eq((pupiTable as any).id, id))
  return updatedPupo
}

export async function deletePupo(id: string): Promise<boolean> {
  const { db, pupiTable } = getDb()
  const result = await db
    .delete(pupiTable as any)
    .where(eq((pupiTable as any).id, id))
  // Note: Drizzle doesn't return rowCount consistently across drivers
  // We'll check if the pupo still exists to determine success
  const check = await getPupoById(id)
  return check === undefined
}

export async function insertBulkPupi(pupi: PupoLocation[]): Promise<void> {
  const { db, pupiTable } = getDb()
  if (pupi.length === 0) return

  try {
    await db.insert(pupiTable as any).values(pupi)
  } catch (error) {
    console.error("Error inserting bulk pupi:", error)
    throw error
  }
}
