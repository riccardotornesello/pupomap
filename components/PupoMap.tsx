import React, { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { PupoLocation } from "../types"
import { INITIAL_CENTER, GALLIPOLI_BOUNDS } from "../constants"
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
    iconAnchor: [20, 40], // X=Center, Y=Bottom
    popupAnchor: [0, -40],
  })
}

const customIcon = createCustomIcon("#DC2626")

interface MapControllerProps {
  center: [number, number]
}

const MapController: React.FC<MapControllerProps> = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 15)
  }, [center, map])
  return null
}

interface PupoMapProps {
  locations: PupoLocation[]
  onSelectLocation: (location: PupoLocation) => void
  selectedLocationId?: string
}

export const PupoMap: React.FC<PupoMapProps> = ({
  locations,
  onSelectLocation,
  selectedLocationId,
}) => {
  // Calculate center based on selectedLocationId
  const selectedLocation = selectedLocationId
    ? locations.find((l) => l.id === selectedLocationId)
    : null
  const center: [number, number] = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : INITIAL_CENTER

  return (
    <MapContainer
      center={INITIAL_CENTER}
      zoom={14}
      minZoom={13}
      maxBounds={GALLIPOLI_BOUNDS}
      maxBoundsViscosity={1.0}
      scrollWheelZoom={true}
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController center={center} />

      {locations.map((pupo) => (
        <Marker
          key={pupo.id}
          position={[pupo.lat, pupo.lng]}
          icon={customIcon}
          eventHandlers={{
            click: () => onSelectLocation(pupo),
          }}
        />
      ))}
    </MapContainer>
  )
}

export default PupoMap
