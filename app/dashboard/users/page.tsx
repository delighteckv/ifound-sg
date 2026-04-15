"use client"

import { useEffect, useState } from "react"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Eye, Edit, Trash2, UserPlus } from "lucide-react"
import { motion } from "framer-motion"
import outputs from "@/amplify_outputs.json"

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

type UserRecord = {
  cognitoId: string
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  displayName?: string | null
  role?: "OWNER" | "ADMIN" | null
  status?: "PENDING" | "ACTIVE" | "INACTIVE" | null
  createdAt?: string | null
}

type QrCodeRecord = {
  code: string
  ownerId?: string | null
}

type SubscriptionRecord = {
  ownerId: string
  planId: string
  status?: string | null
  createdAt?: string | null
}

interface UserRow extends Record<string, unknown> {
  id: string
  name: string
  email: string
  phone: string
  plan: "starter" | "pro" | "business"
  qrCodes: number
  status: "active" | "inactive" | "suspended"
  createdAt: string
}

const usersByRoleQuery = /* GraphQL */ `
  query UsersByRole($role: UserRole!, $limit: Int, $nextToken: String) {
    UsersByRole(role: $role, limit: $limit, nextToken: $nextToken) {
      items {
        cognitoId
        email
        phone
        firstName
        lastName
        displayName
        role
        status
        createdAt
      }
    }
  }
`

const qrCodesByOwnerQuery = /* GraphQL */ `
  query QrCodesByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    QrCodesByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        code
        ownerId
      }
    }
  }
`

const ownerSubscriptionsQuery = /* GraphQL */ `
  query OwnerSubscriptionsByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    OwnerSubscriptionsByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        ownerId
        planId
        status
        createdAt
      }
    }
  }
`

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": outputs.data.api_key,
  }
}

async function runGraphQL<T>(query: string, variables: Record<string, unknown>) {
  const response = await fetch(outputs.data.url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ query, variables }),
  })

  const json = (await response.json()) as GraphQLResponse<T>
  if (!response.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message || "GraphQL request failed")
  }
  if (!json.data) {
    throw new Error("GraphQL response did not include data")
  }
  return json.data
}

function normalizePlan(planId?: string | null): UserRow["plan"] {
  const value = String(planId || "").toLowerCase()
  if (value.includes("business")) return "business"
  if (value.includes("pro")) return "pro"
  return "starter"
}

function normalizeStatus(status?: string | null): UserRow["status"] {
  if (status === "INACTIVE") return "inactive"
  if (status === "PENDING") return "suspended"
  return "active"
}

function displayName(user: UserRecord) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return user.displayName || full || user.email || user.phone || "Unnamed user"
}

const columns: Column<UserRow>[] = [
  {
    key: "name",
    title: "Name",
    sortable: true,
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
          {row.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
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
      const plan = value as UserRow["plan"]
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
      const status = value as UserRow["status"]
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
  const [rows, setRows] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const loadUsers = async () => {
      try {
        setIsLoading(true)
        setError("")

        const [ownersData, adminsData] = await Promise.all([
          runGraphQL<{ UsersByRole: { items: UserRecord[] } }>(usersByRoleQuery, {
            role: "OWNER",
            limit: 200,
          }),
          runGraphQL<{ UsersByRole: { items: UserRecord[] } }>(usersByRoleQuery, {
            role: "ADMIN",
            limit: 50,
          }),
        ])

        const users = [
          ...(ownersData.UsersByRole.items || []),
          ...(adminsData.UsersByRole.items || []),
        ]

        const enriched = await Promise.all(
          users.map(async (user) => {
            const [qrData, subscriptionData] = await Promise.all([
              runGraphQL<{ QrCodesByOwner: { items: QrCodeRecord[] } }>(qrCodesByOwnerQuery, {
                ownerId: user.cognitoId,
                limit: 500,
              }),
              runGraphQL<{ OwnerSubscriptionsByOwner: { items: SubscriptionRecord[] } }>(
                ownerSubscriptionsQuery,
                {
                  ownerId: user.cognitoId,
                  limit: 50,
                },
              ),
            ])

            const latestSubscription = (subscriptionData.OwnerSubscriptionsByOwner.items || [])
              .slice()
              .sort((left, right) => (right.createdAt || "").localeCompare(left.createdAt || ""))[0]

            return {
              id: user.cognitoId,
              name: displayName(user),
              email: user.email || "No email",
              phone: user.phone || "No phone",
              plan: normalizePlan(latestSubscription?.planId),
              qrCodes: qrData.QrCodesByOwner.items?.length || 0,
              status: normalizeStatus(user.status),
              createdAt: user.createdAt || new Date().toISOString(),
            } satisfies UserRow
          }),
        )

        enriched.sort((left, right) => right.createdAt.localeCompare(left.createdAt))

        if (active) {
          setRows(enriched)
        }
      } catch (loadError: any) {
        if (active) {
          setError(loadError?.message || "Unable to load users")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadUsers()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Users
          </h1>
          <p className="text-muted-foreground">Manage your platform users</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90" disabled>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </motion.div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="rounded-xl border border-border/50 bg-card/30 p-6 text-sm text-muted-foreground">
            Loading users...
          </div>
        ) : (
          <DataTable
            data={rows}
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
            actions={() => (
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
        )}
      </motion.div>
    </div>
  )
}
