"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { fetchAuthSession } from "aws-amplify/auth"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react"
import {
  type AnalyticsStatRecord,
  currentMonthKey,
  loadOwnerAnalytics,
  loadOwnerPayments,
  loadOwnerSubscriptions,
  metricValue,
} from "@/lib/owner-analytics"

interface PaymentRow extends Record<string, unknown> {
  id: string
  user: string
  email: string
  plan: string
  amount: number
  status: "succeeded" | "pending" | "failed" | "refunded"
  date: string
  method: string
}

const columns: Column<PaymentRow>[] = [
  {
    key: "id",
    title: "Transaction ID",
    sortable: true,
    render: (value) => <span className="font-mono text-sm text-muted-foreground">{value as string}</span>,
  },
  {
    key: "user",
    title: "Customer",
    sortable: true,
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
          {row.user
            .split(" ")
            .map((name) => name[0])
            .join("")}
        </div>
        <div>
          <p className="font-medium">{row.user}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "plan",
    title: "Plan",
    sortable: true,
    render: (value) => (
      <Badge variant="secondary" className="capitalize bg-secondary text-secondary-foreground">
        {String(value || "subscription")}
      </Badge>
    ),
  },
  {
    key: "amount",
    title: "Amount",
    sortable: true,
    render: (value) => <span className="font-medium">${Number(value || 0).toFixed(2)}</span>,
  },
  {
    key: "status",
    title: "Status",
    sortable: true,
    render: (value) => {
      const status = value as PaymentRow["status"]
      const colors = {
        succeeded: "bg-accent/20 text-accent",
        pending: "bg-yellow-500/20 text-yellow-500",
        failed: "bg-destructive/20 text-destructive",
        refunded: "bg-muted text-muted-foreground",
      }
      return (
        <Badge variant="secondary" className={`capitalize ${colors[status]}`}>
          {status}
        </Badge>
      )
    },
  },
  {
    key: "method",
    title: "Payment Method",
    render: (value) => <span className="text-sm text-muted-foreground">{value as string}</span>,
  },
  {
    key: "date",
    title: "Date",
    sortable: true,
    render: (value) => new Date(value as string).toLocaleDateString(),
  },
]

function normalizePaymentStatus(status?: string | null): PaymentRow["status"] {
  if (status === "PAID") return "succeeded"
  if (status === "REFUNDED") return "refunded"
  if (status === "FAILED") return "failed"
  return "pending"
}

function exportCsv(rows: PaymentRow[]) {
  const header = ["Transaction ID", "Plan", "Amount", "Status", "Method", "Date"]
  const lines = rows.map((row) =>
    [row.id, row.plan, row.amount, row.status, row.method, row.date]
      .map((value) => `"${String(value)}"`)
      .join(","),
  )
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "payments.csv"
  link.click()
  URL.revokeObjectURL(url)
}

export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [stats, setStats] = useState<AnalyticsStatRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const loadPayments = async () => {
      try {
        setIsLoading(true)
        setError("")

        const session = await fetchAuthSession()
        const sub = session.tokens?.idToken?.payload?.sub as string | undefined
        if (!sub) {
          throw new Error("Owner session was not available")
        }

        const [payments, subscriptions, analytics] = await Promise.all([
          loadOwnerPayments(sub),
          loadOwnerSubscriptions(sub),
          loadOwnerAnalytics(`owner#${sub}`),
        ])

        const subscriptionById = new Map(subscriptions.map((value) => [value.id, value]))
        const nextRows = payments
          .slice()
          .sort((left, right) => (right.createdAt || "").localeCompare(left.createdAt || ""))
          .map((payment) => {
            const subscription = payment.subscriptionId
              ? subscriptionById.get(payment.subscriptionId)
              : undefined
            return {
              id: payment.externalId || payment.id,
              user: "You",
              email: "Owner account",
              plan: subscription?.planId || "subscription",
              amount: Number(payment.amount || 0),
              status: normalizePaymentStatus(payment.status),
              date: payment.createdAt || new Date().toISOString(),
              method: payment.gateway || payment.currency || "Recorded payment",
            } satisfies PaymentRow
          })

        if (!active) return
        setRows(nextRows)
        setStats(analytics)
      } catch (loadError: any) {
        if (active) {
          setError(loadError?.message || "Unable to load payments")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadPayments()

    return () => {
      active = false
    }
  }, [])

  const month = currentMonthKey()
  const totalRevenue = metricValue(stats, "revenue.total#all")
  const monthlyRevenue = metricValue(stats, `revenue.monthly#${month}`)
  const activeSubscriptions = Math.round(metricValue(stats, "subscriptions.active#all"))
  const paidTransactions = Math.round(metricValue(stats, "payments.paid#all"))
  const averageTransaction = paidTransactions ? totalRevenue / paidTransactions : 0

  const statCards = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: `$${totalRevenue.toFixed(2)}`,
        icon: DollarSign,
        iconColor: "from-accent to-accent/50",
      },
      {
        title: "MRR",
        value: `$${monthlyRevenue.toFixed(2)}`,
        icon: TrendingUp,
        iconColor: "from-primary to-primary/50",
      },
      {
        title: "Active Subscriptions",
        value: activeSubscriptions,
        icon: Users,
        iconColor: "from-primary to-accent",
      },
      {
        title: "Avg. Transaction",
        value: `$${averageTransaction.toFixed(2)}`,
        icon: CreditCard,
        iconColor: "from-accent to-primary",
      },
    ],
    [activeSubscriptions, averageTransaction, monthlyRevenue, totalRevenue],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Payments
          </h1>
          <p className="text-muted-foreground">Manage subscriptions and transactions</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          <Button
            variant="outline"
            className="rounded-xl border-border/50"
            onClick={() => exportCsv(rows)}
            disabled={!rows.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </motion.div>
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

      {isLoading ? (
        <div className="rounded-xl border border-border/50 bg-card/30 p-6 text-sm text-muted-foreground">
          Loading payments...
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <DataTable
            data={rows}
            columns={columns}
            searchKey="id"
            searchPlaceholder="Search transactions..."
            filterOptions={[
              {
                key: "status",
                label: "Status",
                options: [
                  { value: "succeeded", label: "Succeeded" },
                  { value: "pending", label: "Pending" },
                  { value: "failed", label: "Failed" },
                  { value: "refunded", label: "Refunded" },
                ],
              },
            ]}
            actions={(row) => (
              <>
                <DropdownMenuItem className="rounded-lg">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg" onClick={() => exportCsv([row])}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Row
                </DropdownMenuItem>
                {row.status === "succeeded" && (
                  <DropdownMenuItem className="rounded-lg text-destructive">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refund
                  </DropdownMenuItem>
                )}
              </>
            )}
          />
        </motion.div>
      )}
    </div>
  )
}
