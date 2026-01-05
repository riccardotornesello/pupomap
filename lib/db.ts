import { PupoLocation } from "@/types"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const PUPI_FILE = path.join(DATA_DIR, "pupi.json")

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Initialize with default data if file doesn't exist
function initializePupiData() {
  ensureDataDir()
  if (!fs.existsSync(PUPI_FILE)) {
    const defaultData = [
      {
        id: "1",
        name: "Il Vecchione di Corso Roma",
        description:
          "Il classico 'Pupo' che rappresenta l'anno vecchio che se ne va. Situato nel cuore dello shopping gallipolino, questo gigante di cartapesta è circondato da simboli satirici degli eventi dell'anno.",
        lat: 40.0565,
        lng: 17.978,
        imageUrl: "https://picsum.photos/800/600?random=1",
        artist: "Associazione Cartapesta Gallipolina",
        theme: "Tradizionale",
      },
      {
        id: "2",
        name: "Sbarco nel Centro Storico",
        description:
          "Posizionato vicino al ponte antico, questo pupo accoglie i visitatori con una scena ironica sulla politica locale. I dettagli dei volti sono incredibilmente realistici.",
        lat: 40.055,
        lng: 17.972,
        imageUrl: "https://picsum.photos/800/600?random=2",
        artist: "Rione Borgo",
        theme: "Satira Politica",
      },
      {
        id: "3",
        name: "La Festa alla Stazione",
        description:
          "Situato nel piazzale della stazione ferroviaria, un'esplosione di colori che rappresenta la speranza per il nuovo anno. Include fuochi d'artificio simulati in cartapesta.",
        lat: 40.058,
        lng: 17.985,
        imageUrl: "https://picsum.photos/800/600?random=3",
        artist: "Gruppo 'Mani d'Oro'",
        theme: "Fantasia",
      },
      {
        id: "4",
        name: "Il Pescatore di Sogni",
        description:
          "Vicino al porto, questo pupo rende omaggio alla tradizione marittima della città, mescolando elementi marini con la classica figura del vecchio anno.",
        lat: 40.0535,
        lng: 17.9755,
        imageUrl: "https://picsum.photos/800/600?random=4",
        artist: "Lega Navale Creativa",
        theme: "Cultura Locale",
      },
      {
        id: "5",
        name: "Lo Scoppio di Piazza Tellini",
        description:
          "Uno dei pupi più grandi, famoso per essere riempito (simbolicamente) di petardi. Rappresenta le tasse e le difficoltà economiche che vogliamo lasciarci alle spalle.",
        lat: 40.0545,
        lng: 17.9795,
        imageUrl: "https://picsum.photos/800/600?random=5",
        artist: "Giovani Artisti Gallipolini",
        theme: "Satira Sociale",
      },
    ]
    fs.writeFileSync(PUPI_FILE, JSON.stringify(defaultData, null, 2))
  }
}

export function getAllPupi(): PupoLocation[] {
  initializePupiData()
  const data = fs.readFileSync(PUPI_FILE, "utf-8")
  return JSON.parse(data)
}

export function getPupoById(id: string): PupoLocation | undefined {
  const pupi = getAllPupi()
  return pupi.find((pupo) => pupo.id === id)
}

export function createPupo(pupo: Omit<PupoLocation, "id">): PupoLocation {
  const pupi = getAllPupi()
  const newPupo = {
    ...pupo,
    id: Date.now().toString(),
  }
  pupi.push(newPupo)
  fs.writeFileSync(PUPI_FILE, JSON.stringify(pupi, null, 2))
  return newPupo
}

export function updatePupo(
  id: string,
  updates: Partial<Omit<PupoLocation, "id">>
): PupoLocation | null {
  const pupi = getAllPupi()
  const index = pupi.findIndex((pupo) => pupo.id === id)
  if (index === -1) return null

  pupi[index] = { ...pupi[index], ...updates }
  fs.writeFileSync(PUPI_FILE, JSON.stringify(pupi, null, 2))
  return pupi[index]
}

export function deletePupo(id: string): boolean {
  const pupi = getAllPupi()
  const filteredPupi = pupi.filter((pupo) => pupo.id !== id)
  if (filteredPupi.length === pupi.length) return false

  fs.writeFileSync(PUPI_FILE, JSON.stringify(filteredPupi, null, 2))
  return true
}
