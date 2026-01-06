#!/usr/bin/env node
import { insertBulkPupi, getAllPupi } from "../lib/db"
import fs from "fs"
import path from "path"

async function testSeed() {
  console.log("Testing seed functionality...")

  // Read the seed data
  const seedData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "seed-data.json"), "utf-8")
  )

  console.log(`\nLoaded ${seedData.length} pupi from seed-data.json`)

  // Insert the seed data
  await insertBulkPupi(seedData)
  console.log("✓ Inserted seed data")

  // Verify the data was inserted
  const allPupi = await getAllPupi()
  console.log(`✓ Total pupi in database: ${allPupi.length}`)

  // List all pupi
  console.log("\nPupi in database:")
  allPupi.forEach((pupo) => {
    console.log(`  - ${pupo.name} (${pupo.id})`)
  })

  console.log("\n✅ Seed test completed successfully!")
}

testSeed()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error("\n❌ Seed test failed:", err)
    process.exit(1)
  })
