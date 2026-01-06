"use server"

import { PupoLocation } from "@/types"
import HomeContent from "./content"

export default async function Home() {
  let pupiData: PupoLocation[] = []

  try {
    // TODO: variable url
    const response = await fetch("http://localhost:3000/api/pupi")
    if (response.ok) {
      pupiData = await response.json()
    } else {
      console.error("Failed to fetch pupi data:", response.statusText)
    }
  } catch (error) {
    console.error("Error fetching pupi data:", error)
  }

  // TODO: show message if pupiData is empty
  return <HomeContent pupiData={pupiData} />
}
