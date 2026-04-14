"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { QrCode, Camera, ArrowLeft, Flashlight, RefreshCw, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if camera is available
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setHasCamera(true)
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch {
      setError("Unable to access camera. Please grant camera permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setIsScanning(false)
    }
  }

  const handleManualSubmit = () => {
    if (manualCode.trim().length >= 6) {
      router.push(`/found/${manualCode.trim()}`)
    } else {
      setError("Please enter a valid QR code")
    }
  }

  // Simulate QR code detection (in production, use a library like @zxing/browser)
  useEffect(() => {
    if (isScanning) {
      const timeout = setTimeout(() => {
        // Simulate finding a QR code after 3 seconds
        stopCamera()
        router.push("/found/demo-item-123")
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [isScanning, router])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-accent/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-primary/15 blur-[80px]" />
      </div>

      {/* Back Link */}
      <Link 
        href="/login" 
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/70">
              <QrCode className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Scan QR Code
          </h1>
          <p className="mt-2 text-muted-foreground">
            Point your camera at the QR code on the found item
          </p>
        </div>

        {/* Scanner Area */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
          {!isScanning && !showManualInput ? (
            <div className="p-8 space-y-6">
              {/* Camera Button */}
              <Button
                onClick={startCamera}
                disabled={!hasCamera}
                size="lg"
                className="w-full h-14 rounded-xl bg-gradient-to-r from-accent to-accent/80 hover:opacity-90 text-base gap-3"
              >
                <Camera className="h-5 w-5" />
                {hasCamera ? "Open Camera" : "Camera Not Available"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-4 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Manual Input Button */}
              <Button
                onClick={() => setShowManualInput(true)}
                variant="outline"
                size="lg"
                className="w-full h-14 rounded-xl border-border/50 bg-secondary/30 hover:bg-secondary/50 text-base gap-3"
              >
                <Keyboard className="h-5 w-5" />
                Enter Code Manually
              </Button>
            </div>
          ) : showManualInput ? (
            <div className="p-8 space-y-4">
              <button
                onClick={() => {
                  setShowManualInput(false)
                  setError("")
                  setManualCode("")
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to scanner
              </button>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Enter the code below the QR
                  </label>
                  <Input
                    placeholder="e.g., ABC123XYZ"
                    value={manualCode}
                    onChange={(e) => {
                      setManualCode(e.target.value.toUpperCase())
                      setError("")
                    }}
                    className="h-14 rounded-xl bg-secondary/50 border-border/50 text-lg text-center tracking-widest font-mono"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button
                  onClick={handleManualSubmit}
                  disabled={manualCode.length < 6}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-base"
                >
                  Find Item
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Video Feed */}
              <div className="relative aspect-square bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-accent rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-accent rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-accent rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-accent rounded-br-lg" />
                    
                    {/* Scanning line animation */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
                      initial={{ top: 0 }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <Button
                    onClick={() => setFlashOn(!flashOn)}
                    size="icon"
                    variant="secondary"
                    className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-sm border-white/20"
                  >
                    <Flashlight className={`h-5 w-5 ${flashOn ? "text-yellow-400" : "text-white"}`} />
                  </Button>
                  <Button
                    onClick={stopCamera}
                    size="icon"
                    variant="secondary"
                    className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-sm border-white/20"
                  >
                    <RefreshCw className="h-5 w-5 text-white" />
                  </Button>
                </div>
              </div>

              <p className="p-4 text-center text-sm text-muted-foreground">
                Scanning for QR code...
              </p>
            </div>
          )}
        </div>

        {/* Helper Text */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {"Can't scan?"}{" "}
          <button
            onClick={() => {
              stopCamera()
              setShowManualInput(true)
            }}
            className="text-primary hover:underline"
          >
            Enter code manually
          </button>
        </p>
      </motion.div>
    </div>
  )
}
