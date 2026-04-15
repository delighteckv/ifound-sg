"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Radio,
  RefreshCw,
  Copy,
  Loader2,
} from "lucide-react"
import { fetchAuthSession } from "aws-amplify/auth"
import { configureAmplify } from "@/lib/amplify"
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
  type MeetingSession,
} from "amazon-chime-sdk-js"

configureAmplify()

type MeetingResponse = {
  MeetingId: string
  MediaPlacement?: Record<string, string>
}

type AttendeeResponse = {
  AttendeeId: string
  JoinToken: string
  ExternalUserId?: string
}

export default function CallsPage() {
  const [roomId, setRoomId] = useState("")
  const [displayRoomId, setDisplayRoomId] = useState("")
  const [status, setStatus] = useState("Ready")
  const [error, setError] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [attendeeCount, setAttendeeCount] = useState(1)
  const [ownerId, setOwnerId] = useState("")
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

  useEffect(() => {
    pushLog("Calls page mounted")
    let active = true
    const loadIdentity = async () => {
      try {
        const session = await fetchAuthSession()
        const payload = session.tokens?.idToken?.payload
        const sub = payload?.sub as string | undefined
        accessTokenRef.current = session.tokens?.accessToken?.toString() ?? ""
        if (active && sub) {
          setOwnerId(sub)
          pushLog(`Loaded owner identity ${sub.slice(0, 8)}...`)
        }
      } catch {
        pushLog("Could not load owner identity from session")
      }
    }
    loadIdentity()
    return () => {
      active = false
      teardownSession()
    }
  }, [])

  const effectiveRoomId = useMemo(
    () => displayRoomId || roomId.trim().toLowerCase(),
    [displayRoomId, roomId],
  )

  const teardownSession = () => {
    const current = sessionRef.current
    if (!current) return
    current.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(handlePresenceChange)
    current.audioVideo.stopLocalVideoTile()
    current.audioVideo.stop()
    void current.audioVideo.stopAudioInput()
    sessionRef.current = null
  }

  const handlePresenceChange = (_attendeeId: string, present: boolean) => {
    setAttendeeCount((current) => {
      if (present) return current + 1
      return Math.max(1, current - 1)
    })
  }

  const ensureRoomId = () => {
    const normalized = roomId.trim().toLowerCase()
    if (normalized) return normalized
    const generated = ownerId ? `owner-${ownerId.slice(0, 8)}` : `room-${crypto.randomUUID().slice(0, 8)}`
    setRoomId(generated)
    return generated
  }

  const joinRoom = async () => {
    const targetRoomId = ensureRoomId()
    setIsBusy(true)
    setError("")
    setStatus("Preparing call…")
    pushLog(`Starting join flow for room ${targetRoomId}`)

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
          roomId: targetRoomId,
          userId: ownerId || `owner-${crypto.randomUUID().slice(0, 8)}`,
        }),
      })

      const raw = await response.json()
      pushLog(`/api/calls/join responded with status ${response.status}`)
      if (!response.ok) {
        pushLog(`API error payload: ${JSON.stringify(raw)}`)
        throw new Error(raw?.details?.[0]?.message || raw?.error || "Join API failed")
      }

      pushLog("/api/calls/join completed")
      const payload = raw
      const meeting = payload?.meeting ? (JSON.parse(payload.meeting) as MeetingResponse) : null
      const attendee = payload?.attendee ? (JSON.parse(payload.attendee) as AttendeeResponse) : null

      if (!meeting || !attendee) {
        pushLog(`Join payload missing data: ${JSON.stringify(payload)}`)
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

      setDisplayRoomId(targetRoomId)
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

  const copyRoomId = async () => {
    if (!effectiveRoomId) return
    await navigator.clipboard.writeText(effectiveRoomId)
    setStatus("Room ID copied")
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Calls
          </h1>
          <p className="text-muted-foreground">
            Start an owner call in the browser using Amazon Chime SDK.
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
              <Label htmlFor="room-id">Room ID</Label>
              <div className="flex gap-3">
                <Input
                  id="room-id"
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  placeholder="owner-vishnu or auto-generate on join"
                  className="h-11 rounded-xl border-border/50 bg-secondary/50"
                />
                <Button
                  variant="outline"
                  className="rounded-xl border-border/50"
                  onClick={() => setRoomId(`room-${crypto.randomUUID().slice(0, 8)}`)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use the same room ID on both sides of the call.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-secondary/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Call status</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{status}</p>
                  {effectiveRoomId && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Radio className="h-4 w-4 text-primary" />
                      Room: <span className="font-mono text-foreground">{effectiveRoomId}</span>
                    </div>
                  )}
                </div>
                {effectiveRoomId && (
                  <Button
                    variant="outline"
                    className="rounded-xl border-border/50"
                    onClick={copyRoomId}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy ID
                  </Button>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap gap-3">
              {!isJoined ? (
                <Button
                  className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                  onClick={joinRoom}
                  disabled={isBusy}
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
              <p className="text-sm text-muted-foreground">Signed-in owner</p>
              <p className="mt-1 break-all font-mono text-sm text-foreground">
                {ownerId || "Loading..."}
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
              This page is audio-only. Use the same room ID on the other participant device to join the call.
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
