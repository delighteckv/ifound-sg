"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: "$4.99",
    period: "/month",
    description: "Perfect for personal use",
    features: [
      "Up to 5 QR codes",
      "Email notifications",
      "Basic dashboard",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$12.99",
    period: "/month",
    description: "For families and small teams",
    features: [
      "Up to 25 QR codes",
      "SMS + Push notifications",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
      "Reward payments",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Business",
    price: "$49.99",
    period: "/month",
    description: "For organizations and enterprises",
    features: [
      "Unlimited QR codes",
      "All notification channels",
      "Full analytics suite",
      "Dedicated support",
      "White-label solution",
      "API access",
      "Team management",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

export function PricingSection() {
  return (
    <section id="pricing" className="relative px-4 py-24 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
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
            Pricing
          </span>
          <h2 
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-8 lg:grid-cols-3"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              className="relative"
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`relative h-full rounded-3xl border p-8 transition-all duration-300 ${
                plan.popular
                  ? "border-primary/50 bg-card/50 shadow-xl shadow-primary/10"
                  : "border-border/50 bg-card/30 hover:border-border hover:bg-card/50"
              }`}>
                {/* Plan Header */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      {plan.price}
                    </span>
                    <span className="ml-1 text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        plan.popular ? "bg-primary/20" : "bg-secondary"
                      }`}>
                        <Check className={`h-3 w-3 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  <Button 
                    asChild
                    className={`w-full rounded-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                    variant={plan.popular ? "default" : "secondary"}
                  >
                    <Link href="/login">{plan.cta}</Link>
                  </Button>
                </div>

                {/* Glow effect for popular */}
                {plan.popular && (
                  <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent blur-xl" />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
