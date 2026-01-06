import { PupoLocation } from "@/types"
import { getDatabase, isPostgreSQL } from "./database"

export async function getAllPupi(): Promise<PupoLocation[]> {
  const db = getDatabase()
  try {
    if (isPostgreSQL(db)) {
      return await db.getAllPupiAsync()
    } else {
      return db.getAllPupi()
    }
  } catch (error) {
    console.error("Error reading pupi data:", error)
    return []
  }
}

export async function getPupoById(
  id: string
): Promise<PupoLocation | undefined> {
  const db = getDatabase()
  try {
    if (isPostgreSQL(db)) {
      return await db.getPupoByIdAsync(id)
    } else {
      return db.getPupoById(id)
    }
  } catch (error) {
    console.error("Error reading pupo data:", error)
    return undefined
  }
}

export async function createPupo(
  pupo: Omit<PupoLocation, "id">
): Promise<PupoLocation> {
  const db = getDatabase()
  // Generate a more robust ID using timestamp + random string
  const randomSuffix = Math.random().toString(36).substring(2, 9)
  const newPupo = {
    ...pupo,
    id: `${Date.now()}-${randomSuffix}`,
  }

  if (isPostgreSQL(db)) {
    return await db.createPupoAsync(newPupo)
  } else {
    return db.createPupo(newPupo)
  }
}

export async function updatePupo(
  id: string,
  updates: Partial<Omit<PupoLocation, "id">>
): Promise<PupoLocation | null> {
  const db = getDatabase()
  if (isPostgreSQL(db)) {
    return await db.updatePupoAsync(id, updates)
  } else {
    return db.updatePupo(id, updates)
  }
}

export async function deletePupo(id: string): Promise<boolean> {
  const db = getDatabase()
  if (isPostgreSQL(db)) {
    return await db.deletePupoAsync(id)
  } else {
    return db.deletePupo(id)
  }
}
