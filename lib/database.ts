import Database from "better-sqlite3"
import { Pool } from "pg"
import { PupoLocation } from "@/types"
import path from "path"
import fs from "fs"

// Database interface for abstraction
interface DatabaseAdapter {
  initialize(): void | Promise<void>
  getAllPupi(): Promise<PupoLocation[]>
  getPupoById(id: number): Promise<PupoLocation | undefined>
  createPupo(pupo: PupoLocation): Promise<PupoLocation>
  updatePupo(
    id: number,
    updates: Partial<Omit<PupoLocation, "id">>
  ): Promise<PupoLocation | null>
  deletePupo(id: number): Promise<boolean>
  // Vote management
  addVote(userId: string, pupoId: number): Promise<void>
  removeVote(userId: string, pupoId: number): Promise<void>
  getUserVotes(userId: string): Promise<number[]>
  getVoteCounts(): Promise<Record<number, number>>
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
        image TEXT NOT NULL,
        artist TEXT NOT NULL,
        theme TEXT NOT NULL,
        address TEXT
      );

      CREATE TABLE IF NOT EXISTS votes (
        user_id TEXT NOT NULL,
        pupo_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, pupo_id),
        FOREIGN KEY (pupo_id) REFERENCES pupi(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_votes_pupo_id ON votes(pupo_id);
      CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
    `)
    
    // Add address column if it doesn't exist (for existing databases)
    try {
      this.db.exec(`ALTER TABLE pupi ADD COLUMN address TEXT`)
    } catch {
      // Column already exists, ignore error
    }
  }

  async getAllPupi(): Promise<PupoLocation[]> {
    const stmt = this.db.prepare("SELECT * FROM pupi ORDER BY name ASC")
    return stmt.all() as PupoLocation[]
  }

  async getPupoById(id: number): Promise<PupoLocation | undefined> {
    const stmt = this.db.prepare("SELECT * FROM pupi WHERE id = ?")
    return stmt.get(id) as PupoLocation | undefined
  }

  async createPupo(pupo: PupoLocation): Promise<PupoLocation> {
    const stmt = this.db.prepare(`
      INSERT INTO pupi (name, description, lat, lng, image, artist, theme, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      pupo.name,
      pupo.description,
      pupo.lat,
      pupo.lng,
      pupo.image,
      pupo.artist,
      pupo.theme,
      pupo.address || null
    )
    return { ...pupo, id: result.lastInsertRowid as number }
  }

  async updatePupo(
    id: number,
    updates: Partial<Omit<PupoLocation, "id">>
  ): Promise<PupoLocation | null> {
    const current = await this.getPupoById(id)
    if (!current) return null

    const updatedPupo = { ...current, ...updates }
    const stmt = this.db.prepare(`
      UPDATE pupi
      SET name = ?, description = ?, lat = ?, lng = ?, image = ?, artist = ?, theme = ?, address = ?
      WHERE id = ?
    `)
    stmt.run(
      updatedPupo.name,
      updatedPupo.description,
      updatedPupo.lat,
      updatedPupo.lng,
      updatedPupo.image,
      updatedPupo.artist,
      updatedPupo.theme,
      updatedPupo.address || null,
      id
    )
    return updatedPupo
  }

  async deletePupo(id: number): Promise<boolean> {
    const stmt = this.db.prepare("DELETE FROM pupi WHERE id = ?")
    const result = stmt.run(id)
    return result.changes > 0
  }

  async addVote(userId: string, pupoId: number): Promise<void> {
    const stmt = this.db.prepare(
      "INSERT OR IGNORE INTO votes (user_id, pupo_id) VALUES (?, ?)"
    )
    stmt.run(userId, pupoId)
  }

  async removeVote(userId: string, pupoId: number): Promise<void> {
    const stmt = this.db.prepare(
      "DELETE FROM votes WHERE user_id = ? AND pupo_id = ?"
    )
    stmt.run(userId, pupoId)
  }

  async getUserVotes(userId: string): Promise<number[]> {
    const stmt = this.db.prepare("SELECT pupo_id FROM votes WHERE user_id = ?")
    const rows = stmt.all(userId) as { pupo_id: number }[]
    return rows.map((row) => row.pupo_id)
  }

  async getVoteCounts(): Promise<Record<number, number>> {
    const stmt = this.db.prepare(
      "SELECT pupo_id, COUNT(*) as count FROM votes GROUP BY pupo_id"
    )
    const rows = stmt.all() as { pupo_id: number; count: number }[]
    const counts: Record<number, number> = {}
    for (const row of rows) {
      counts[row.pupo_id] = row.count
    }
    return counts
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
          image TEXT NOT NULL,
          artist TEXT NOT NULL,
          theme TEXT NOT NULL,
          address TEXT
        );

        CREATE TABLE IF NOT EXISTS votes (
          user_id TEXT NOT NULL,
          pupo_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, pupo_id),
          FOREIGN KEY (pupo_id) REFERENCES pupi(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_votes_pupo_id ON votes(pupo_id);
        CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
      `)
      
      // Add address column if it doesn't exist (for existing databases)
      try {
        await client.query(`ALTER TABLE pupi ADD COLUMN address TEXT`)
      } catch {
        // Column already exists, ignore error
      }

      this.initialized = true
    } finally {
      client.release()
    }
  }

  async getAllPupi(): Promise<PupoLocation[]> {
    await this.initialize()
    const result = await this.pool.query("SELECT * FROM pupi ORDER BY name ASC")
    return result.rows as PupoLocation[]
  }

  async getPupoById(id: number): Promise<PupoLocation | undefined> {
    await this.initialize()
    const result = await this.pool.query("SELECT * FROM pupi WHERE id = $1", [
      id,
    ])
    return result.rows[0] as PupoLocation | undefined
  }

  async createPupo(pupo: PupoLocation): Promise<PupoLocation> {
    await this.initialize()
    const result = await this.pool.query(
      `INSERT INTO pupi (name, description, lat, lng, image, artist, theme, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        pupo.name,
        pupo.description,
        pupo.lat,
        pupo.lng,
        pupo.image,
        pupo.artist,
        pupo.theme,
        pupo.address || null,
      ]
    )
    return { ...pupo, id: result.rows[0].id }
  }

  async updatePupo(
    id: number,
    updates: Partial<Omit<PupoLocation, "id">>
  ): Promise<PupoLocation | null> {
    await this.initialize()
    const current = await this.getPupoById(id)
    if (!current) return null

    const updatedPupo = { ...current, ...updates }
    await this.pool.query(
      `UPDATE pupi
       SET name = $1, description = $2, lat = $3, lng = $4, image = $5, artist = $6, theme = $7, address = $8
       WHERE id = $9`,
      [
        updatedPupo.name,
        updatedPupo.description,
        updatedPupo.lat,
        updatedPupo.lng,
        updatedPupo.image,
        updatedPupo.artist,
        updatedPupo.theme,
        updatedPupo.address || null,
        id,
      ]
    )
    return updatedPupo
  }

  async deletePupo(id: number): Promise<boolean> {
    await this.initialize()
    const result = await this.pool.query("DELETE FROM pupi WHERE id = $1", [id])
    return result.rowCount !== null && result.rowCount > 0
  }

  async addVote(userId: string, pupoId: number): Promise<void> {
    await this.initialize()
    await this.pool.query(
      "INSERT INTO votes (user_id, pupo_id) VALUES ($1, $2) ON CONFLICT (user_id, pupo_id) DO NOTHING",
      [userId, pupoId]
    )
  }

  async removeVote(userId: string, pupoId: number): Promise<void> {
    await this.initialize()
    await this.pool.query(
      "DELETE FROM votes WHERE user_id = $1 AND pupo_id = $2",
      [userId, pupoId]
    )
  }

  async getUserVotes(userId: string): Promise<number[]> {
    await this.initialize()
    const result = await this.pool.query(
      "SELECT pupo_id FROM votes WHERE user_id = $1",
      [userId]
    )
    return result.rows.map((row) => row.pupo_id)
  }

  async getVoteCounts(): Promise<Record<number, number>> {
    await this.initialize()
    const result = await this.pool.query(
      "SELECT pupo_id, COUNT(*) as count FROM votes GROUP BY pupo_id"
    )
    const counts: Record<number, number> = {}
    for (const row of result.rows) {
      counts[row.pupo_id] = parseInt(row.count, 10)
    }
    return counts
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

  if (
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://")
  ) {
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
