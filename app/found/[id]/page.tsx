"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Monitor,
  Volume2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Link from "next/link"

// Mock item data - in production this would come from API
const mockItem = {
  id: "abc123",
  name: "MacBook Pro 16\"",
  category: "Electronics",
  description: "Silver MacBook Pro with stickers on the cover",
  ownerName: "John D.",
  ownerAvatar: "J",
  reward: "$50",
  hasReward: true,
  allowsCall: true,
  allowsVideo: true,
}

type CallState = "idle" | "connecting" | "ringing" | "connected" | "ended"

export default function FoundItemPage() {
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [message, setMessage] = useState("")
  const [finderContact, setFinderContact] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Call state
  const [callState, setCallState] = useState<CallState>("idle")
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callState === "connected") {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callState])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setShowMessageDialog(false)
    setShowSuccessDialog(true)
    setMessage("")
    setFinderContact("")
  }

  const startCall = async (withVideo: boolean) => {
    setIsVideoCall(withVideo)
    setShowCallDialog(true)
    setCallState("connecting")
    
    try {
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo
      })
      
      streamRef.current = stream
      
      if (localVideoRef.current && withVideo) {
        localVideoRef.current.srcObject = stream
      }
      
      // Simulate connection delay
      setTimeout(() => {
        setCallState("ringing")
      }, 1000)
      
      // Simulate answer after ringing
      setTimeout(() => {
        setCallState("connected")
      }, 4000)
      
    } catch (error) {
      console.error("Failed to get media:", error)
      setCallState("ended")
    }
  }

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCallState("ended")
    setTimeout(() => {
      setShowCallDialog(false)
      setCallState("idle")
      setCallDuration(0)
      setIsMuted(false)
      setIsVideoEnabled(true)
    }, 2000)
  }

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted
      })
    }
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled
      })
    }
    setIsVideoEnabled(!isVideoEnabled)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      {/* Background */}
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
        {/* Main Card */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
          {/* Header Gradient */}
          <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-accent">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <QrCode className="h-10 w-10 text-white" />
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center -mt-4 mb-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 border border-accent/30 px-4 py-2 text-sm text-accent">
                <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                This item belongs to someone
              </span>
            </motion.div>

            {/* Item Info */}
            <div className="text-center mb-8">
              <h1 
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {mockItem.name}
              </h1>
              <p className="mt-1 text-muted-foreground">{mockItem.category}</p>
              
              {mockItem.description && (
                <p className="mt-4 text-sm text-muted-foreground bg-secondary/50 rounded-xl p-4">
                  {mockItem.description}
                </p>
              )}

              {/* Reward Badge */}
              {mockItem.hasReward && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 px-5 py-2"
                >
                  <span className="text-sm text-muted-foreground">Reward offered:</span>
                  <span className="font-semibold text-primary">{mockItem.reward}</span>
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Video Call Button */}
              {mockItem.allowsVideo && (
                <Button
                  onClick={() => startCall(true)}
                  size="lg"
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-base gap-3"
                >
                  <Video className="h-5 w-5" />
                  Video Call Owner
                </Button>
              )}
              
              {/* Audio Call Button */}
              {mockItem.allowsCall && (
                <Button
                  onClick={() => startCall(false)}
                  size="lg"
                  variant={mockItem.allowsVideo ? "outline" : "default"}
                  className={`w-full h-14 rounded-xl text-base gap-3 ${
                    mockItem.allowsVideo 
                      ? "border-border/50 bg-secondary/30 hover:bg-secondary/50" 
                      : "bg-gradient-to-r from-accent to-accent/80 hover:opacity-90"
                  }`}
                >
                  <Phone className="h-5 w-5" />
                  Audio Call Owner
                </Button>
              )}
              
              {/* Message Button */}
              <Button
                onClick={() => setShowMessageDialog(true)}
                size="lg"
                variant="outline"
                className="w-full h-14 rounded-xl border-border/50 bg-secondary/30 hover:bg-secondary/50 text-base gap-3"
              >
                <MessageSquare className="h-5 w-5" />
                Send Message
              </Button>
            </div>

            {/* Owner Info */}
            <div className="mt-8 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white">
                {mockItem.ownerAvatar}
              </div>
              <span>Owned by {mockItem.ownerName}</span>
            </div>

            {/* Privacy Info */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Your location is not shared with the owner</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border/50 px-6 py-4 bg-secondary/20">
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

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>
              Send a message
            </DialogTitle>
            <DialogDescription>
              Let the owner know you found their item and how to reach you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Your message
              </label>
              <Textarea
                placeholder="Hi, I found your item at..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] rounded-xl bg-secondary/50 border-border/50 resize-none"
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Your contact (optional)
              </label>
              <Input
                placeholder="Phone or email"
                value={finderContact}
                onChange={(e) => setFinderContact(e.target.value)}
                className="h-12 rounded-xl bg-secondary/50 border-border/50"
              />
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl text-center">
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
            <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Message Sent!
            </h3>
            <p className="mt-2 text-muted-foreground">
              The owner has been notified. They will contact you soon.
            </p>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={(open) => {
        if (!open && callState !== "ended") {
          endCall()
        }
      }}>
        <DialogContent className="sm:max-w-lg p-0 rounded-2xl border-border/50 bg-card overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{isVideoCall ? "Video call with owner" : "Audio call with owner"}</DialogTitle>
            <DialogDescription>
              Ongoing finder to owner call session.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            {/* Video Area */}
            {isVideoCall ? (
              <div className="relative aspect-[4/3] bg-black">
                {/* Remote Video (or placeholder) */}
                {callState === "connected" ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white mb-4">
                      {mockItem.ownerAvatar}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {mockItem.ownerName}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {callState === "connecting" && "Connecting..."}
                      {callState === "ringing" && "Ringing..."}
                      {callState === "ended" && "Call ended"}
                    </p>
                    
                    {callState === "ringing" && (
                      <div className="mt-4 flex gap-2">
                        <span className="h-3 w-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-3 w-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-3 w-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Local Video (Picture-in-Picture) */}
                {callState === "connected" && isVideoEnabled && (
                  <div className="absolute bottom-4 right-4 w-32 aspect-[4/3] rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                  </div>
                )}
                
                {/* Call Duration */}
                {callState === "connected" && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-white font-mono">
                      {formatDuration(callDuration)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Audio Call UI */
              <div className="relative py-16 px-8 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <motion.div
                  animate={callState === "ringing" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-4xl font-bold text-white mb-6"
                >
                  {mockItem.ownerAvatar}
                </motion.div>
                
                <h3 className="text-xl font-semibold text-foreground">
                  {mockItem.ownerName}
                </h3>
                
                <p className="mt-2 text-muted-foreground">
                  {callState === "connecting" && "Connecting..."}
                  {callState === "ringing" && "Ringing..."}
                  {callState === "connected" && formatDuration(callDuration)}
                  {callState === "ended" && "Call ended"}
                </p>
                
                {callState === "ringing" && (
                  <div className="mt-4 flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-3 w-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-3 w-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            )}
            
            {/* Call Controls */}
            <div className="p-6 bg-card">
              {callState !== "ended" ? (
                <div className="flex items-center justify-center gap-4">
                  {/* Mute Button */}
                  <Button
                    onClick={toggleMute}
                    size="icon"
                    variant={isMuted ? "destructive" : "secondary"}
                    className="h-14 w-14 rounded-full"
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  
                  {/* Video Toggle (only for video calls) */}
                  {isVideoCall && (
                    <Button
                      onClick={toggleVideo}
                      size="icon"
                      variant={!isVideoEnabled ? "destructive" : "secondary"}
                      className="h-14 w-14 rounded-full"
                    >
                      {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                    </Button>
                  )}
                  
                  {/* End Call Button */}
                  <Button
                    onClick={endCall}
                    size="icon"
                    variant="destructive"
                    className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
                  >
                    <PhoneOff className="h-7 w-7" />
                  </Button>
                  
                  {/* Speaker Button */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-14 w-14 rounded-full"
                  >
                    <Volume2 className="h-6 w-6" />
                  </Button>
                  
                  {/* Switch Camera (only for video calls) */}
                  {isVideoCall && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-14 w-14 rounded-full"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Call ended</p>
                  <Button
                    onClick={() => {
                      setShowCallDialog(false)
                      setCallState("idle")
                      setCallDuration(0)
                    }}
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
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
