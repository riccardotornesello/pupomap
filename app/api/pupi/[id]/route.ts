import { NextRequest, NextResponse } from "next/server"
import { getPupoById, updatePupo, deletePupo } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pupo = await getPupoById(id)

    if (!pupo) {
      return NextResponse.json({ error: "Pupo not found" }, { status: 404 })
    }

    return NextResponse.json(pupo)
  } catch (error) {
    console.error("Error fetching pupo:", error)
    return NextResponse.json(
      { error: "Failed to fetch pupo" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    // Note: In production, use HTTPS and consider implementing proper session tokens
    const adminPassword = request.headers.get("x-admin-password")
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updatedPupo = await updatePupo(id, body)

    if (!updatedPupo) {
      return NextResponse.json({ error: "Pupo not found" }, { status: 404 })
    }

    return NextResponse.json(updatedPupo)
  } catch (error) {
    console.error("Error updating pupo:", error)
    return NextResponse.json(
      { error: "Failed to update pupo" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    // Note: In production, use HTTPS and consider implementing proper session tokens
    const adminPassword = request.headers.get("x-admin-password")
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const deleted = await deletePupo(id)

    if (!deleted) {
      return NextResponse.json({ error: "Pupo not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting pupo:", error)
    return NextResponse.json(
      { error: "Failed to delete pupo" },
      { status: 500 }
    )
  }
}
