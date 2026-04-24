"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { fetchAuthSession } from "aws-amplify/auth"
import { Button } from "@/components/ui/button"
import { ArrowRight, Scan, Shield, Bell } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    let active = true
    const checkSession = async () => {
      try {
        const session = await fetchAuthSession()
        if (active) {
          setIsSignedIn(Boolean(session.tokens?.idToken))
        }
      } catch {
        if (active) {
          setIsSignedIn(false)
        }
      }
    }
    void checkSession()
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="relative px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-1.5 text-sm backdrop-blur-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">Trusted by 10,000+ users worldwide</span>
            </motion.div>

            {/* Headline */}
            <h1 
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Never Lose What{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Matters!
              </span>
            </h1>

            {/* Subtext */}
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 text-pretty">
              QR-powered smart recovery system for your valuables. Attach, scan, and get notified instantly when someone finds your lost items.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 gap-2 text-base"
                asChild
              >
                <Link href={isSignedIn ? "/dashboard" : "/login"}>
                  {isSignedIn ? "Go to Dashboard" : "Get Your QR Kit"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full border-border/50 bg-secondary/30 hover:bg-secondary/50 text-base"
              >
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex items-center justify-center gap-8 lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-accent" />
                <span>Privacy First</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4 text-accent" />
                <span>Instant Alerts</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Animated QR Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl" />
              
              {/* Main Glass Card */}
              <div className="relative rounded-3xl border border-border/50 bg-card/50 p-8 backdrop-blur-xl">
                {/* Phone Mockup */}
                <div className="relative mx-auto w-64 rounded-[2.5rem] border-4 border-border/30 bg-background p-2 shadow-2xl">
                  <div className="rounded-[2rem] bg-card overflow-hidden">
                    {/* Phone Header */}
                    <div className="flex items-center justify-center py-3 border-b border-border/30">
                      <div className="h-4 w-20 rounded-full bg-border/50" />
                    </div>
                    
                    {/* QR Scan Animation */}
                    <div className="relative flex items-center justify-center py-12">
                      {/* QR Code Visual */}
                      <div className="relative">
                        <motion.div
                          animate={{ 
                            boxShadow: [
                              "0 0 20px rgba(139, 92, 246, 0.3)",
                              "0 0 40px rgba(139, 92, 246, 0.5)",
                              "0 0 20px rgba(139, 92, 246, 0.3)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="rounded-2xl bg-white p-4"
                        >
                          <Scan className="h-24 w-24 text-foreground" />
                        </motion.div>
                        
                        {/* Scanning Line */}
                        <motion.div
                          animate={{ y: [0, 100, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                        />
                      </div>
                    </div>

                    {/* Bottom Content */}
                    <div className="space-y-3 p-4">
                      <div className="h-3 w-3/4 rounded-full bg-border/50" />
                      <div className="h-3 w-1/2 rounded-full bg-border/50" />
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-8 top-8 rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                      <Bell className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alert</p>
                      <p className="text-sm font-medium">Item Found!</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -left-8 bottom-16 rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-medium">Protected</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
