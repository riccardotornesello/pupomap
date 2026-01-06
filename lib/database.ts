import Database from "better-sqlite3"
import { Pool } from "pg"
import { PupoLocation } from "@/types"
import path from "path"
import fs from "fs"

// Database interface for abstraction
interface DatabaseAdapter {
  initialize(): void | Promise<void>
  getAllPupi(): PupoLocation[]
  getPupoById(id: number): PupoLocation | undefined
  createPupo(pupo: PupoLocation): PupoLocation
  updatePupo(
    id: number,
    updates: Partial<Omit<PupoLocation, "id">>
  ): PupoLocation | null
  deletePupo(id: number): boolean
  close(): void
}

// SQLite adapter
class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database

  constructor(filename: string) {
    this.db = new Database(filename)
    this.db.pragma("journal_mode = WAL")
  }

  initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pupi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        imageUrl TEXT NOT NULL,
        artist TEXT NOT NULL,
        theme TEXT NOT NULL
      )
    `)
  }

  getAllPupi(): PupoLocation[] {
    const stmt = this.db.prepare("SELECT * FROM pupi")
    return stmt.all() as PupoLocation[]
  }

  getPupoById(id: number): PupoLocation | undefined {
    const stmt = this.db.prepare("SELECT * FROM pupi WHERE id = ?")
    return stmt.get(id) as PupoLocation | undefined
  }

  createPupo(pupo: PupoLocation): PupoLocation {
    const stmt = this.db.prepare(`
      INSERT INTO pupi (name, description, lat, lng, imageUrl, artist, theme)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      pupo.name,
      pupo.description,
      pupo.lat,
      pupo.lng,
      pupo.imageUrl,
      pupo.artist,
      pupo.theme
    )
    return { ...pupo, id: result.lastInsertRowid as number }
  }

  updatePupo(
    id: number,
    updates: Partial<Omit<PupoLocation, "id">>
  ): PupoLocation | null {
    const current = this.getPupoById(id)
    if (!current) return null

    const updatedPupo = { ...current, ...updates }
    const stmt = this.db.prepare(`
      UPDATE pupi
      SET name = ?, description = ?, lat = ?, lng = ?, imageUrl = ?, artist = ?, theme = ?
      WHERE id = ?
    `)
    stmt.run(
      updatedPupo.name,
      updatedPupo.description,
      updatedPupo.lat,
      updatedPupo.lng,
      updatedPupo.imageUrl,
      updatedPupo.artist,
      updatedPupo.theme,
      id
    )
    return updatedPupo
  }

  deletePupo(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM pupi WHERE id = ?")
    const result = stmt.run(id)
    return result.changes > 0
  }

  close(): void {
    this.db.close()
  }
}

// PostgreSQL adapter
class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool
  private initialized = false

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    })
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    const client = await this.pool.connect()
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS pupi (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          imageUrl TEXT NOT NULL,
          artist TEXT NOT NULL,
          theme TEXT NOT NULL
        )
      `)

      this.initialized = true
    } finally {
      client.release()
    }
  }

  getAllPupi(): PupoLocation[] {
    throw new Error(
      "Synchronous methods not supported for PostgreSQL. Use async operations."
    )
  }

  async getAllPupiAsync(): Promise<PupoLocation[]> {
    await this.initialize()
    const result = await this.pool.query("SELECT * FROM pupi")
    return result.rows as PupoLocation[]
  }

  getPupoById(_id: number): PupoLocation | undefined {
    throw new Error(
      "Synchronous methods not supported for PostgreSQL. Use async operations."
    )
  }

  async getPupoByIdAsync(id: number): Promise<PupoLocation | undefined> {
    await this.initialize()
    const result = await this.pool.query("SELECT * FROM pupi WHERE id = $1", [
      id,
    ])
    return result.rows[0] as PupoLocation | undefined
  }

  createPupo(_pupo: PupoLocation): PupoLocation {
    throw new Error(
      "Synchronous methods not supported for PostgreSQL. Use async operations."
    )
  }

  async createPupoAsync(pupo: PupoLocation): Promise<PupoLocation> {
    await this.initialize()
    const result = await this.pool.query(
      `INSERT INTO pupi (name, description, lat, lng, imageUrl, artist, theme)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        pupo.name,
        pupo.description,
        pupo.lat,
        pupo.lng,
        pupo.imageUrl,
        pupo.artist,
        pupo.theme,
      ]
    )
    return { ...pupo, id: result.rows[0].id }
  }

  updatePupo(
    _id: number,
    _updates: Partial<Omit<PupoLocation, "id">>
  ): PupoLocation | null {
    throw new Error(
      "Synchronous methods not supported for PostgreSQL. Use async operations."
    )
  }

  async updatePupoAsync(
    id: number,
    updates: Partial<Omit<PupoLocation, "id">>
  ): Promise<PupoLocation | null> {
    await this.initialize()
    const current = await this.getPupoByIdAsync(id)
    if (!current) return null

    const updatedPupo = { ...current, ...updates }
    await this.pool.query(
      `UPDATE pupi
       SET name = $1, description = $2, lat = $3, lng = $4, imageUrl = $5, artist = $6, theme = $7
       WHERE id = $8`,
      [
        updatedPupo.name,
        updatedPupo.description,
        updatedPupo.lat,
        updatedPupo.lng,
        updatedPupo.imageUrl,
        updatedPupo.artist,
        updatedPupo.theme,
        id,
      ]
    )
    return updatedPupo
  }

  deletePupo(_id: number): boolean {
    throw new Error(
      "Synchronous methods not supported for PostgreSQL. Use async operations."
    )
  }

  async deletePupoAsync(id: number): Promise<boolean> {
    await this.initialize()
    const result = await this.pool.query("DELETE FROM pupi WHERE id = $1", [
      id,
    ])
    return result.rowCount !== null && result.rowCount > 0
  }

  close(): void {
    this.pool.end()
  }
}

// Factory to create the appropriate adapter
function createDatabaseAdapter(): DatabaseAdapter {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    // Default to SQLite if no DATABASE_URL is provided
    console.log("No DATABASE_URL found, using SQLite (data/pupi.db)")
    const dataDir = path.join(process.cwd(), "data")
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    const dbPath = path.join(dataDir, "pupi.db")
    const adapter = new SQLiteAdapter(dbPath)
    adapter.initialize()
    return adapter
  }

  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    console.log("Using PostgreSQL database")
    return new PostgreSQLAdapter(databaseUrl)
  }

  if (databaseUrl.startsWith("sqlite://") || databaseUrl.startsWith("file:")) {
    console.log("Using SQLite database")
    const dbPath = databaseUrl.replace(/^(sqlite:\/\/|file:)/, "")
    const adapter = new SQLiteAdapter(dbPath)
    adapter.initialize()
    return adapter
  }

  // Default: treat as SQLite path
  console.log("Using SQLite database")
  const adapter = new SQLiteAdapter(databaseUrl)
  adapter.initialize()
  return adapter
}

// Singleton instance
let dbInstance: DatabaseAdapter | null = null

export function getDatabase(): DatabaseAdapter {
  if (!dbInstance) {
    dbInstance = createDatabaseAdapter()
  }
  return dbInstance
}

export function isPostgreSQL(
  db: DatabaseAdapter
): db is PostgreSQLAdapter {
  return db instanceof PostgreSQLAdapter
}
