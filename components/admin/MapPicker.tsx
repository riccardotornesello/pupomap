"use client"

import React, { useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { INITIAL_CENTER, GALLIPOLI_BOUNDS } from "@/constants"
import { MapPin } from "lucide-react"
import { renderToString } from "react-dom/server"

const createCustomIcon = (color: string = "#DC2626") => {
  const iconHtml = renderToString(
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ color: color }} className="drop-shadow-md filter">
        <MapPin
          fill="currentColor"
          stroke="white"
          strokeWidth={1.5}
          size={40}
        />
      </div>
    </div>
  )

  return L.divIcon({
    html: iconHtml,
    className: "custom-marker-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })
}

const customIcon = createCustomIcon("#DC2626")

interface LocationMarkerProps {
  position: [number, number] | null
  onPositionChange: (position: [number, number]) => void
}

function LocationMarker({ position, onPositionChange }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng])
    },
  })

  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  )
}

interface MapPickerProps {
  initialLat?: number
  initialLng?: number
  onLocationSelect: (lat: number, lng: number) => void
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLat,
  initialLng,
  onLocationSelect,
}) => {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  )

  const handlePositionChange = (newPosition: [number, number]) => {
    setPosition(newPosition)
    onLocationSelect(newPosition[0], newPosition[1])
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-stone-300">
      <MapContainer
        center={position || INITIAL_CENTER}
        zoom={14}
        minZoom={13}
        maxBounds={GALLIPOLI_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          onPositionChange={handlePositionChange}
        />
      </MapContainer>
    </div>
  )
}

export default MapPicker
