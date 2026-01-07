export interface PupoLocation {
  id: number
  name: string
  description: string
  lat: number
  lng: number
  image: string
  artist: string
  theme: string // e.g., Satira Politica, Tradizionale, Fantasia
  address?: string // Optional address field
}

export interface User {
  id: string
  firstName: string
  lastName: string
  name: string // Full name for display
  avatar?: string
}

export enum ViewMode {
  MAP = "MAP",
  LIST = "LIST",
}
