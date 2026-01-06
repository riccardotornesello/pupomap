"use server"

import { PupoLocation } from "@/types"
import { getAllPupi } from "@/lib/db"
import HomeContent from "./content"

export default async function Home() {
  let pupiData: PupoLocation[] | null = null

  try {
    pupiData = await getAllPupi()
  } catch (error) {
    console.error("Error fetching pupi data:", error)
  }

  return <HomeContent pupiData={pupiData} />
}
