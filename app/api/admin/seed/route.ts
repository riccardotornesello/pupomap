import { NextRequest, NextResponse } from "next/server"
import { insertBulkPupi, getAllPupi } from "@/lib/db"
import { PupoLocation } from "@/types"

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const adminPassword = request.headers.get("x-admin-password")
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pupi } = body as {
      pupi: PupoLocation[]
    }

    if (!Array.isArray(pupi)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of pupi." },
        { status: 400 }
      )
    }

    // Validate that all pupi have required fields
    for (const pupo of pupi) {
      if (
        !pupo.id ||
        !pupo.name ||
        !pupo.description ||
        typeof pupo.lat !== "number" ||
        typeof pupo.lng !== "number" ||
        !pupo.imageUrl ||
        !pupo.artist ||
        !pupo.theme
      ) {
        return NextResponse.json(
          {
            error: `Invalid pupo data. Missing required fields for pupo: ${JSON.stringify(pupo)}`,
          },
          { status: 400 }
        )
      }
    }

    // Insert the new data (admin can manually delete existing pupi if needed)
    await insertBulkPupi(pupi)

    const allPupi = await getAllPupi()

    return NextResponse.json(
      {
        success: true,
        message: `Successfully imported ${pupi.length} pupi`,
        total: allPupi.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error importing pupi:", error)
    return NextResponse.json(
      { error: "Failed to import pupi", details: String(error) },
      { status: 500 }
    )
  }
}
