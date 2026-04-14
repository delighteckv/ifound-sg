"use client"

import { DataTable, Column } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Eye, Edit, Trash2, Plus, UserPlus } from "lucide-react"
import { motion } from "framer-motion"

interface User {
  id: string
  name: string
  email: string
  phone: string
  plan: "starter" | "pro" | "business"
  qrCodes: number
  status: "active" | "inactive" | "suspended"
  createdAt: string
}

const mockUsers: User[] = [
  { id: "1", name: "John Smith", email: "john@example.com", phone: "+1 555-0101", plan: "pro", qrCodes: 15, status: "active", createdAt: "2024-01-15" },
  { id: "2", name: "Sarah Johnson", email: "sarah@example.com", phone: "+1 555-0102", plan: "business", qrCodes: 48, status: "active", createdAt: "2024-01-12" },
  { id: "3", name: "Michael Brown", email: "michael@example.com", phone: "+1 555-0103", plan: "starter", qrCodes: 3, status: "active", createdAt: "2024-01-10" },
  { id: "4", name: "Emily Davis", email: "emily@example.com", phone: "+1 555-0104", plan: "pro", qrCodes: 22, status: "inactive", createdAt: "2024-01-08" },
  { id: "5", name: "James Wilson", email: "james@example.com", phone: "+1 555-0105", plan: "starter", qrCodes: 5, status: "active", createdAt: "2024-01-05" },
  { id: "6", name: "Emma Taylor", email: "emma@example.com", phone: "+1 555-0106", plan: "business", qrCodes: 67, status: "active", createdAt: "2024-01-03" },
  { id: "7", name: "Daniel Martinez", email: "daniel@example.com", phone: "+1 555-0107", plan: "pro", qrCodes: 18, status: "suspended", createdAt: "2024-01-01" },
  { id: "8", name: "Olivia Anderson", email: "olivia@example.com", phone: "+1 555-0108", plan: "starter", qrCodes: 2, status: "active", createdAt: "2023-12-28" },
  { id: "9", name: "William Thomas", email: "william@example.com", phone: "+1 555-0109", plan: "pro", qrCodes: 25, status: "active", createdAt: "2023-12-25" },
  { id: "10", name: "Sophia Jackson", email: "sophia@example.com", phone: "+1 555-0110", plan: "business", qrCodes: 89, status: "active", createdAt: "2023-12-22" },
  { id: "11", name: "Benjamin White", email: "benjamin@example.com", phone: "+1 555-0111", plan: "starter", qrCodes: 4, status: "inactive", createdAt: "2023-12-20" },
  { id: "12", name: "Isabella Harris", email: "isabella@example.com", phone: "+1 555-0112", plan: "pro", qrCodes: 12, status: "active", createdAt: "2023-12-18" },
]

const columns: Column<User>[] = [
  {
    key: "name",
    title: "Name",
    sortable: true,
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
          {row.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "phone",
    title: "Phone",
    sortable: true,
  },
  {
    key: "plan",
    title: "Plan",
    sortable: true,
    render: (value) => {
      const plan = value as User["plan"]
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
    key: "qrCodes",
    title: "QR Codes",
    sortable: true,
  },
  {
    key: "status",
    title: "Status",
    sortable: true,
    render: (value) => {
      const status = value as User["status"]
      const colors = {
        active: "bg-accent/20 text-accent",
        inactive: "bg-muted text-muted-foreground",
        suspended: "bg-destructive/20 text-destructive",
      }
      return (
        <Badge variant="secondary" className={`capitalize ${colors[status]}`}>
          {status}
        </Badge>
      )
    },
  },
  {
    key: "createdAt",
    title: "Joined",
    sortable: true,
    render: (value) => new Date(value as string).toLocaleDateString(),
  },
]

export default function UsersPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Users
          </h1>
          <p className="text-muted-foreground">
            Manage your platform users
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </motion.div>
      </div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DataTable
          data={mockUsers}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search users..."
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
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "suspended", label: "Suspended" },
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
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </>
          )}
        />
      </motion.div>
    </div>
  )
}
