"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { fetchAuthSession } from "aws-amplify/auth"
import { Users, QrCode, Scan, DollarSign, ArrowRight, MessageSquare, Phone } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  type AnalyticsStatRecord,
  currentMonthKey,
  loadOwnerActivitySupport,
  loadOwnerAnalytics,
  metricValue,
  type QrCodeRecord,
  type ValuableRecord,
} from "@/lib/owner-analytics"

type ActivityItem = {
  id: string
  type: "scan" | "call" | "message"
  item: string
  location: string
  time: string
  timestamp: string
}

function relativeTime(dateString?: string | null) {
  if (!dateString) return "Unknown"
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function monthSeries(stats: AnalyticsStatRecord[], baseMetric: string, count = 6) {
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - index - 1), 1))
    const key = currentMonthKey(date)
    return {
      name: date.toLocaleString("en-US", { month: "short" }),
      scans: metricValue(stats, `${baseMetric}#${key}`),
    }
  })
}

function resolveItemName(
  valuableId: string | null | undefined,
  qrCodeId: string | null | undefined,
  valuableById: Map<string, ValuableRecord>,
  qrByCode: Map<string, QrCodeRecord>,
) {
  const valuable =
    (valuableId ? valuableById.get(valuableId) : undefined) ||
    (qrCodeId ? valuableById.get(qrByCode.get(qrCodeId)?.valuableId || "") : undefined)
  return valuable?.name || (qrCodeId ? qrByCode.get(qrCodeId)?.label : undefined) || "Registered item"
}

export default function DashboardPage() {
  const [ownerId, setOwnerId] = useState("")
  const [stats, setStats] = useState<AnalyticsStatRecord[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      try {
        setIsLoading(true)
        setError("")

        const session = await fetchAuthSession()
        const sub = session.tokens?.idToken?.payload?.sub as string | undefined
        if (!sub) {
          throw new Error("Owner session was not available")
        }

        const scope = `owner#${sub}`
        const [analytics, support] = await Promise.all([
          loadOwnerAnalytics(scope),
          loadOwnerActivitySupport(sub),
        ])

        const valuableById = new Map(support.valuables.map((value) => [value.id, value]))
        const qrByCode = new Map(support.qrCodes.map((value) => [value.code, value]))

        const recentScans: ActivityItem[] = support.scans
          .filter((scan) => scan.channel !== "MESSAGE")
          .map((scan) => ({
            id: `scan-${scan.id}`,
            type: scan.channel === "CALL" ? "call" : "scan",
            item: resolveItemName(scan.valuableId, scan.qrCodeId, valuableById, qrByCode),
            location: scan.locationText || "Unknown location",
            time: relativeTime(scan.scannedAt),
            timestamp: scan.scannedAt,
          }))

        const recentMessages: ActivityItem[] = support.messages.map((message) => ({
          id: `message-${message.id}`,
          type: "message",
          item: resolveItemName(message.valuableId || undefined, undefined, valuableById, qrByCode),
          location: "Finder message received",
          time: relativeTime(message.createdAt),
          timestamp: message.createdAt || new Date(0).toISOString(),
        }))

        const recentActivity = [...recentScans, ...recentMessages]
          .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
          .slice(0, 5)

        if (!active) return

        setOwnerId(sub)
        setStats(analytics)
        setActivity(recentActivity)
      } catch (loadError: any) {
        if (active) {
          setError(loadError?.message || "Unable to load dashboard analytics")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  const month = currentMonthKey()
  const statCards = useMemo(
    () => [
      {
        title: "Active Subscriptions",
        value: Math.round(metricValue(stats, "subscriptions.active#all")),
        icon: Users,
        iconColor: "from-primary to-primary/50",
      },
      {
        title: "Contact Attempts",
        value: Math.round(metricValue(stats, "contacts.total#all")),
        icon: QrCode,
        iconColor: "from-accent to-accent/50",
      },
      {
        title: "Total Scans",
        value: Math.round(metricValue(stats, "scans.total#all")),
        icon: Scan,
        iconColor: "from-primary to-accent",
      },
      {
        title: "Monthly Revenue",
        value: `$${metricValue(stats, `revenue.monthly#${month}`).toFixed(2)}`,
        icon: DollarSign,
        iconColor: "from-accent to-primary",
      },
    ],
    [month, stats],
  )

  const chartData = useMemo(() => {
    const scans = monthSeries(stats, "scans.monthly")
    const contacts = monthSeries(stats, "contacts.message.monthly")
    return scans.map((scan, index) => ({
      name: scan.name,
      scans: scan.scans,
      contacts: contacts[index]?.scans ?? 0,
    }))
  }, [stats])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Dashboard
          </h1>
          <p className="text-muted-foreground">Overview of your QR recovery platform</p>
        </div>
        <Button asChild className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
          <Link href="/dashboard/qr-codes">
            Generate QR Code
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatsCard key={stat.title} {...stat} delay={index * 0.1} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Scan Analytics
            </h3>
            <p className="text-sm text-muted-foreground">Last 6 months of scans and messages</p>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
                <Area type="monotone" dataKey="contacts" stroke="hsl(var(--accent))" strokeWidth={2} fillOpacity={1} fill="url(#colorContacts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Scans</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">Messages</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Recent Activity
              </h3>
              <p className="text-sm text-muted-foreground">Latest scans, calls, and finder messages</p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/dashboard/activity">View all</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-xl bg-secondary/20 p-4 text-sm text-muted-foreground">Loading activity...</div>
            ) : activity.length ? (
              activity.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-4 rounded-xl bg-secondary/30 p-4"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    entry.type === "message"
                      ? "bg-primary/20"
                      : entry.type === "call"
                        ? "bg-accent/20"
                        : "bg-secondary"
                  }`}>
                    {entry.type === "message" ? (
                      <MessageSquare className="h-5 w-5 text-primary" />
                    ) : entry.type === "call" ? (
                      <Phone className="h-5 w-5 text-accent" />
                    ) : (
                      <Scan className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{entry.item}</p>
                    <p className="truncate text-sm text-muted-foreground">{entry.location}</p>
                  </div>
                  <Badge variant="secondary" className="whitespace-nowrap text-xs">
                    {entry.time}
                  </Badge>
                </motion.div>
              ))
            ) : (
              <div className="rounded-xl bg-secondary/20 p-4 text-sm text-muted-foreground">
                No activity recorded yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
