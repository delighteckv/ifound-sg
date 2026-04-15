import { NextRequest, NextResponse } from "next/server"
import outputs from "@/amplify_outputs.json"

const createMeetingMutation = /* GraphQL */ `
  mutation CreateMeeting($roomId: String) {
    chimeCreateMeeting(roomId: $roomId) {
      meeting
    }
  }
`

const joinMeetingMutation = /* GraphQL */ `
  mutation JoinMeeting($roomId: String, $userId: String) {
    chimeJoinMeeting(roomId: $roomId, userId: $userId) {
      meeting
      attendee
    }
  }
`

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || ""
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const roomId = body?.roomId
  const userId = body?.userId

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 })
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: auth,
  }

  const createRes = await fetch(outputs.data.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: createMeetingMutation,
      variables: { roomId },
    }),
  })

  const createJson = await createRes.json()
  if (createJson.errors) {
    return NextResponse.json(
      { error: "create_failed", details: createJson.errors },
      { status: 400 },
    )
  }

  const joinRes = await fetch(outputs.data.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: joinMeetingMutation,
      variables: { roomId, userId },
    }),
  })

  const joinJson = await joinRes.json()
  if (joinJson.errors) {
    return NextResponse.json(
      { error: "join_failed", details: joinJson.errors },
      { status: 400 },
    )
  }

  return NextResponse.json(joinJson.data?.chimeJoinMeeting ?? null)
}
