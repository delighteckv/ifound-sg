"use client"

import { motion } from "framer-motion"
import { 
  QrCode, 
  MessageSquare, 
  Bell, 
  CreditCard, 
  LayoutDashboard, 
  Shield,
  Smartphone,
  Globe
} from "lucide-react"

const features = [
  {
    title: "Branded QR Generation",
    description: "Create custom QR codes with your logo and colors. Make your items uniquely identifiable.",
    icon: QrCode,
    gradient: "from-primary/20 to-primary/5",
  },
  {
    title: "Instant Communication",
    description: "Finders can call or message you directly through our secure platform without revealing your number.",
    icon: MessageSquare,
    gradient: "from-accent/20 to-accent/5",
  },
  {
    title: "Multi-channel Alerts",
    description: "Get notified instantly via SMS, email, and push notifications when your item is scanned.",
    icon: Bell,
    gradient: "from-primary/20 to-accent/5",
  },
  {
    title: "Secure Payments",
    description: "Offer rewards to finders with built-in secure payment processing. Incentivize returns.",
    icon: CreditCard,
    gradient: "from-accent/20 to-primary/5",
  },
  {
    title: "Admin Dashboard",
    description: "Manage all your items, view scan history, and track recovery statistics in one place.",
    icon: LayoutDashboard,
    gradient: "from-primary/20 to-primary/5",
  },
  {
    title: "Privacy Protected",
    description: "Your personal information stays safe. Control what finders can see and access.",
    icon: Shield,
    gradient: "from-accent/20 to-accent/5",
  },
  {
    title: "Mobile First",
    description: "Fully responsive design works seamlessly on any device. No app installation needed.",
    icon: Smartphone,
    gradient: "from-primary/20 to-accent/5",
  },
  {
    title: "Global Coverage",
    description: "Works anywhere in the world. Multi-language support for international recovery.",
    icon: Globe,
    gradient: "from-accent/20 to-primary/5",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative px-4 py-24 sm:px-6 lg:px-8">
      {/* Background accent */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
      </div>

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
            Features
          </span>
          <h2 
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Stay Protected
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Powerful features designed to maximize your chances of recovering lost items
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative"
            >
              <div className="relative h-full rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/50">
                {/* Icon */}
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} backdrop-blur-sm`}>
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
