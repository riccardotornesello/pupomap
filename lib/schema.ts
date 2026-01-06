import { sqliteTable, text, real } from "drizzle-orm/sqlite-core"
import { pgTable, text as pgText, doublePrecision } from "drizzle-orm/pg-core"

// Check which database we're using
const isPostgres = process.env.DATABASE_URL?.startsWith("postgres")

// Use conditional export to provide the right schema
export const pupi = isPostgres
  ? pgTable("pupi", {
      id: pgText("id").primaryKey(),
      name: pgText("name").notNull(),
      description: pgText("description").notNull(),
      lat: doublePrecision("lat").notNull(),
      lng: doublePrecision("lng").notNull(),
      imageUrl: pgText("imageUrl").notNull(),
      artist: pgText("artist").notNull(),
      theme: pgText("theme").notNull(),
    })
  : sqliteTable("pupi", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      lat: real("lat").notNull(),
      lng: real("lng").notNull(),
      imageUrl: text("imageUrl").notNull(),
      artist: text("artist").notNull(),
      theme: text("theme").notNull(),
    })

// Type inference
export type Pupo = typeof pupi.$inferSelect
export type NewPupo = typeof pupi.$inferInsert
