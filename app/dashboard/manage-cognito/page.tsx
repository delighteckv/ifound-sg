"use client"

import { useEffect, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { motion } from "framer-motion"
import outputs from "@/amplify_outputs.json"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Eye, RefreshCw, ShieldCheck } from "lucide-react"

interface CognitoUserRow extends Record<string, unknown> {
  username: string
  name: string
  email: string
  phone: string
  provider: string
  groups: string
  status: string
  enabled: string
  createdAt: string
}

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

const adminListCognitoUsersQuery = /* GraphQL */ `
  query AdminListCognitoUsers {
    adminListCognitoUsers {
      users {
        username
        status
        enabled
        createdAt
        updatedAt
        email
        phone
        name
        givenName
        familyName
        identities
        groups
      }
    }
  }
`

const columns: Column<CognitoUserRow>[] = [
  {
    key: "name",
    title: "Name",
    sortable: true,
    render: (_, row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{row.username}</p>
      </div>
    ),
  },
  {
    key: "email",
    title: "Email",
    sortable: true,
  },
  {
    key: "phone",
    title: "Phone",
    sortable: true,
  },
  {
    key: "provider",
    title: "Provider",
    sortable: true,
    render: (value) => (
      <Badge variant="secondary" className="capitalize">
        {String(value || "cognito")}
      </Badge>
    ),
  },
  {
    key: "groups",
    title: "Groups",
    render: (value) => <span className="text-sm text-muted-foreground">{String(value || "—")}</span>,
  },
  {
    key: "status",
    title: "Status",
    sortable: true,
    render: (value, row) => {
      const tone =
        row.enabled === "Disabled"
          ? "bg-muted text-muted-foreground"
          : value === "CONFIRMED" || value === "EXTERNAL_PROVIDER"
            ? "bg-accent/20 text-accent"
            : "bg-primary/20 text-primary"
      return (
        <Badge variant="secondary" className={tone}>
          {row.enabled === "Disabled" ? "Disabled" : String(value)}
        </Badge>
      )
    },
  },
  {
    key: "createdAt",
    title: "Created",
    sortable: true,
    render: (value) => new Date(String(value)).toLocaleDateString(),
  },
]

function deriveProvider(username: string, identities: string) {
  if (identities) {
    try {
      const parsed = JSON.parse(identities)
      if (Array.isArray(parsed) && parsed[0]?.providerName) {
        return String(parsed[0].providerName).toLowerCase()
      }
    } catch {
      // ignore
    }
  }
  if (username.startsWith("google_")) return "google"
  if (username.startsWith("apple_")) return "apple"
  return "cognito"
}

export default function ManageCognitoPage() {
  const [rows, setRows] = useState<CognitoUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError("")
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()
      if (!idToken) {
        throw new Error("Missing session token")
      }

      const response = await fetch(outputs.data.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken,
        },
        body: JSON.stringify({ query: adminListCognitoUsersQuery }),
      })

      const json = (await response.json()) as GraphQLResponse<{
        adminListCognitoUsers?: { users?: any[] | null } | null
      }>
      if (!response.ok || json.errors?.length) {
        throw new Error(json.errors?.[0]?.message || "Unable to load Cognito users")
      }

      const nextRows = (json.data?.adminListCognitoUsers?.users || []).map((user: any) => ({
        username: user.username,
        name:
          user.name ||
          [user.givenName, user.familyName].filter(Boolean).join(" ").trim() ||
          user.email ||
          user.phone ||
          user.username,
        email: user.email || "—",
        phone: user.phone || "—",
        provider: deriveProvider(user.username, user.identities || ""),
        groups: Array.isArray(user.groups) && user.groups.length ? user.groups.join(", ") : "—",
        status: user.status || "UNKNOWN",
        enabled: user.enabled ? "Enabled" : "Disabled",
        createdAt: user.createdAt || new Date().toISOString(),
      })) as CognitoUserRow[]

      setRows(nextRows)
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load Cognito users")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Cognito Users
          </h1>
          <p className="text-muted-foreground">Admin view of the real Cognito user pool.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button variant="outline" className="rounded-xl border-border/50" onClick={() => void loadUsers()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
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
            Loading Cognito users...
          </div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search Cognito users..."
            filterOptions={[
              {
                key: "provider",
                label: "Provider",
                options: [
                  { value: "cognito", label: "Cognito" },
                  { value: "google", label: "Google" },
                  { value: "apple", label: "Apple" },
                ],
              },
              {
                key: "enabled",
                label: "Enabled",
                options: [
                  { value: "Enabled", label: "Enabled" },
                  { value: "Disabled", label: "Disabled" },
                ],
              },
            ]}
            actions={() => (
              <DropdownMenuItem className="rounded-lg">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            )}
          />
        )}
      </motion.div>

      <div className="rounded-xl border border-border/50 bg-card/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="h-4 w-4" />
          Cognito source of truth
        </div>
        <p className="mt-2">
          This page reads directly from the Cognito user pool. It is separate from `dashboard/users`,
          which shows app-level users from the `User` table.
        </p>
      </div>
    </div>
  )
}
