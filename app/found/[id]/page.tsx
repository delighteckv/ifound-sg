"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { getUrl } from "aws-amplify/storage"
import {
  Phone,
  MessageSquare,
  MapPin,
  Send,
  CheckCircle,
  QrCode,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Camera,
  Volume2,
  Loader2,
} from "lucide-react"
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
  type MeetingSession,
} from "amazon-chime-sdk-js"
import outputs from "@/amplify_outputs.json"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import Link from "next/link"

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

type QrCodeRecord = {
  code: string
  ownerId?: string | null
  valuableId?: string | null
  status?: string | null
  label?: string | null
  createdAt?: string | null
}

type ValuableRecord = {
  id: string
  ownerId: string
  name: string
  serialNumber?: string | null
  description?: string | null
  category?: string | null
  status?: string | null
  images?: (string | null)[] | null
}

type UserRecord = {
  cognitoId: string
  firstName?: string | null
  lastName?: string | null
  displayName?: string | null
  email?: string | null
  phone?: string | null
  primaryContact?: string | null
}

type FoundPageData = {
  qrCode: QrCodeRecord
  valuable: ValuableRecord | null
  owner: UserRecord | null
}

type MeetingResponse = {
  MeetingId: string
  MediaPlacement?: Record<string, string>
}

type AttendeeResponse = {
  AttendeeId: string
  JoinToken: string
}

type CallState = "idle" | "connecting" | "connected" | "ended"

const getQrCodeQuery = /* GraphQL */ `
  query GetQrCode($code: String!) {
    getQrCode(code: $code) {
      code
      ownerId
      valuableId
      status
      label
      createdAt
    }
  }
`

const getValuableQuery = /* GraphQL */ `
  query GetValuable($id: ID!) {
    getValuable(id: $id) {
      id
      ownerId
      name
      serialNumber
      description
      category
      status
      images
    }
  }
`

const getUserQuery = /* GraphQL */ `
  query GetUser($cognitoId: ID!) {
    getUser(cognitoId: $cognitoId) {
      cognitoId
      firstName
      lastName
      displayName
      email
      phone
      primaryContact
    }
  }
`

const createMessageMutation = /* GraphQL */ `
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input) {
      id
    }
  }
`

const createScanEventMutation = /* GraphQL */ `
  mutation CreateScanEvent($input: CreateScanEventInput!) {
    createScanEvent(input: $input) {
      id
    }
  }
`

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": outputs.data.api_key,
  }
}

async function runPublicGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(outputs.data.url, {
    method: "POST",
    headers: buildHeaders(),
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

function getOwnerName(owner: UserRecord | null) {
  const fullName = [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim()
  return owner?.displayName || fullName || owner?.email || owner?.phone || "the owner"
}

function getOwnerInitials(ownerName: string) {
  return ownerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "O"
}

function getOwnerRoomId(ownerId?: string | null) {
  return ownerId ? `owner-${ownerId.slice(0, 8).toLowerCase()}` : ""
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function FoundItemPage() {
  const params = useParams<{ id: string }>()
  const qrCodeId = decodeURIComponent(params.id)

  const [item, setItem] = useState<FoundPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [itemImageUrl, setItemImageUrl] = useState("")
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [message, setMessage] = useState("")
  const [finderContact, setFinderContact] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [callError, setCallError] = useState("")
  const [callState, setCallState] = useState<CallState>("idle")
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState("Ready")
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const sessionRef = useRef<MeetingSession | null>(null)
  const localVideoStreamRef = useRef<MediaStream | null>(null)
  const hasRecordedInitialScanRef = useRef(false)

  const ownerName = useMemo(() => getOwnerName(item?.owner ?? null), [item?.owner])
  const ownerAvatar = useMemo(() => getOwnerInitials(ownerName), [ownerName])

  useEffect(() => {
    let active = true

    const loadFoundItem = async () => {
      try {
        setIsLoading(true)
        setLoadError("")

        const qrResponse = await runPublicGraphQL<{ getQrCode: QrCodeRecord | null }>(
          getQrCodeQuery,
          { code: qrCodeId },
        )
        const qrCode = qrResponse.getQrCode
        if (!qrCode) {
          throw new Error("QR code was not found")
        }

        const [valuableResponse, ownerResponse] = await Promise.all([
          qrCode.valuableId
            ? runPublicGraphQL<{ getValuable: ValuableRecord | null }>(getValuableQuery, {
                id: qrCode.valuableId,
              })
            : Promise.resolve({ getValuable: null }),
          qrCode.ownerId
            ? runPublicGraphQL<{ getUser: UserRecord | null }>(getUserQuery, {
                cognitoId: qrCode.ownerId,
              })
            : Promise.resolve({ getUser: null }),
        ])

        if (!active) return

        setItem({
          qrCode,
          valuable: valuableResponse.getValuable,
          owner: ownerResponse.getUser,
        })
      } catch (error: any) {
        if (active) {
          setLoadError(error?.message || "Unable to load this QR code")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadFoundItem()

    return () => {
      active = false
    }
  }, [qrCodeId])

  useEffect(() => {
    let active = true

    const loadImage = async () => {
      const imagePath = item?.valuable?.images?.find(Boolean)
      if (!imagePath) {
        if (active) setItemImageUrl("")
        return
      }

      try {
        const result = await getUrl({
          path: imagePath,
          options: {
            expiresIn: 3600,
          },
        })

        if (active) {
          setItemImageUrl(result.url.toString())
        }
      } catch {
        if (active) {
          setItemImageUrl("")
        }
      }
    }

    void loadImage()

    return () => {
      active = false
    }
  }, [item?.valuable?.images])

  useEffect(() => {
    if (!item || hasRecordedInitialScanRef.current) {
      return
    }

    hasRecordedInitialScanRef.current = true
    void runPublicGraphQL(createScanEventMutation, {
      input: {
        qrCodeId: item.qrCode.code,
        valuableId: item.valuable?.id,
        ownerId: item.qrCode.ownerId,
        scannedAt: new Date().toISOString(),
        channel: "UNKNOWN",
      },
    }).catch(() => {
      hasRecordedInitialScanRef.current = false
    })
  }, [item])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callState === "connected") {
      interval = setInterval(() => {
        setCallDuration((current) => current + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callState])

  useEffect(() => {
    return () => {
      teardownSession()
    }
  }, [])

  const teardownSession = () => {
    const session = sessionRef.current
    if (session) {
      session.audioVideo.stop()
      void session.audioVideo.stopAudioInput()
      sessionRef.current = null
    }

    const videoStream = localVideoStreamRef.current
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop())
      localVideoStreamRef.current = null
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
  }

  const handleSendMessage = async () => {
    if (!item?.valuable?.id || !item.qrCode.ownerId || !message.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await Promise.all([
        runPublicGraphQL(createMessageMutation, {
          input: {
            valuableId: item.valuable.id,
            ownerId: item.qrCode.ownerId,
            finderContact: finderContact.trim() || null,
            content: message.trim(),
            channel: "IN_APP",
            createdAt: new Date().toISOString(),
            status: "NEW",
          },
        }),
        runPublicGraphQL(createScanEventMutation, {
          input: {
            qrCodeId: item.qrCode.code,
            valuableId: item.valuable.id,
            ownerId: item.qrCode.ownerId,
            scannedAt: new Date().toISOString(),
            finderContact: finderContact.trim() || null,
            finderMessage: message.trim(),
            channel: "MESSAGE",
          },
        }),
      ])

      setShowMessageDialog(false)
      setShowSuccessDialog(true)
      setMessage("")
      setFinderContact("")
    } catch (error: any) {
      setLoadError(error?.message || "Unable to send message")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startCall = async (withVideo: boolean) => {
    if (!item?.qrCode.ownerId) {
      setCallError("This QR code is not linked to an owner yet")
      return
    }

    const roomId = getOwnerRoomId(item.qrCode.ownerId)
    if (!roomId) {
      setCallError("Owner room was not available")
      return
    }

    setIsVideoCall(withVideo)
    setShowCallDialog(true)
    setCallState("connecting")
    setCallStatus("Connecting to owner...")
    setCallError("")
    setCallDuration(0)

    try {
      if (withVideo) {
        const previewStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
        localVideoStreamRef.current = previewStream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = previewStream
        }
      }

      const response = await fetch("/api/calls/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          userId: `finder-${crypto.randomUUID().slice(0, 12)}`,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.details?.[0]?.message || payload?.error || "Unable to join call")
      }

      const meeting = payload?.meeting ? (JSON.parse(payload.meeting) as MeetingResponse) : null
      const attendee = payload?.attendee ? (JSON.parse(payload.attendee) as AttendeeResponse) : null
      if (!meeting || !attendee) {
        throw new Error("Meeting join response was incomplete")
      }

      const logger = new ConsoleLogger("ifound-finder-call", LogLevel.ERROR)
      const deviceController = new DefaultDeviceController(logger)
      const configuration = new MeetingSessionConfiguration(meeting, attendee)
      const session = new DefaultMeetingSession(configuration, logger, deviceController)
      sessionRef.current = session

      const audioInputs = await session.audioVideo.listAudioInputDevices()
      if (!audioInputs.length) {
        throw new Error("No microphone detected")
      }

      await session.audioVideo.startAudioInput(audioInputs[0].deviceId)

      if (!audioElementRef.current) {
        throw new Error("Audio output element not ready")
      }

      audioElementRef.current.muted = !isSpeakerOn
      session.audioVideo.bindAudioElement(audioElementRef.current)
      session.audioVideo.start()

      if (item.valuable?.id) {
        await runPublicGraphQL(createScanEventMutation, {
          input: {
            qrCodeId: item.qrCode.code,
            valuableId: item.valuable.id,
            ownerId: item.qrCode.ownerId,
            scannedAt: new Date().toISOString(),
            finderContact: finderContact.trim() || null,
            channel: "CALL",
          },
        })
      }

      setCallState("connected")
      setCallStatus("Connected")
      setIsMuted(false)
      setIsVideoEnabled(withVideo)
    } catch (error: any) {
      teardownSession()
      setCallState("ended")
      setCallStatus("Call failed")
      setCallError(error?.message || "Unable to join call")
    }
  }

  const endCall = () => {
    teardownSession()
    setCallState("ended")
    setCallStatus("Call ended")
    setTimeout(() => {
      setShowCallDialog(false)
      setCallState("idle")
      setCallDuration(0)
      setIsMuted(false)
      setIsVideoEnabled(true)
      setCallError("")
    }, 300)
  }

  const toggleMute = () => {
    const session = sessionRef.current
    if (!session) return

    if (isMuted) {
      session.audioVideo.realtimeUnmuteLocalAudio()
      setIsMuted(false)
      return
    }

    session.audioVideo.realtimeMuteLocalAudio()
    setIsMuted(true)
  }

  const toggleVideo = () => {
    if (!isVideoCall || !localVideoStreamRef.current) return

    localVideoStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoEnabled
    })
    setIsVideoEnabled((current) => !current)
  }

  const toggleSpeaker = () => {
    const next = !isSpeakerOn
    setIsSpeakerOn(next)
    if (audioElementRef.current) {
      audioElementRef.current.muted = !next
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading QR details...
        </div>
      </div>
    )
  }

  if (loadError || !item) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card/70 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <QrCode className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            QR code unavailable
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {loadError || "We could not find the owner details for this QR code."}
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/scan">Scan another code</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      <audio ref={audioElementRef} autoPlay playsInline />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-accent/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-primary/15 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 backdrop-blur-xl">
          <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-accent">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm"
              >
                <QrCode className="h-10 w-10 text-white" />
              </motion.div>
            </div>
          </div>

          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 flex justify-center -mt-4"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/20 px-4 py-2 text-sm text-accent">
                <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                This item belongs to someone
              </span>
            </motion.div>

            <div className="mb-8 text-center">
              {itemImageUrl ? (
                <div className="mb-5 overflow-hidden rounded-2xl border border-border/50 bg-secondary/30">
                  <img
                    src={itemImageUrl}
                    alt={item.valuable?.name || item.qrCode.label || "Found item"}
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : null}
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {item.valuable?.name || item.qrCode.label || "Registered item"}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {item.valuable?.category || "Lost and found item"}
              </p>
              {item.valuable?.serialNumber ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Serial Number: <span className="font-medium text-foreground">{item.valuable.serialNumber}</span>
                </p>
              ) : null}

              {item.valuable?.description ? (
                <p className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground">
                  {item.valuable.description}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => void startCall(true)}
                size="lg"
                className="h-14 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-base gap-3 hover:opacity-90"
              >
                <Video className="h-5 w-5" />
                Video Call Owner
              </Button>

              <Button
                onClick={() => void startCall(false)}
                size="lg"
                variant="outline"
                className="h-14 w-full rounded-xl border-border/50 bg-secondary/30 text-base gap-3 hover:bg-secondary/50"
              >
                <Phone className="h-5 w-5" />
                Audio Call Owner
              </Button>

              <Button
                onClick={() => setShowMessageDialog(true)}
                size="lg"
                variant="outline"
                className="h-14 w-full rounded-xl border-border/50 bg-secondary/30 text-base gap-3 hover:bg-secondary/50"
              >
                <MessageSquare className="h-5 w-5" />
                Send Message
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white">
                {ownerAvatar}
              </div>
              <span>Owned by {ownerName}</span>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Your location is not shared with the owner</span>
            </div>
          </div>

          <div className="border-t border-border/50 bg-secondary/20 px-6 py-4">
            <div className="flex items-center justify-center gap-2">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Powered by{" "}
                <Link href="/" className="text-primary hover:underline">
                  iFound
                </Link>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
              Send a message
            </DialogTitle>
            <DialogDescription>
              Let the owner know you found their item and how to reach you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Your message</label>
              <Textarea
                placeholder="Hi, I found your item at..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] rounded-xl border-border/50 bg-secondary/50 resize-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                Your contact (optional)
              </label>
              <Input
                placeholder="Phone or email"
                value={finderContact}
                onChange={(e) => setFinderContact(e.target.value)}
                className="h-12 rounded-xl border-border/50 bg-secondary/50"
              />
            </div>

            <Button
              onClick={() => void handleSendMessage()}
              disabled={!message.trim() || isSubmitting}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Message
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border/50 bg-card/95 text-center backdrop-blur-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Message sent</DialogTitle>
            <DialogDescription>
              Confirmation that your finder message was sent to the owner.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/50"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Message Sent
            </h3>
            <p className="mt-2 text-muted-foreground">
              The owner has been notified. They can respond using the contact you shared.
            </p>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCallDialog}
        onOpenChange={(open) => {
          if (!open && callState !== "ended") {
            endCall()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg p-0 rounded-2xl border-border/50 bg-card overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{isVideoCall ? "Video call with owner" : "Audio call with owner"}</DialogTitle>
            <DialogDescription>Finder to owner live call session.</DialogDescription>
          </DialogHeader>

          <div className="relative">
            {isVideoCall ? (
              <div className="relative aspect-[4/3] bg-black">
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white">
                    {ownerAvatar}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{ownerName}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {callState === "connecting" ? callStatus : callState === "connected" ? formatDuration(callDuration) : callStatus}
                  </p>
                  {callError ? <p className="mt-3 px-6 text-center text-sm text-destructive">{callError}</p> : null}
                </div>

                {callState === "connected" && isVideoEnabled ? (
                  <div className="absolute bottom-4 right-4 w-32 overflow-hidden rounded-xl border-2 border-white/20 shadow-lg aspect-[4/3]">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 px-8 py-16">
                <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-4xl font-bold text-white">
                  {ownerAvatar}
                </div>
                <h3 className="text-xl font-semibold text-foreground">{ownerName}</h3>
                <p className="mt-2 text-muted-foreground">
                  {callState === "connecting" ? callStatus : callState === "connected" ? formatDuration(callDuration) : callStatus}
                </p>
                {callError ? <p className="mt-3 text-center text-sm text-destructive">{callError}</p> : null}
              </div>
            )}

            <div className="bg-card p-6">
              {callState !== "ended" ? (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={toggleMute}
                    size="icon"
                    variant={isMuted ? "destructive" : "secondary"}
                    className="h-14 w-14 rounded-full"
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>

                  {isVideoCall ? (
                    <Button
                      onClick={toggleVideo}
                      size="icon"
                      variant={!isVideoEnabled ? "destructive" : "secondary"}
                      className="h-14 w-14 rounded-full"
                    >
                      {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                    </Button>
                  ) : null}

                  <Button
                    onClick={endCall}
                    size="icon"
                    variant="destructive"
                    className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
                  >
                    <PhoneOff className="h-7 w-7" />
                  </Button>

                  <Button
                    onClick={toggleSpeaker}
                    size="icon"
                    variant={isSpeakerOn ? "secondary" : "outline"}
                    className="h-14 w-14 rounded-full"
                  >
                    <Volume2 className="h-6 w-6" />
                  </Button>

                  {isVideoCall ? (
                    <Button size="icon" variant="secondary" className="h-14 w-14 rounded-full" disabled>
                      <Camera className="h-6 w-6" />
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="text-center">
                  <p className="mb-4 text-muted-foreground">{callError || "Call ended"}</p>
                  <Button
                    onClick={() => {
                      setShowCallDialog(false)
                      setCallState("idle")
                      setCallDuration(0)
                      setCallError("")
                    }}
                    className="h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-8 hover:opacity-90"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
