"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Travel Blogger",
    content: "I lost my luggage at the airport and someone found it within hours thanks to iFound. The QR code made it so easy for them to contact me. Absolutely life-saving!",
    avatar: "SM",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Tech Entrepreneur",
    content: "As someone who constantly loses things, iFound has been a game-changer. I&apos;ve recovered my AirPods, wallet, and keys - all through the simple QR system.",
    avatar: "MC",
    rating: 5,
  },
  {
    name: "Emma Rodriguez",
    role: "Parent of 3",
    content: "We put QR codes on all our kids&apos; belongings. Already recovered two water bottles and a backpack from school. The peace of mind is worth every penny.",
    avatar: "ER",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Dog Owner",
    content: "Our dog Max ran away and someone found him miles away. They scanned his collar QR code and we were reunited within an hour. Thank you iFound!",
    avatar: "DP",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Business Executive",
    content: "Lost my laptop bag at a conference. The finder scanned the QR and I got a notification instantly. Professional, secure, and incredibly efficient.",
    avatar: "LT",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Photographer",
    content: "My camera equipment is my livelihood. iFound gives me peace of mind knowing that if anything gets lost, I have the best chance of getting it back.",
    avatar: "JW",
    rating: 5,
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

export function TestimonialsSection() {
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
            Testimonials
          </span>
          <h2 
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Loved by{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Thousands
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            See what our customers are saying about their recovery experiences
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
              className={`group relative ${index === 1 ? "sm:translate-y-8" : ""} ${index === 4 ? "sm:translate-y-8" : ""}`}
            >
              <div className="relative h-full rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/50">
                {/* Stars */}
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground leading-relaxed">
                  &quot;{testimonial.content}&quot;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>

                {/* Hover glow */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
