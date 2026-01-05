"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Map, List, Navigation, LogIn, User as UserIcon } from "lucide-react"
import { PupoCard } from "../components/PupoCard"
import { PUPI_DATA, INITIAL_VOTES } from "../constants"
import { PupoLocation, ViewMode, User } from "../types"

const PupoMap = dynamic(() => import("../components/PupoMap"), {
  loading: () => <p>Caricamento mappa...</p>,
  ssr: false,
})

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.MAP)
  const [selectedPupo, setSelectedPupo] = useState<PupoLocation | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  )

  // Auth & Voting State
  const [user, setUser] = useState<User | null>(null)
  const [votes, setVotes] = useState<Record<string, number>>(INITIAL_VOTES)
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Attempt to get user location on load for map centering/marker
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => console.log("Geolocation not enabled or error:", error),
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const handleLogin = () => {
    // Simulated Google Login
    const mockUser: User = {
      id: "g_12345",
      name: "Utente Google",
      avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    }
    setUser(mockUser)
    alert("Accesso effettuato con successo!")
  }

  const handleVote = (pupoId: string) => {
    if (!user) {
      handleLogin()
      return
    }

    setVotes((prev) => {
      const isVoted = userVotes.has(pupoId)
      return {
        ...prev,
        [pupoId]: isVoted ? prev[pupoId] - 1 : (prev[pupoId] || 0) + 1,
      }
    })

    setUserVotes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(pupoId)) {
        newSet.delete(pupoId)
      } else {
        newSet.add(pupoId)
      }
      return newSet
    })
  }

  const handleSelectPupo = (pupo: PupoLocation) => {
    setSelectedPupo(pupo)
  }

  const handleViewOnMapFromCard = () => {
    setSelectedPupo(null) // Close modal
    setViewMode(ViewMode.MAP)
    // Hack: Wait a tick for view mode to switch then re-select to center map
    setTimeout(() => setSelectedPupo(selectedPupo), 100)
  }

  // Sort Pupi for list view based on votes
  const sortedPupi = [...PUPI_DATA].sort((a, b) => {
    const votesA = votes[a.id] || 0
    const votesB = votes[b.id] || 0
    return votesB - votesA
  })

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-50 overflow-hidden relative font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 text-white p-2 rounded-lg">
            <Navigation size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900 leading-tight">
              Pupi di Gallipoli
            </h1>
            <p className="text-xs text-stone-500">Mappa Ufficiale Capodanno</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex bg-stone-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode(ViewMode.MAP)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.MAP ? "bg-white shadow text-red-600" : "text-stone-500 hover:text-stone-700"}`}
          >
            Mappa
          </button>
          <button
            onClick={() => setViewMode(ViewMode.LIST)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.LIST ? "bg-white shadow text-red-600" : "text-stone-500 hover:text-stone-700"}`}
          >
            Lista Voti
          </button>
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200">
              <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <UserIcon size={14} />
              </div>
              <span className="text-sm font-medium text-stone-700 hidden sm:inline">
                {user.name}
              </span>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-black transition-colors text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Accedi con Google</span>
              <span className="sm:hidden">Accedi</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Map View */}
        <div
          className={`absolute inset-0 w-full h-full ${viewMode === ViewMode.MAP ? "block z-10" : "hidden z-0"}`}
        >
          <PupoMap
            locations={PUPI_DATA}
            onSelectLocation={handleSelectPupo}
            selectedLocationId={selectedPupo?.id}
            userLocation={userLocation}
          />
        </div>

        {/* List View */}
        <div
          className={`absolute inset-0 bg-stone-50 overflow-y-auto p-4 sm:p-6 transition-opacity duration-300 ${viewMode === ViewMode.LIST ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
        >
          <div className="max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-stone-800">
                  Classifica Pupi 🏆
                </h2>
                <p className="text-stone-500 text-sm">
                  Vota il tuo preferito per il Capodanno!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPupi.map((pupo) => (
                <PupoCard
                  key={pupo.id}
                  pupo={pupo}
                  votes={votes[pupo.id] || 0}
                  hasVoted={userVotes.has(pupo.id)}
                  currentUser={user}
                  onVote={handleVote}
                  onLogin={handleLogin}
                  onClose={() => {}}
                  inline={true}
                  onViewOnMap={() => {
                    setSelectedPupo(pupo)
                    setViewMode(ViewMode.MAP)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Detail View */}
      {selectedPupo && viewMode === ViewMode.MAP && (
        <PupoCard
          pupo={selectedPupo}
          votes={votes[selectedPupo.id] || 0}
          hasVoted={userVotes.has(selectedPupo.id)}
          currentUser={user}
          onVote={handleVote}
          onLogin={handleLogin}
          onClose={() => setSelectedPupo(null)}
          onViewOnMap={handleViewOnMapFromCard}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden h-16 bg-white border-t border-stone-200 flex items-center justify-around z-20 shrink-0">
        <button
          onClick={() => setViewMode(ViewMode.MAP)}
          className={`flex flex-col items-center gap-1 ${viewMode === ViewMode.MAP ? "text-red-600" : "text-stone-400"}`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-medium">Mappa</span>
        </button>
        <button
          onClick={() => setViewMode(ViewMode.LIST)}
          className={`flex flex-col items-center gap-1 ${viewMode === ViewMode.LIST ? "text-red-600" : "text-stone-400"}`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] font-medium">Classifica</span>
        </button>
      </div>
    </div>
  )
}
