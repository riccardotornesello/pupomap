import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const adminPassword = request.headers.get("x-admin-password")
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if GCS is configured
    if (!process.env.GCS_BUCKET_NAME) {
      return NextResponse.json(
        { error: "Google Cloud Storage not configured" },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    // Initialize Google Cloud Storage
    let credentials
    try {
      credentials = process.env.GCS_CREDENTIALS
        ? JSON.parse(process.env.GCS_CREDENTIALS)
        : undefined
    } catch (error) {
      console.error("Error parsing GCS_CREDENTIALS:", error)
      return NextResponse.json(
        { error: "Invalid GCS configuration" },
        { status: 500 }
      )
    }

    const storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials,
    })

    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME)

    // Generate unique filename
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    const filenameParts = file.name.split(".")
    const extension = filenameParts.length > 1 ? filenameParts.pop() : "jpg"
    const filename = `pupi/${timestamp}-${randomSuffix}.${extension}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to GCS
    const gcsFile = bucket.file(filename)
    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      public: true,
    })

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filename}`

    return NextResponse.json({ url: publicUrl }, { status: 200 })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
