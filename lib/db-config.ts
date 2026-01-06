import path from "path"

/**
 * Get the default SQLite database path
 * Centralizes the database path configuration used across the application
 */
export function getDefaultSqlitePath(): string {
  return path.join(process.cwd(), "data", "pupi.db")
}

/**
 * Check if the given database URL is for PostgreSQL
 */
export function isPostgresUrl(databaseUrl?: string): boolean {
  return !!(
    databaseUrl &&
    (databaseUrl.startsWith("postgres://") ||
      databaseUrl.startsWith("postgresql://"))
  )
}

/**
 * Check if the given database URL is for SQLite
 */
export function isSqliteUrl(databaseUrl?: string): boolean {
  return !!(
    databaseUrl &&
    (databaseUrl.startsWith("sqlite://") || databaseUrl.startsWith("file:"))
  )
}

/**
 * Parse SQLite URL to file path
 */
export function parseSqliteUrl(databaseUrl: string): string {
  return databaseUrl.replace(/^(sqlite:\/\/|file:)/, "")
}
