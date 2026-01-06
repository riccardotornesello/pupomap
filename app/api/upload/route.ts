import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { bulkImportPupi } from "@/lib/db"
import { PupoLocation } from "@/types"

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const adminPassword = request.headers.get("x-admin-password")
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""

    // Handle JSON import
    if (contentType.includes("application/json")) {
      try {
        const body = await request.json()

        // Validate that it's an array
        if (!Array.isArray(body)) {
          return NextResponse.json(
            { error: "JSON must be an array of pupo objects" },
            { status: 400 }
          )
        }

        // Validate each pupo has required fields
        for (const pupo of body) {
          if (
            !pupo.name ||
            typeof pupo.name !== "string" ||
            pupo.name.trim() === "" ||
            !pupo.description ||
            typeof pupo.description !== "string" ||
            pupo.description.trim() === "" ||
            typeof pupo.lat !== "number" ||
            typeof pupo.lng !== "number" ||
            !pupo.image ||
            typeof pupo.image !== "string" ||
            pupo.image.trim() === "" ||
            !pupo.artist ||
            typeof pupo.artist !== "string" ||
            pupo.artist.trim() === "" ||
            !pupo.theme ||
            typeof pupo.theme !== "string" ||
            pupo.theme.trim() === ""
          ) {
            return NextResponse.json(
              {
                error:
                  "Each pupo must have: name, description, lat (number), lng (number), image, artist, theme. All string fields must be non-empty.",
              },
              { status: 400 }
            )
          }
        }

        // Import the data
        const result = await bulkImportPupi(
          body.map((pupo: Partial<PupoLocation>) => ({
            name: pupo.name!,
            description: pupo.description!,
            lat: pupo.lat!,
            lng: pupo.lng!,
            image: pupo.image!,
            artist: pupo.artist!,
            theme: pupo.theme!,
          }))
        )

        return NextResponse.json(
          {
            message: `Import completed: ${result.success} successful, ${result.failed} failed`,
            ...result,
          },
          { status: 200 }
        )
      } catch (error) {
        console.error("Error importing JSON:", error)
        return NextResponse.json(
          { error: "Failed to import JSON data" },
          { status: 500 }
        )
      }
    }

    // Handle image upload (existing functionality)
    if (contentType.includes("multipart/form-data")) {
      // Check if Vercel Blob is configured
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          { error: "Vercel Blob not configured" },
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

      // Generate unique filename
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 9)
      const filenameParts = file.name.split(".")
      const extension = filenameParts.length > 1 ? filenameParts.pop() : "jpg"
      const filename = `pupi/${timestamp}-${randomSuffix}.${extension}`

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      return NextResponse.json({ url: blob.url }, { status: 200 })
    }

    return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
  } catch (error) {
    console.error("Error in upload endpoint:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
