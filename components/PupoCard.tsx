"use client"

import React from "react"
import { X, MapPin, Palette, Info, Heart } from "lucide-react"
import { PupoLocation, User } from "../types"

interface PupoCardProps {
  pupo: PupoLocation
  votes: number
  hasVoted: boolean
  currentUser: User | null
  onVote: (id: number) => void
  onLogin: () => void
  onClose: () => void
  onViewOnMap?: () => void
  inline?: boolean
}

interface VoteButtonProps {
  votes: number
  hasVoted: boolean
  onVoteClick: (e: React.MouseEvent) => void
}

const VoteButton: React.FC<VoteButtonProps> = ({
  votes,
  hasVoted,
  onVoteClick,
}) => {
  return (
    <button
      onClick={onVoteClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
        hasVoted
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-white text-stone-500 border border-stone-200 hover:border-red-300 hover:text-red-500"
      }`}
    >
      <Heart className={`w-4 h-4 ${hasVoted ? "fill-red-600" : ""}`} />
      <span>{votes}</span>
    </button>
  )
}

export const PupoCard: React.FC<PupoCardProps> = ({
  pupo,
  votes,
  hasVoted,
  currentUser,
  onVote,
  onLogin,
  onClose,
  onViewOnMap,
  inline = false,
}) => {
  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUser) {
      onLogin()
    } else {
      onVote(pupo.id)
    }
  }

  if (inline) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-48 overflow-hidden relative group">
          <img
            src={pupo.image}
            alt={pupo.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-red-600 shadow-sm z-10">
            {pupo.theme}
          </div>
          <div className="absolute top-2 left-2 z-10">
            <VoteButton
              votes={votes}
              hasVoted={hasVoted}
              onVoteClick={handleVoteClick}
            />
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-lg text-stone-800">{pupo.name}</h3>
          </div>
          <p className="text-stone-500 text-sm mb-3 flex items-center gap-1">
            <Palette className="w-3 h-3" /> {pupo.artist}
          </p>
          <p className="text-stone-600 text-sm line-clamp-2 mb-4">
            {pupo.description}
          </p>
          <button
            onClick={onViewOnMap}
            className="w-full bg-stone-100 text-stone-700 hover:bg-stone-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" /> Vedi sulla Mappa
          </button>
        </div>
      </div>
    )
  }

  // Modal version
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 shrink-0 bg-stone-200">
          <img
            src={pupo.image}
            alt={pupo.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all z-20"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-4 z-20">
            <VoteButton
              votes={votes}
              hasVoted={hasVoted}
              onVoteClick={handleVoteClick}
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              {pupo.theme}
            </span>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            {pupo.name}
          </h2>

          <div className="flex items-center gap-2 text-stone-500 mb-6 text-sm">
            <span className="flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-md">
              <Palette className="w-3 h-3" /> {pupo.artist}
            </span>
          </div>

          <div className="prose prose-stone text-sm sm:text-base">
            <p className="leading-relaxed">{pupo.description}</p>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100 flex gap-3">
            <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              Tradizione: Questo pupo verrà acceso alla mezzanotte del 31
              Dicembre.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-stone-100 flex gap-3 bg-stone-50">
          <button
            onClick={onViewOnMap}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" /> Trova sulla Mappa
          </button>
        </div>
      </div>
    </div>
  )
}
