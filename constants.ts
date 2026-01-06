import { PupoLocation } from "./types"

// Sample data representing locations in Gallipoli, Italy
// Note: This data is kept for reference. The database no longer seeds automatically.
// To import this data, use the JSON import feature in the admin panel or the seed-data.json file.
export const PUPI_DATA: PupoLocation[] = [
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

export const INITIAL_CENTER: [number, number] = [40.0558, 17.9736] // Gallipoli Center

// Southwest corner to Northeast corner [lat, lng]
export const GALLIPOLI_BOUNDS: [[number, number], [number, number]] = [
  [40.03, 17.95], // SW
  [40.08, 18.01], // NE
]

// Initial mock votes
export const INITIAL_VOTES: Record<string, number> = {
  "1": 42,
  "2": 156,
  "3": 89,
  "4": 230,
  "5": 12,
}
