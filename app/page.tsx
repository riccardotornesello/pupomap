"use server"

import { PupoLocation } from "@/types"
import HomeContent from "./content"

export default async function Home() {
  let pupiData: PupoLocation[] | null = null

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"

    const response = await fetch(`${baseUrl}/api/pupi`)
    if (response.ok) {
      pupiData = await response.json()
    } else {
      console.error("Failed to fetch pupi data:", response.statusText)
    }
  } catch (error) {
    console.error("Error fetching pupi data:", error)
  }

  return <HomeContent pupiData={pupiData} />
}
