import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      )
    }

    // Check password against environment variable
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error during admin login:", error)
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 }
    )
  }
}
