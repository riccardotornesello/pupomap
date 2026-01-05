export interface PupoLocation {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  imageUrl: string;
  artist: string;
  theme: string; // e.g., Satira Politica, Tradizionale, Fantasia
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export enum ViewMode {
  MAP = 'MAP',
  LIST = 'LIST'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}