"use client"

import { motion } from "framer-motion"
import { DataTable, Column } from "@/components/dashboard/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DollarSign, TrendingUp, Users, CreditCard, Eye, Download, RefreshCw } from "lucide-react"

interface Payment {
  id: string
  user: string
  email: string
  plan: "starter" | "pro" | "business"
  amount: number
  status: "succeeded" | "pending" | "failed" | "refunded"
  date: string
  method: string
}

const mockPayments: Payment[] = [
  { id: "PAY001", user: "John Smith", email: "john@example.com", plan: "pro", amount: 12.99, status: "succeeded", date: "2024-03-10", method: "Visa ****4242" },
  { id: "PAY002", user: "Sarah Johnson", email: "sarah@example.com", plan: "business", amount: 49.99, status: "succeeded", date: "2024-03-10", method: "Mastercard ****5555" },
  { id: "PAY003", user: "Michael Brown", email: "michael@example.com", plan: "starter", amount: 4.99, status: "succeeded", date: "2024-03-09", method: "Visa ****1234" },
  { id: "PAY004", user: "Emily Davis", email: "emily@example.com", plan: "pro", amount: 12.99, status: "pending", date: "2024-03-09", method: "Amex ****0001" },
  { id: "PAY005", user: "James Wilson", email: "james@example.com", plan: "starter", amount: 4.99, status: "failed", date: "2024-03-08", method: "Visa ****9876" },
  { id: "PAY006", user: "Emma Taylor", email: "emma@example.com", plan: "business", amount: 49.99, status: "succeeded", date: "2024-03-08", method: "Mastercard ****3333" },
  { id: "PAY007", user: "Daniel Martinez", email: "daniel@example.com", plan: "pro", amount: 12.99, status: "refunded", date: "2024-03-07", method: "Visa ****7777" },
  { id: "PAY008", user: "Olivia Anderson", email: "olivia@example.com", plan: "starter", amount: 4.99, status: "succeeded", date: "2024-03-07", method: "Visa ****2468" },
  { id: "PAY009", user: "William Thomas", email: "william@example.com", plan: "pro", amount: 12.99, status: "succeeded", date: "2024-03-06", method: "Mastercard ****1357" },
  { id: "PAY010", user: "Sophia Jackson", email: "sophia@example.com", plan: "business", amount: 49.99, status: "succeeded", date: "2024-03-06", method: "Amex ****8888" },
]

const stats = [
  {
    title: "Total Revenue",
    value: "$54,892",
    change: 15.3,
    icon: DollarSign,
    iconColor: "from-accent to-accent/50",
  },
  {
    title: "MRR",
    value: "$12,450",
    change: 8.7,
    icon: TrendingUp,
    iconColor: "from-primary to-primary/50",
  },
  {
    title: "Active Subscriptions",
    value: "2,847",
    change: 12.1,
    icon: Users,
    iconColor: "from-primary to-accent",
  },
  {
    title: "Avg. Transaction",
    value: "$18.50",
    change: -2.3,
    icon: CreditCard,
    iconColor: "from-accent to-primary",
  },
]

const columns: Column<Payment>[] = [
  {
    key: "id",
    title: "Transaction ID",
    sortable: true,
    render: (value) => (
      <span className="font-mono text-sm text-muted-foreground">{value as string}</span>
    ),
  },
  {
    key: "user",
    title: "Customer",
    sortable: true,
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
          {row.user.split(" ").map(n => n[0]).join("")}
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
    render: (value) => {
      const plan = value as Payment["plan"]
      const colors = {
        starter: "bg-secondary text-secondary-foreground",
        pro: "bg-primary/20 text-primary",
        business: "bg-accent/20 text-accent",
      }
      return (
        <Badge variant="secondary" className={`capitalize ${colors[plan]}`}>
          {plan}
        </Badge>
      )
    },
  },
  {
    key: "amount",
    title: "Amount",
    sortable: true,
    render: (value) => (
      <span className="font-medium">${(value as number).toFixed(2)}</span>
    ),
  },
  {
    key: "status",
    title: "Status",
    sortable: true,
    render: (value) => {
      const status = value as Payment["status"]
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
    render: (value) => (
      <span className="text-sm text-muted-foreground">{value as string}</span>
    ),
  },
  {
    key: "date",
    title: "Date",
    sortable: true,
    render: (value) => new Date(value as string).toLocaleDateString(),
  },
]

export default function PaymentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Payments
          </h1>
          <p className="text-muted-foreground">
            Manage subscriptions and transactions
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          <Button variant="outline" className="rounded-xl border-border/50">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={stat.title} {...stat} delay={index * 0.1} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <DataTable
          data={mockPayments}
          columns={columns}
          searchKey="user"
          searchPlaceholder="Search transactions..."
          filterOptions={[
            {
              key: "plan",
              label: "Plan",
              options: [
                { value: "starter", label: "Starter" },
                { value: "pro", label: "Pro" },
                { value: "business", label: "Business" },
              ],
            },
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
              <DropdownMenuItem className="rounded-lg">
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
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
    </div>
  )
}
