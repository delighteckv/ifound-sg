"use client"

import { motion } from "framer-motion"
import { QrCode, Scan, Bell } from "lucide-react"

const steps = [
  {
    step: "01",
    title: "Register Your Item",
    description: "Create an account and register your valuable items. Generate unique QR codes for each item you want to protect.",
    icon: QrCode,
    color: "from-primary to-primary/50",
  },
  {
    step: "02",
    title: "Finder Scans QR",
    description: "When someone finds your lost item, they simply scan the QR code with their phone camera. No app required.",
    icon: Scan,
    color: "from-accent to-accent/50",
  },
  {
    step: "03",
    title: "Get Notified Instantly",
    description: "Receive instant notifications via SMS, email, or push. Connect with the finder through our secure platform.",
    icon: Bell,
    color: "from-primary via-accent to-primary/50",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative px-4 py-24 sm:px-6 lg:px-8">
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
            Simple Process
          </span>
          <h2 
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            How It{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Three simple steps to protect your valuables and recover them when lost
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-8 md:grid-cols-3"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              variants={itemVariants}
              className="group relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-20 hidden h-px w-full bg-gradient-to-r from-border via-border/50 to-transparent md:block" />
              )}

              <div className="relative rounded-3xl border border-border/50 bg-card/30 p-8 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/50">
                {/* Step Number */}
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-5xl font-bold text-border/50" style={{ fontFamily: 'var(--font-display)' }}>
                    {step.step}
                  </span>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  {step.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Hover Glow */}
                <div className={`absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-10`} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
