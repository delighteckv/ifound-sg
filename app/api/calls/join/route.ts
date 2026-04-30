import { NextRequest, NextResponse } from "next/server"
import outputs from "@/amplify_outputs.json"
import { parseValuableIdFromRoomId } from "@/lib/call-room"

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

const getValuableQuery = /* GraphQL */ `
  query GetValuableForCall($id: ID!) {
    getValuable(id: $id) {
      id
      ownerId
    }
  }
`

const valuableAccessByGranteeQuery = /* GraphQL */ `
  query ValuableAccessByGranteeForCall($granteeUserId: ID!, $limit: Int) {
    ValuableAccessByGrantee(granteeUserId: $granteeUserId, limit: $limit) {
      items {
        valuableId
        canReceiveCalls
      }
    }
  }
`

function decodeJwtPayload(token: string) {
  try {
    const [, payload] = token.split(".")
    if (!payload) return null
    const json = Buffer.from(payload, "base64url").toString("utf8")
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

async function runGraphQLWithHeaders(
  query: string,
  variables: Record<string, unknown>,
  headers: Record<string, string>,
) {
  const response = await fetch(outputs.data.url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json()
  if (!response.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message || "GraphQL request failed")
  }

  return json.data
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || ""

  const body = await req.json().catch(() => null)
  const roomId = body?.roomId
  const userId = body?.userId

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 })
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (auth.startsWith("Bearer ")) {
    headers.Authorization = auth
  } else {
    headers["x-api-key"] = outputs.data.api_key
  }

  if (auth.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim()
    const payload = decodeJwtPayload(token)
    const callerSub = typeof payload?.sub === "string" ? payload.sub : ""
    const valuableId = parseValuableIdFromRoomId(roomId)

    if (!callerSub) {
      return NextResponse.json({ error: "invalid_auth" }, { status: 401 })
    }

    if (valuableId) {
      try {
        const [valuableData, accessData] = await Promise.all([
          runGraphQLWithHeaders(getValuableQuery, { id: valuableId }, headers),
          runGraphQLWithHeaders(valuableAccessByGranteeQuery, { granteeUserId: callerSub, limit: 200 }, headers),
        ])

        const valuable = valuableData?.getValuable as { id?: string; ownerId?: string } | null | undefined
        const accessItems = (accessData?.ValuableAccessByGrantee?.items || []) as {
          valuableId?: string | null
          canReceiveCalls?: boolean | null
        }[]

        const hasDelegatedCallAccess = accessItems.some(
          (entry) => entry.valuableId === valuableId && entry.canReceiveCalls,
        )

        if (valuable?.ownerId !== callerSub && !hasDelegatedCallAccess) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 })
        }
      } catch (error: any) {
        return NextResponse.json({ error: error?.message || "call_access_check_failed" }, { status: 400 })
      }
    }
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
