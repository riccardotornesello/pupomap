import { NextRequest, NextResponse } from "next/server"
import { getAllPupi, createPupo } from "@/lib/db"

export async function GET() {
  try {
    const pupi = getAllPupi()
    return NextResponse.json(pupi)
  } catch (error) {
    console.error("Error fetching pupi:", error)
    return NextResponse.json(
      { error: "Failed to fetch pupi" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const adminPassword = request.headers.get("x-admin-password")
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, lat, lng, imageUrl, artist, theme } = body

    if (!name || !description || !lat || !lng || !imageUrl || !artist || !theme) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const newPupo = createPupo({
      name,
      description,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      imageUrl,
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
