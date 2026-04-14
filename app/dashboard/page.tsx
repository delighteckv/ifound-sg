"use client"

import { motion } from "framer-motion"
import { Users, QrCode, Scan, DollarSign, ArrowRight } from "lucide-react"
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

const stats = [
  {
    title: "Total Users",
    value: "12,847",
    change: 12.5,
    icon: Users,
    iconColor: "from-primary to-primary/50",
  },
  {
    title: "Active QR Codes",
    value: "45,231",
    change: 8.2,
    icon: QrCode,
    iconColor: "from-accent to-accent/50",
  },
  {
    title: "Total Scans",
    value: "128,492",
    change: 23.1,
    icon: Scan,
    iconColor: "from-primary to-accent",
  },
  {
    title: "Monthly Revenue",
    value: "$54,892",
    change: 15.3,
    icon: DollarSign,
    iconColor: "from-accent to-primary",
  },
]

const chartData = [
  { name: "Jan", scans: 2400, recoveries: 180 },
  { name: "Feb", scans: 3600, recoveries: 250 },
  { name: "Mar", scans: 3200, recoveries: 220 },
  { name: "Apr", scans: 4500, recoveries: 310 },
  { name: "May", scans: 4200, recoveries: 290 },
  { name: "Jun", scans: 5800, recoveries: 420 },
  { name: "Jul", scans: 6100, recoveries: 480 },
]

const recentActivity = [
  {
    id: 1,
    type: "scan",
    item: "MacBook Pro",
    location: "San Francisco, CA",
    time: "2 minutes ago",
    status: "active",
  },
  {
    id: 2,
    type: "recovery",
    item: "Wallet",
    location: "New York, NY",
    time: "15 minutes ago",
    status: "recovered",
  },
  {
    id: 3,
    type: "scan",
    item: "AirPods Pro",
    location: "Los Angeles, CA",
    time: "1 hour ago",
    status: "active",
  },
  {
    id: 4,
    type: "message",
    item: "Backpack",
    location: "Chicago, IL",
    time: "2 hours ago",
    status: "pending",
  },
  {
    id: 5,
    type: "scan",
    item: "Keys",
    location: "Seattle, WA",
    time: "3 hours ago",
    status: "active",
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your QR recovery platform
          </p>
        </div>
        <Button asChild className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
          <Link href="/dashboard/qr-codes">
            Generate QR Code
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={stat.title} {...stat} delay={index * 0.1} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scans Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 
                className="text-lg font-semibold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Scan Analytics
              </h3>
              <p className="text-sm text-muted-foreground">
                Monthly scan and recovery trends
              </p>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRecoveries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScans)"
                />
                <Area
                  type="monotone"
                  dataKey="recoveries"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRecoveries)"
                />
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
              <span className="text-sm text-muted-foreground">Recoveries</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 
                className="text-lg font-semibold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Recent Activity
              </h3>
              <p className="text-sm text-muted-foreground">
                Latest scans and recoveries
              </p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/dashboard/activity">View all</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-4 rounded-xl bg-secondary/30 p-4"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  activity.type === "recovery"
                    ? "bg-accent/20"
                    : activity.type === "message"
                    ? "bg-primary/20"
                    : "bg-secondary"
                }`}>
                  {activity.type === "recovery" ? (
                    <Badge variant="default" className="h-6 px-2 bg-accent text-accent-foreground">
                      <span className="text-xs">Recovered</span>
                    </Badge>
                  ) : activity.type === "message" ? (
                    <Badge variant="default" className="h-6 px-2 bg-primary text-primary-foreground">
                      <span className="text-xs">Message</span>
                    </Badge>
                  ) : (
                    <Scan className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{activity.item}</p>
                  <p className="text-sm text-muted-foreground truncate">{activity.location}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
