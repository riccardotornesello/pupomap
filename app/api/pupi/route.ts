import { NextRequest, NextResponse } from "next/server"
import { getAllPupi, createPupo } from "@/lib/db"

export async function GET() {
  try {
    const pupi = await getAllPupi()
    return NextResponse.json(pupi)
  } catch (error) {
    console.error("Error fetching pupi:", error)
    return NextResponse.json({ error: "Failed to fetch pupi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    // Note: In production, use HTTPS and consider implementing proper session tokens
    // This simple approach is suitable for single-admin scenarios
    const adminPassword = request.headers.get("x-admin-password")
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, lat, lng, image, artist, theme } = body

    if (!name || !description || !lat || !lng || !image || !artist || !theme) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)

    // Validate coordinates are valid numbers and within reasonable ranges
    if (
      isNaN(parsedLat) ||
      isNaN(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      )
    }

    const newPupo = await createPupo({
      name,
      description,
      lat: parsedLat,
      lng: parsedLng,
      image,
      artist,
      theme,
    })

    return NextResponse.json(newPupo, { status: 201 })
  } catch (error) {
    console.error("Error creating pupo:", error)
    return NextResponse.json(
      { error: "Failed to create pupo" },
      { status: 500 }
    )
  }
}
