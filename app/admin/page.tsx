"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { PupoLocation } from "@/types"
import { Plus, Pencil, Trash2, LogOut, MapPin, Upload } from "lucide-react"

const MapPicker = dynamic(() => import("@/components/admin/MapPicker"), {
  loading: () => <p>Caricamento mappa...</p>,
  ssr: false,
})

export default function AdminDashboard() {
  const [pupi, setPupi] = useState<PupoLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [adminPassword, setAdminPassword] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPupo, setEditingPupo] = useState<PupoLocation | null>(null)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lat: "",
    lng: "",
    image: "",
    artist: "",
    theme: "",
    address: "",
  })
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const password = localStorage.getItem("adminPassword")
    if (!password) {
      router.push("/admin/login")
      return
    }

    // Validate password with server
    fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem("adminPassword")
          router.push("/admin/login")
          return
        }
        setAdminPassword(password)
        fetchPupi()
      })
      .catch(() => {
        localStorage.removeItem("adminPassword")
        router.push("/admin/login")
      })
  }, [router])

  const fetchPupi = async () => {
    try {
      const response = await fetch("/api/pupi")
      const data = await response.json()
      setPupi(data)
    } catch (error) {
      console.error("Error fetching pupi:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminPassword")
    router.push("/admin/login")
  }

  const handleJsonUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file || !adminPassword) return

    if (!file.name.endsWith(".json")) {
      alert("Il file deve essere in formato JSON")
      return
    }

    setUploading(true)
    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(jsonData),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        fetchPupi()
      } else {
        const error = await response.json()
        alert(error.error || "Errore durante l'importazione del file JSON")
      }
    } catch (error) {
      console.error("Error uploading JSON:", error)
      alert("Errore durante la lettura o l'importazione del file JSON")
    } finally {
      setUploading(false)
      // Reset the file input
      event.target.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminPassword) return

    try {
      const url = editingPupo ? `/api/pupi/${editingPupo.id}` : "/api/pupi"
      const method = editingPupo ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchPupi()
        resetForm()
      } else {
        alert("Errore durante il salvataggio")
      }
    } catch (error) {
      console.error("Error saving pupo:", error)
      alert("Errore durante il salvataggio")
    }
  }

  const handleEdit = (pupo: PupoLocation) => {
    setEditingPupo(pupo)
    setFormData({
      name: pupo.name,
      description: pupo.description,
      lat: pupo.lat.toString(),
      lng: pupo.lng.toString(),
      image: pupo.image,
      artist: pupo.artist,
      theme: pupo.theme,
      address: pupo.address || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!adminPassword) return
    if (!confirm("Sei sicuro di voler eliminare questo pupo?")) return

    try {
      const response = await fetch(`/api/pupi/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword,
        },
      })

      if (response.ok) {
        fetchPupi()
      } else {
        alert("Errore durante l'eliminazione")
      }
    } catch (error) {
      console.error("Error deleting pupo:", error)
      alert("Errore durante l'eliminazione")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      lat: "",
      lng: "",
      image: "",
      artist: "",
      theme: "",
      address: "",
    })
    setEditingPupo(null)
    setShowForm(false)
    setShowMapPicker(false)
  }

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      lat: lat.toString(),
      lng: lng.toString(),
    })
  }

  const handleGeocodeAddress = async () => {
    if (!formData.address.trim()) {
      return
    }

    setGeocoding(true)
    try {
      // Using Nominatim (OpenStreetMap) API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.address
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "PupoMap-Admin/1.0 (https://github.com/riccardotornesello/pupomap)",
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Errore nella geocodifica (HTTP ${response.status})`)
      }

      const data = await response.json()

      if (data.length === 0) {
        alert(
          "Nessuna coordinata trovata per questo indirizzo. Prova con un indirizzo più specifico."
        )
        return
      }

      const { lat, lon } = data[0]
      setFormData({
        ...formData,
        lat: lat,
        lng: lon,
      })
      alert("Coordinate trovate! Verifica che siano corrette.")
    } catch (error) {
      console.error("Error geocoding address:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Errore durante la conversione dell'indirizzo in coordinate"
      alert(errorMessage)
    } finally {
      setGeocoding(false)
    }
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file || !adminPassword) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-admin-password": adminPassword,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({ ...prev, image: data.url }))
      } else {
        const error = await response.json()
        alert(error.error || "Errore durante il caricamento dell'immagine")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Errore durante il caricamento dell'immagine")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-500">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white p-2 rounded-lg">
                <MapPin size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-stone-900">
                  Admin Backoffice
                </h1>
                <p className="text-xs text-stone-500">Gestione Pupi</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Esci</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-stone-900">
            Pupi ({pupi.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            <label
              htmlFor="json-upload"
              className={`flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Upload size={18} />
              <span className="text-sm">
                {uploading ? "Importazione..." : "Importa JSON"}
              </span>
            </label>
            <input
              id="json-upload"
              type="file"
              accept=".json,application/json"
              onChange={handleJsonUpload}
              disabled={uploading}
              className="hidden"
            />
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus size={18} />
              Aggiungi Pupo
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-stone-900 mb-4">
              {editingPupo ? "Modifica Pupo" : "Nuovo Pupo"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Artista *
                  </label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) =>
                      setFormData({ ...formData, artist: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Descrizione *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Indirizzo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Es: Piazza del Popolo, Roma, Italia"
                    className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={geocoding || !formData.address.trim()}
                    className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      geocoding || !formData.address.trim()
                        ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {geocoding ? "Conversione..." : "→ Coordinate"}
                  </button>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Opzionale: inserisci l&apos;indirizzo e clicca &quot;→
                  Coordinate&quot; per convertirlo in coordinate geografiche
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-stone-700">
                    Posizione *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                  >
                    <MapPin size={16} />
                    {showMapPicker ? "Nascondi mappa" : "Scegli sulla mappa"}
                  </button>
                </div>

                {showMapPicker && (
                  <div className="mb-4">
                    <MapPicker
                      initialLat={
                        formData.lat ? parseFloat(formData.lat) : undefined
                      }
                      initialLng={
                        formData.lng ? parseFloat(formData.lng) : undefined
                      }
                      onLocationSelect={handleMapLocationSelect}
                    />
                    <p className="text-xs text-stone-500 mt-2">
                      Clicca sulla mappa per selezionare la posizione del pupo
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Latitudine *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) =>
                        setFormData({ ...formData, lat: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Longitudine *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) =>
                        setFormData({ ...formData, lng: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Tema *
                  </label>
                  <input
                    type="text"
                    value={formData.theme}
                    onChange={(e) =>
                      setFormData({ ...formData, theme: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Immagine *
                </label>
                <div className="space-y-3">
                  {/* Upload button */}
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="image-upload"
                      className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed border-stone-300 rounded-lg hover:border-red-500 transition-colors cursor-pointer ${
                        uploading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Upload size={20} className="text-stone-500" />
                      <span className="text-sm text-stone-600">
                        {uploading
                          ? "Caricamento..."
                          : "Carica immagine su Vercel Blob"}
                      </span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>

                  {/* OR separator */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-stone-300"></div>
                    <span className="text-xs text-stone-500">oppure</span>
                    <div className="flex-1 h-px bg-stone-300"></div>
                  </div>

                  {/* URL input */}
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    placeholder="Inserisci URL immagine"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    required
                  />

                  {/* Preview */}
                  {formData.image && (
                    <div className="mt-3">
                      <img
                        src={formData.image}
                        alt="Anteprima"
                        className="w-32 h-32 object-cover rounded-lg border border-stone-300"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {editingPupo ? "Salva Modifiche" : "Crea Pupo"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-stone-200 text-stone-700 px-6 py-2 rounded-lg hover:bg-stone-300 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider hidden md:table-cell">
                    Artista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider hidden lg:table-cell">
                    Tema
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider hidden lg:table-cell">
                    Posizione
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {pupi.map((pupo) => (
                  <tr key={pupo.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={pupo.image}
                          alt={pupo.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium text-stone-900">
                            {pupo.name}
                          </div>
                          <div className="text-sm text-stone-500 md:hidden">
                            {pupo.artist}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500 hidden md:table-cell">
                      {pupo.artist}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500 hidden lg:table-cell">
                      {pupo.theme}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500 hidden lg:table-cell">
                      {pupo.lat.toFixed(4)}, {pupo.lng.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(pupo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(pupo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
