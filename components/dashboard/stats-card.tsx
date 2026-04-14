"use client"

import { motion } from "framer-motion"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  delay?: number
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = "from last month",
  icon: Icon,
  iconColor = "from-primary to-primary/50",
  delay = 0,
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative"
    >
      <div className="relative rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p 
              className="mt-2 text-3xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {value}
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${iconColor}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>

        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`flex items-center gap-1 text-sm ${
                isPositive ? "text-accent" : "text-destructive"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isPositive ? "+" : ""}{change}%
            </span>
            <span className="text-sm text-muted-foreground">{changeLabel}</span>
          </div>
        )}

        {/* Hover glow */}
        <div className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${iconColor} opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-10`} />
      </div>
    </motion.div>
  )
}
