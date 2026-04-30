"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Radio,
  Loader2,
} from "lucide-react"
import { fetchAuthSession } from "aws-amplify/auth"
import { configureAmplify } from "@/lib/amplify"
import outputs from "@/amplify_outputs.json"
import { getValuableRoomId } from "@/lib/call-room"
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
  type MeetingSession,
} from "amazon-chime-sdk-js"

configureAmplify()

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

type MeetingResponse = {
  MeetingId: string
  MediaPlacement?: Record<string, string>
}

type AttendeeResponse = {
  AttendeeId: string
  JoinToken: string
  ExternalUserId?: string
}

type ValuableRecord = {
  id: string
  ownerId: string
  name?: string | null
  category?: string | null
}

type UserRecord = {
  cognitoId: string
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

type AccessRecord = {
  valuableId: string
  canReceiveCalls?: boolean | null
}

type AccessibleCallTarget = {
  valuableId: string
  label: string
  ownerLabel: string
  relation: "own" | "shared"
}

const valuablesByOwnerQuery = /* GraphQL */ `
  query ValuablesByOwnerForCalls($ownerId: ID!, $limit: Int) {
    ValuablesByOwner(ownerId: $ownerId, limit: $limit) {
      items {
        id
        ownerId
        name
        category
      }
    }
  }
`

const valuableAccessByGranteeQuery = /* GraphQL */ `
  query ValuableAccessByGranteeForCalls($granteeUserId: ID!, $limit: Int) {
    ValuableAccessByGrantee(granteeUserId: $granteeUserId, limit: $limit) {
      items {
        valuableId
        canReceiveCalls
      }
    }
  }
`

const getValuableQuery = /* GraphQL */ `
  query GetValuableForCalls($id: ID!) {
    getValuable(id: $id) {
      id
      ownerId
      name
      category
    }
  }
`

const getUserQuery = /* GraphQL */ `
  query GetUserForCalls($cognitoId: ID!) {
    getUser(cognitoId: $cognitoId) {
      cognitoId
      displayName
      firstName
      lastName
      email
    }
  }
`

function getUserLabel(user?: UserRecord | null) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  return user?.displayName || fullName || user?.email || user?.cognitoId || "Owner"
}

function RelationBadge({ target }: { target: AccessibleCallTarget }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-right text-xs text-muted-foreground">
      <p className="font-medium text-foreground">{target.relation === "shared" ? "Shared access" : "Primary owner"}</p>
      <p>{target.relation === "shared" ? `Shared by ${target.ownerLabel}` : "Receiving calls for your own item"}</p>
    </div>
  )
}

async function runAuthenticatedGraphQL<T>(accessToken: string, query: string, variables: Record<string, unknown>) {
  const response = await fetch(outputs.data.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = (await response.json()) as GraphQLResponse<T>
  if (!response.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message || "GraphQL request failed")
  }
  if (!json.data) {
    throw new Error("GraphQL response did not include data")
  }
  return json.data
}

export default function CallsPage() {
  const [selectedValuableId, setSelectedValuableId] = useState("")
  const [status, setStatus] = useState("Ready")
  const [error, setError] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [attendeeCount, setAttendeeCount] = useState(1)
  const [userId, setUserId] = useState("")
  const [targets, setTargets] = useState<AccessibleCallTarget[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const sessionRef = useRef<MeetingSession | null>(null)
  const accessTokenRef = useRef("")

  const pushLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const entry = `${timestamp} - ${message}`
    console.log("[calls]", entry)
    setLogs((current) => [entry, ...current].slice(0, 40))
  }

  const selectedTarget = useMemo(
    () => targets.find((target) => target.valuableId === selectedValuableId) || null,
    [selectedValuableId, targets],
  )

  const effectiveRoomId = useMemo(() => getValuableRoomId(selectedValuableId), [selectedValuableId])

  const handlePresenceChange = (_attendeeId: string, present: boolean) => {
    setAttendeeCount((current) => {
      if (present) return current + 1
      return Math.max(1, current - 1)
    })
  }

  const teardownSession = () => {
    const current = sessionRef.current
    if (!current) return
    current.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(handlePresenceChange)
    current.audioVideo.stopLocalVideoTile()
    current.audioVideo.stop()
    void current.audioVideo.stopAudioInput()
    sessionRef.current = null
  }

  useEffect(() => {
    pushLog("Calls page mounted")
    let active = true

    const loadIdentity = async () => {
      try {
        const session = await fetchAuthSession()
        const payload = session.tokens?.idToken?.payload
        const sub = payload?.sub as string | undefined
        accessTokenRef.current = session.tokens?.accessToken?.toString() ?? ""
        if (!sub || !accessTokenRef.current) {
          throw new Error("Missing user session")
        }

        if (active) {
          setUserId(sub)
          pushLog(`Loaded user identity ${sub.slice(0, 8)}...`)
        }

        const [ownValuablesData, accessData] = await Promise.all([
          runAuthenticatedGraphQL<{ ValuablesByOwner: { items: ValuableRecord[] } }>(
            accessTokenRef.current,
            valuablesByOwnerQuery,
            { ownerId: sub, limit: 200 },
          ),
          runAuthenticatedGraphQL<{ ValuableAccessByGrantee: { items: AccessRecord[] } }>(
            accessTokenRef.current,
            valuableAccessByGranteeQuery,
            { granteeUserId: sub, limit: 200 },
          ),
        ])

        const ownTargets: AccessibleCallTarget[] = (ownValuablesData.ValuablesByOwner.items || []).map((valuable) => ({
          valuableId: valuable.id,
          label: valuable.name || valuable.category || valuable.id,
          ownerLabel: "You",
          relation: "own",
        }))

        const sharedAccesses = (accessData.ValuableAccessByGrantee.items || []).filter(
          (entry) => entry.canReceiveCalls && entry.valuableId,
        )
        const sharedTargets = await Promise.all(
          Array.from(new Set(sharedAccesses.map((entry) => entry.valuableId))).map(async (valuableId) => {
            const valuableData = await runAuthenticatedGraphQL<{ getValuable: ValuableRecord | null }>(
              accessTokenRef.current,
              getValuableQuery,
              { id: valuableId },
            )
            const valuable = valuableData.getValuable
            if (!valuable) return null

            const ownerData = await runAuthenticatedGraphQL<{ getUser: UserRecord | null }>(
              accessTokenRef.current,
              getUserQuery,
              { cognitoId: valuable.ownerId },
            )

            return {
              valuableId: valuable.id,
              label: valuable.name || valuable.category || valuable.id,
              ownerLabel: getUserLabel(ownerData.getUser),
              relation: "shared" as const,
            }
          }),
        )

        if (active) {
          const nextTargets = [...ownTargets, ...((sharedTargets.filter(Boolean) as AccessibleCallTarget[]))]
          setTargets(nextTargets)
          setSelectedValuableId((current) => current || nextTargets[0]?.valuableId || "")
          pushLog(`Loaded ${nextTargets.length} call target(s)`)
        }
      } catch (error: any) {
        pushLog(error?.message || "Could not load call access")
      }
    }

    void loadIdentity()
    return () => {
      active = false
      teardownSession()
    }
  }, [])

  const joinRoom = async () => {
    if (!selectedValuableId || !effectiveRoomId) {
      setError("Select an item first")
      return
    }

    setIsBusy(true)
    setError("")
    setStatus("Preparing call...")
    pushLog(`Starting join flow for item ${selectedValuableId}`)

    try {
      if (!accessTokenRef.current) {
        const session = await fetchAuthSession()
        accessTokenRef.current = session.tokens?.accessToken?.toString() ?? ""
      }
      if (!accessTokenRef.current) {
        throw new Error("Missing access token")
      }

      pushLog("Calling /api/calls/join")
      const response = await fetch("/api/calls/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
        body: JSON.stringify({
          roomId: effectiveRoomId,
          userId: userId || `owner-${crypto.randomUUID().slice(0, 8)}`,
        }),
      })

      const raw = await response.json()
      pushLog(`/api/calls/join responded with status ${response.status}`)
      if (!response.ok) {
        pushLog(`API error payload: ${JSON.stringify(raw)}`)
        throw new Error(raw?.details?.[0]?.message || raw?.error || "Join API failed")
      }

      pushLog("/api/calls/join completed")
      const meeting = raw?.meeting ? (JSON.parse(raw.meeting) as MeetingResponse) : null
      const attendee = raw?.attendee ? (JSON.parse(raw.attendee) as AttendeeResponse) : null

      if (!meeting || !attendee) {
        pushLog(`Join payload missing data: ${JSON.stringify(raw)}`)
        throw new Error("Meeting join response was incomplete")
      }

      pushLog(`Received meeting ${meeting.MeetingId}`)
      pushLog(`Received attendee ${attendee.AttendeeId}`)

      const logger = new ConsoleLogger("ifound-chime", LogLevel.ERROR)
      const deviceController = new DefaultDeviceController(logger)
      const configuration = new MeetingSessionConfiguration(meeting, attendee)
      const session = new DefaultMeetingSession(configuration, logger, deviceController)

      sessionRef.current = session
      setAttendeeCount(1)
      pushLog("Chime meeting session created")

      const audioInputs = await session.audioVideo.listAudioInputDevices()
      pushLog(`Audio devices found: ${audioInputs.length}`)
      if (!audioInputs.length) {
        throw new Error("No microphone detected")
      }

      await session.audioVideo.startAudioInput(audioInputs[0].deviceId)
      pushLog("Microphone selected")

      if (!audioElementRef.current) {
        throw new Error("Audio output element not ready")
      }
      session.audioVideo.bindAudioElement(audioElementRef.current)
      pushLog("Audio element bound")

      session.audioVideo.realtimeSubscribeToAttendeeIdPresence(handlePresenceChange)
      session.audioVideo.start()
      pushLog("Audio session started")

      setIsJoined(true)
      setIsMuted(false)
      setStatus("Connected")
      pushLog("Call connected")
    } catch (err: any) {
      teardownSession()
      setIsJoined(false)
      setIsMuted(false)
      setStatus("Call failed")
      const details = err?.errors?.[0]?.message || err?.message || "Unable to join Chime meeting"
      setError(details)
      pushLog(`Join failed: ${details}`)
    } finally {
      setIsBusy(false)
    }
  }

  const leaveRoom = () => {
    teardownSession()
    setIsJoined(false)
    setIsMuted(false)
    setAttendeeCount(1)
    setStatus("Left call")
  }

  const toggleMute = () => {
    const current = sessionRef.current
    if (!current) return
    if (isMuted) {
      current.audioVideo.realtimeUnmuteLocalAudio()
      setIsMuted(false)
      return
    }
    current.audioVideo.realtimeMuteLocalAudio()
    setIsMuted(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Calls
          </h1>
          <p className="text-muted-foreground">
            Join live calls for your own items or items another owner explicitly shared with you.
          </p>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Item / Call Access</Label>
              <Select value={selectedValuableId} onValueChange={setSelectedValuableId}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-secondary/50">
                  <SelectValue placeholder="Select an item you can receive calls for" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {targets.map((target) => (
                    <SelectItem key={target.valuableId} value={target.valuableId}>
                      {target.label} {target.relation === "shared" ? `- shared by ${target.ownerLabel}` : "- your item"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Finder calls are item-specific. Only your own items and explicitly shared items appear here.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-secondary/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Call status</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{status}</p>
                  {selectedTarget ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Radio className="h-4 w-4 text-primary" />
                      Item: <span className="text-foreground">{selectedTarget.label}</span>
                    </div>
                  ) : null}
                </div>
                {selectedTarget ? <RelationBadge target={selectedTarget} /> : null}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap gap-3">
              {!isJoined ? (
                <Button
                  className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                  onClick={joinRoom}
                  disabled={isBusy || !selectedValuableId}
                >
                  {isBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PhoneCall className="mr-2 h-4 w-4" />
                  )}
                  Join Call
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl border-border/50"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <MicOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Mic className="mr-2 h-4 w-4" />
                    )}
                    {isMuted ? "Unmute" : "Mute"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={leaveRoom}
                  >
                    <PhoneOff className="mr-2 h-4 w-4" />
                    Leave Call
                  </Button>
                </>
              )}
            </div>

            <audio ref={audioElementRef} autoPlay playsInline />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm"
        >
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Session
          </h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-secondary/20 p-4">
              <p className="text-sm text-muted-foreground">Signed-in user</p>
              <p className="mt-1 break-all font-mono text-sm text-foreground">
                {userId || "Loading..."}
              </p>
            </div>
            <div className="rounded-xl bg-secondary/20 p-4">
              <p className="text-sm text-muted-foreground">Receiving for</p>
              <p className="mt-1 text-foreground">
                {selectedTarget ? `${selectedTarget.label} (${selectedTarget.relation === "shared" ? `shared by ${selectedTarget.ownerLabel}` : "your item"})` : "No accessible item selected"}
              </p>
            </div>
            <div className="rounded-xl bg-secondary/20 p-4">
              <p className="text-sm text-muted-foreground">Participants detected</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{attendeeCount}</p>
            </div>
            <div className="rounded-xl bg-secondary/20 p-4">
              <p className="text-sm text-muted-foreground">Microphone</p>
              <p className="mt-1 text-foreground">
                {isJoined ? (isMuted ? "Muted" : "Live") : "Not joined"}
              </p>
            </div>
            <div className="rounded-xl bg-secondary/20 p-4 text-sm text-muted-foreground">
              This page is audio-only. Finder calls for the selected item land in this room. Shared users can join only items they were granted call access for.
            </div>
            <div className="rounded-xl bg-secondary/20 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Frontend logs</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={() => setLogs([])}
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                {logs.length === 0 ? (
                  <p>No logs yet.</p>
                ) : (
                  logs.map((entry, index) => (
                    <p key={`${index}-${entry}`} className="break-words font-mono">
                      {entry}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

