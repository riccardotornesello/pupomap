import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getVoteCounts, getUserVotes, addVote, removeVote } from "@/lib/db"

// GET /api/votes - Get all votes and user's votes if authenticated
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const voteCounts = await getVoteCounts()

    let userVotes: number[] = []
    if (session?.user?.id) {
      userVotes = await getUserVotes(session.user.id)
    }

    return NextResponse.json({
      voteCounts,
      userVotes,
    })
  } catch (error) {
    console.error("Error fetching votes:", error)
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    )
  }
}

// POST /api/votes - Toggle vote for a pupo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { pupoId } = body

    if (pupoId == null || typeof pupoId !== "number") {
      return NextResponse.json(
        { error: "Invalid pupoId" },
        { status: 400 }
      )
    }

    // Get user's current votes to determine if we should add or remove
    const userVotes = await getUserVotes(session.user.id)
    const hasVoted = userVotes.includes(pupoId)

    if (hasVoted) {
      await removeVote(session.user.id, pupoId)
    } else {
      await addVote(session.user.id, pupoId)
    }

    // Return updated vote counts and user votes
    const voteCounts = await getVoteCounts()
    const updatedUserVotes = await getUserVotes(session.user.id)

    return NextResponse.json({
      voteCounts,
      userVotes: updatedUserVotes,
      action: hasVoted ? "removed" : "added",
    })
  } catch (error) {
    console.error("Error toggling vote:", error)
    return NextResponse.json(
      { error: "Failed to toggle vote" },
      { status: 500 }
    )
  }
}
