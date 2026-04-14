"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QrCode, Phone, MessageSquare, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const demoSteps = [
  {
    id: "scan",
    title: "Scan QR Code",
    description: "Finder scans the QR code on your item",
    icon: QrCode,
  },
  {
    id: "landing",
    title: "View Landing Page",
    description: "They see item info and contact options",
    icon: Phone,
  },
  {
    id: "contact",
    title: "Contact Owner",
    description: "Call or message through secure platform",
    icon: MessageSquare,
  },
  {
    id: "recovered",
    title: "Item Recovered",
    description: "You get your item back safely",
    icon: CheckCircle,
  },
]

export function DemoSection() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-block rounded-full border border-border/50 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            See It In Action
          </span>
          <h2 
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            The Recovery{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Flow
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Watch how easy it is for finders to help return your lost items
          </p>
        </motion.div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative mx-auto max-w-xs">
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-2xl" />
              
              {/* Phone Frame */}
              <div className="relative rounded-[3rem] border-4 border-border/30 bg-background p-3 shadow-2xl">
                <div className="rounded-[2.5rem] bg-card overflow-hidden">
                  {/* Phone Notch */}
                  <div className="flex items-center justify-center py-3">
                    <div className="h-4 w-24 rounded-full bg-border/50" />
                  </div>

                  {/* Screen Content */}
                  <AnimatePresence mode="wait">
                    {activeStep === 0 && (
                      <motion.div
                        key="scan"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-6 text-center"
                      >
                        <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-3xl bg-white">
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <QrCode className="h-20 w-20 text-foreground" />
                          </motion.div>
                        </div>
                        <p className="text-sm text-muted-foreground">Point camera at QR code</p>
                      </motion.div>
                    )}

                    {activeStep === 1 && (
                      <motion.div
                        key="landing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-6"
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent" />
                          <div>
                            <p className="font-medium">Lost Item</p>
                            <p className="text-xs text-muted-foreground">MacBook Pro</p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-secondary/50 p-4">
                          <p className="text-sm text-muted-foreground">This item belongs to someone. Help them get it back!</p>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-10 rounded-lg bg-primary/20" />
                          <div className="h-10 rounded-lg bg-accent/20" />
                        </div>
                      </motion.div>
                    )}

                    {activeStep === 2 && (
                      <motion.div
                        key="contact"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-6"
                      >
                        <div className="mb-4 text-center">
                          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                            <MessageSquare className="h-8 w-8 text-accent" />
                          </div>
                          <p className="font-medium">Send a Message</p>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-sm text-muted-foreground">{"Hi, I found your item at..."}</p>
                          </div>
                          <div className="h-10 rounded-lg bg-primary" />
                        </div>
                      </motion.div>
                    )}

                    {activeStep === 3 && (
                      <motion.div
                        key="recovered"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-6 text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/50"
                        >
                          <CheckCircle className="h-10 w-10 text-white" />
                        </motion.div>
                        <p className="font-semibold text-lg">Item Recovered!</p>
                        <p className="mt-2 text-sm text-muted-foreground">Your MacBook Pro has been returned safely</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bottom padding */}
                  <div className="h-8" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="space-y-4">
              {demoSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(index)}
                  className={`w-full rounded-2xl border p-6 text-left transition-all duration-300 ${
                    activeStep === index
                      ? "border-primary/50 bg-card/50 shadow-lg"
                      : "border-border/30 bg-card/20 hover:border-border/50 hover:bg-card/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                      activeStep === index
                        ? "bg-gradient-to-br from-primary to-accent"
                        : "bg-secondary"
                    }`}>
                      <step.icon className={`h-6 w-6 ${
                        activeStep === index ? "text-white" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                          {step.title}
                        </h3>
                        {activeStep === index && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <ArrowRight className="h-5 w-5 text-primary" />
                          </motion.div>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Button 
              size="lg" 
              className="mt-8 w-full rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              Try It Yourself
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
