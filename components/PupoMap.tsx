import React, { useEffect, useState } from "react"
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
const userIcon = createCustomIcon("#2563EB")

interface MapControllerProps {
  center: [number, number]
}

const MapController: React.FC<MapControllerProps> = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 })
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
  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER)

  useEffect(() => {
    if (selectedLocationId) {
      const loc = locations.find((l) => l.id === selectedLocationId)
      if (loc) {
        setCenter([loc.lat, loc.lng])
      }
    }
  }, [selectedLocationId, locations])

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
        >
          <Popup className="rounded-lg overflow-hidden">
            <div className="text-center min-w-[150px]">
              <h3 className="font-bold text-stone-800 text-sm mb-1">
                {pupo.name}
              </h3>
              <p className="text-xs text-stone-500 mb-2">{pupo.theme}</p>
              <button
                onClick={() => onSelectLocation(pupo)}
                className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-100 transition-colors"
              >
                Apri Scheda
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default PupoMap
