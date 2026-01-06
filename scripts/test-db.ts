#!/usr/bin/env node
import { getAllPupi, createPupo, getPupoById, updatePupo, deletePupo, insertBulkPupi } from "../lib/db"

async function testDatabase() {
  console.log("Testing database operations...")

  // Test 1: Create a pupo
  console.log("\n1. Creating a test pupo...")
  const testPupo = await createPupo({
    name: "Test Pupo",
    description: "A test pupo for verification",
    lat: 40.0565,
    lng: 17.978,
    imageUrl: "https://example.com/test.jpg",
    artist: "Test Artist",
    theme: "Test Theme"
  })
  console.log("✓ Created pupo:", testPupo.id)

  // Test 2: Get pupo by ID
  console.log("\n2. Getting pupo by ID...")
  const retrieved = await getPupoById(testPupo.id)
  console.log("✓ Retrieved pupo:", retrieved?.name)

  // Test 3: Update pupo
  console.log("\n3. Updating pupo...")
  const updated = await updatePupo(testPupo.id, { name: "Updated Test Pupo" })
  console.log("✓ Updated pupo name:", updated?.name)

  // Test 4: Get all pupi
  console.log("\n4. Getting all pupi...")
  const allPupi = await getAllPupi()
  console.log("✓ Total pupi in database:", allPupi.length)

  // Test 5: Delete pupo
  console.log("\n5. Deleting test pupo...")
  const deleted = await deletePupo(testPupo.id)
  console.log("✓ Deleted pupo:", deleted)

  // Test 6: Bulk insert
  console.log("\n6. Testing bulk insert...")
  const bulkPupi = [
    {
      id: "bulk-1",
      name: "Bulk Pupo 1",
      description: "Description 1",
      lat: 40.0565,
      lng: 17.978,
      imageUrl: "https://example.com/1.jpg",
      artist: "Artist 1",
      theme: "Theme 1"
    },
    {
      id: "bulk-2",
      name: "Bulk Pupo 2",
      description: "Description 2",
      lat: 40.0566,
      lng: 17.979,
      imageUrl: "https://example.com/2.jpg",
      artist: "Artist 2",
      theme: "Theme 2"
    }
  ]
  await insertBulkPupi(bulkPupi)
  const afterBulk = await getAllPupi()
  console.log("✓ Total pupi after bulk insert:", afterBulk.length)

  console.log("\n✅ All database tests passed!")
}

testDatabase()
  .then(() => {
    console.log("\nTest completed successfully!")
    process.exit(0)
  })
  .catch((err) => {
    console.error("\n❌ Test failed:", err)
    process.exit(1)
  })
