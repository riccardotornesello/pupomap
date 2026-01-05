"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PupoLocation } from "@/types"
import { Plus, Pencil, Trash2, LogOut, MapPin } from "lucide-react"

export default function AdminDashboard() {
  const [pupi, setPupi] = useState<PupoLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [adminPassword, setAdminPassword] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPupo, setEditingPupo] = useState<PupoLocation | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lat: "",
    lng: "",
    imageUrl: "",
    artist: "",
    theme: "",
  })
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const password = localStorage.getItem("adminPassword")
    if (!password) {
      router.push("/admin/login")
      return
    }
    setAdminPassword(password)
    fetchPupi()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminPassword) return

    try {
      const url = editingPupo
        ? `/api/pupi/${editingPupo.id}`
        : "/api/pupi"
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
      imageUrl: pupo.imageUrl,
      artist: pupo.artist,
      theme: pupo.theme,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
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
      imageUrl: "",
      artist: "",
      theme: "",
    })
    setEditingPupo(null)
    setShowForm(false)
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
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-stone-900">
            Pupi ({pupi.length})
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={18} />
            Aggiungi Pupo
          </button>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  URL Immagine *
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  required
                />
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
                          src={pupo.imageUrl}
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
