"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { fetchAuthSession } from "aws-amplify/auth"
import outputs from "@/amplify_outputs.json"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2, Clock, ChevronDown, ChevronUp } from "lucide-react"

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

type ValuableRecord = {
  id: string
  ownerId: string
  name: string
  category?: string | null
  qrCodeId?: string | null
}

type QrCodeRecord = {
  code: string
  valuableId?: string | null
  label?: string | null
}

type ScanRecord = {
  id: string
  qrCodeId: string
  valuableId?: string | null
  scannedAt: string
  locationText?: string | null
  finderContact?: string | null
  finderMessage?: string | null
  channel?: "CALL" | "MESSAGE" | "UNKNOWN" | null
  resolved?: boolean | null
}

type MessageRecord = {
  id: string
  valuableId: string
  finderContact?: string | null
  content: string
  channel?: string | null
  createdAt?: string | null
  status?: string | null
}

type AccessRecord = {
  valuableId: string
  canViewScanInfo?: boolean | null
  canReceiveNotifications?: boolean | null
}

type UserRecord = {
  cognitoId: string
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

type ActivityRow = {
  id: string
  itemName: string
  qrId: string
  location: string
  contact: string
  contactFull: string
  action: "scan" | "call" | "message"
  timestamp: string
  status: string
  details: string
  detailsFull: string
  ownerLabel: string
  relation: "own" | "shared"
}

const valuablesByOwnerQuery = /* GraphQL */ `
  query ValuablesByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    ValuablesByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        ownerId
        name
        category
        qrCodeId
      }
    }
  }
`

const qrCodesByOwnerQuery = /* GraphQL */ `
  query QrCodesByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    QrCodesByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        code
        valuableId
        label
      }
    }
  }
`

const qrCodesByValuableQuery = /* GraphQL */ `
  query QrCodesByValuable($valuableId: ID!, $limit: Int) {
    QrCodesByValuable(valuableId: $valuableId, limit: $limit) {
      items {
        code
        valuableId
        label
      }
    }
  }
`

const scansByOwnerQuery = /* GraphQL */ `
  query ScansByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    ScansByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        qrCodeId
        valuableId
        scannedAt
        locationText
        finderContact
        finderMessage
        channel
        resolved
      }
    }
  }
`

const scansByValuableQuery = /* GraphQL */ `
  query ScansByValuable($valuableId: ID!, $limit: Int) {
    ScansByValuable(valuableId: $valuableId, limit: $limit) {
      items {
        id
        qrCodeId
        valuableId
        scannedAt
        locationText
        finderContact
        finderMessage
        channel
        resolved
      }
    }
  }
`

const messagesByOwnerQuery = /* GraphQL */ `
  query MessagesByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    MessagesByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        valuableId
        finderContact
        content
        channel
        createdAt
        status
      }
    }
  }
`

const messagesByValuableQuery = /* GraphQL */ `
  query MessagesByValuable($valuableId: ID!, $limit: Int) {
    MessagesByValuable(valuableId: $valuableId, limit: $limit) {
      items {
        id
        valuableId
        finderContact
        content
        channel
        createdAt
        status
      }
    }
  }
`

const valuableAccessByGranteeQuery = /* GraphQL */ `
  query ValuableAccessByGranteeActivity($granteeUserId: ID!, $limit: Int) {
    ValuableAccessByGrantee(granteeUserId: $granteeUserId, limit: $limit) {
      items {
        valuableId
        canViewScanInfo
        canReceiveNotifications
      }
    }
  }
`

const getValuableQuery = /* GraphQL */ `
  query GetValuableActivity($id: ID!) {
    getValuable(id: $id) {
      id
      ownerId
      name
      category
      qrCodeId
    }
  }
`

const getUserQuery = /* GraphQL */ `
  query GetUserActivity($cognitoId: ID!) {
    getUser(cognitoId: $cognitoId) {
      cognitoId
      displayName
      firstName
      lastName
      email
    }
  }
`

async function runAuthenticatedGraphQL<T>(accessToken: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(outputs.data.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
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

function truncate(value?: string | null, max = 60) {
  if (!value) return "-"
  return value.length > max ? `${value.slice(0, max - 1)}...` : value
}

function formatStatus(status?: string | null, resolved?: boolean | null) {
  if (resolved) return "RESOLVED"
  return status || "OPEN"
}

function getUserLabel(user?: UserRecord | null) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  return user?.displayName || fullName || user?.email || user?.cognitoId || "Owner"
}

export default function ActivityPage() {
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [ownerId, setOwnerId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([])

  const toggleExpanded = (rowId: string) => {
    setExpandedRowIds((current) =>
      current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId],
    )
  }

  const columns = useMemo<Column<ActivityRow>[]>(
    () => [
      {
        key: "timestamp",
        title: "Time",
        sortable: true,
        render: (value) => {
          const date = new Date(String(value))
          return (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm">{date.toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</p>
              </div>
            </div>
          )
        },
      },
      {
        key: "itemName",
        title: "Item",
        sortable: true,
        render: (_, row) => (
          <div>
            <p className="font-medium">{row.itemName}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.qrId}</p>
            <p className="text-xs text-muted-foreground">
              {row.relation === "shared" ? `Shared by ${row.ownerLabel}` : "Your item"}
            </p>
          </div>
        ),
      },
      {
        key: "action",
        title: "Action",
        sortable: true,
        render: (value) => {
          const action = value as ActivityRow["action"]
          const tone = {
            scan: "bg-secondary text-secondary-foreground",
            call: "bg-accent/20 text-accent",
            message: "bg-primary/20 text-primary",
          }
          const label = {
            scan: "Scanned",
            call: "Called",
            message: "Messaged",
          }
          return (
            <Badge variant="secondary" className={tone[action]}>
              {label[action]}
            </Badge>
          )
        },
      },
      {
        key: "location",
        title: "Location",
        sortable: true,
        render: (value) => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{String(value || "Unknown")}</span>
          </div>
        ),
      },
      {
        key: "contact",
        title: "Finder Contact",
        sortable: true,
        render: (_, row) => {
          const expanded = expandedRowIds.includes(row.id)
          return (
            <div className="space-y-2">
              <p className={`text-sm text-muted-foreground ${expanded ? "whitespace-pre-wrap break-words" : ""}`}>
                {expanded ? row.contactFull : row.contact}
              </p>
              {row.contactFull && row.contactFull !== "Not shared" ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-primary"
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleExpanded(row.id)
                  }}
                >
                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {expanded ? "Collapse" : "Expand"}
                </button>
              ) : null}
            </div>
          )
        },
      },
      {
        key: "details",
        title: "Details",
        render: (_, row) => {
          const expanded = expandedRowIds.includes(row.id)
          return (
            <div className="space-y-2">
              <p className={`text-sm ${expanded ? "whitespace-pre-wrap break-words" : ""}`}>
                {expanded ? row.detailsFull || "-" : row.details || "-"}
              </p>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">{row.status}</p>
                {row.detailsFull && row.detailsFull !== row.details ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-primary"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleExpanded(row.id)
                    }}
                  >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {expanded ? "Show less" : "Show full text"}
                  </button>
                ) : null}
              </div>
            </div>
          )
        },
      },
    ],
    [expandedRowIds],
  )

  useEffect(() => {
    let active = true

    const loadActivity = async () => {
      try {
        setIsLoading(true)
        setError("")

        const session = await fetchAuthSession()
        const sub = session.tokens?.idToken?.payload?.sub as string | undefined
        const accessToken = session.tokens?.accessToken?.toString() || ""
        if (!sub || !accessToken) {
          throw new Error("User session was not available")
        }

        if (active) {
          setOwnerId(sub)
        }

        const [valuableData, qrData, scanData, messageData, accessData] = await Promise.all([
          runAuthenticatedGraphQL<{ ValuablesByOwner: { items: ValuableRecord[] } }>(accessToken, valuablesByOwnerQuery, {
            ownerId: sub,
            limit: 200,
          }),
          runAuthenticatedGraphQL<{ QrCodesByOwner: { items: QrCodeRecord[] } }>(accessToken, qrCodesByOwnerQuery, {
            ownerId: sub,
            limit: 200,
          }),
          runAuthenticatedGraphQL<{ ScansByOwner: { items: ScanRecord[] } }>(accessToken, scansByOwnerQuery, {
            ownerId: sub,
            limit: 200,
          }),
          runAuthenticatedGraphQL<{ MessagesByOwner: { items: MessageRecord[] } }>(accessToken, messagesByOwnerQuery, {
            ownerId: sub,
            limit: 200,
          }),
          runAuthenticatedGraphQL<{ ValuableAccessByGrantee: { items: AccessRecord[] } }>(accessToken, valuableAccessByGranteeQuery, {
            granteeUserId: sub,
            limit: 200,
          }),
        ])

        const valuables = valuableData.ValuablesByOwner.items || []
        const qrCodes = qrData.QrCodesByOwner.items || []
        const scans = scanData.ScansByOwner.items || []
        const messages = messageData.MessagesByOwner.items || []
        const accessItems = accessData.ValuableAccessByGrantee.items || []

        const valuableById = new Map(valuables.map((valuable) => [valuable.id, valuable]))
        const qrByCode = new Map(qrCodes.map((qr) => [qr.code, qr]))
        const qrCodeByValuableId = new Map(qrCodes.filter((qr) => qr.valuableId).map((qr) => [qr.valuableId as string, qr.code]))
        const ownerLabelByValuableId = new Map<string, string>()
        const relationByValuableId = new Map<string, "own" | "shared">()

        for (const valuable of valuables) {
          ownerLabelByValuableId.set(valuable.id, "You")
          relationByValuableId.set(valuable.id, "own")
        }

        const sharedValuableIds = Array.from(
          new Set(accessItems.map((item) => item.valuableId).filter(Boolean)),
        )

        for (const valuableId of sharedValuableIds) {
          const access = accessItems.find((entry) => entry.valuableId === valuableId)
          if (!access || (!access.canViewScanInfo && !access.canReceiveNotifications)) {
            continue
          }

          const valuableResponse = await runAuthenticatedGraphQL<{ getValuable: ValuableRecord | null }>(accessToken, getValuableQuery, { id: valuableId })
          const valuable = valuableResponse.getValuable
          if (!valuable) continue

          valuableById.set(valuable.id, valuable)
          relationByValuableId.set(valuable.id, "shared")

          const [qrResponse, ownerResponse] = await Promise.all([
            runAuthenticatedGraphQL<{ QrCodesByValuable: { items: QrCodeRecord[] } }>(accessToken, qrCodesByValuableQuery, {
              valuableId: valuable.id,
              limit: 20,
            }),
            runAuthenticatedGraphQL<{ getUser: UserRecord | null }>(accessToken, getUserQuery, {
              cognitoId: valuable.ownerId,
            }),
          ])

          const qr = qrResponse.QrCodesByValuable.items?.[0]
          if (qr) {
            qrCodes.push(qr)
            qrByCode.set(qr.code, qr)
            qrCodeByValuableId.set(valuable.id, qr.code)
          }
          ownerLabelByValuableId.set(valuable.id, getUserLabel(ownerResponse.getUser))

          if (access.canViewScanInfo) {
            const sharedScans = await runAuthenticatedGraphQL<{ ScansByValuable: { items: ScanRecord[] } }>(accessToken, scansByValuableQuery, {
              valuableId: valuable.id,
              limit: 200,
            })
            scans.push(...(sharedScans.ScansByValuable.items || []))
          }

          if (access.canReceiveNotifications) {
            const sharedMessages = await runAuthenticatedGraphQL<{ MessagesByValuable: { items: MessageRecord[] } }>(accessToken, messagesByValuableQuery, {
              valuableId: valuable.id,
              limit: 200,
            })
            messages.push(...(sharedMessages.MessagesByValuable.items || []))
          }
        }

        const nextRows: ActivityRow[] = []

        for (const scan of scans) {
          const valuable =
            (scan.valuableId ? valuableById.get(scan.valuableId) : undefined) ||
            (scan.qrCodeId ? valuableById.get(qrByCode.get(scan.qrCodeId)?.valuableId || "") : undefined)
          if (!valuable) continue

          const qrCode = scan.qrCodeId || valuable.qrCodeId || qrCodeByValuableId.get(valuable.id) || "-"
          const itemName = valuable.name || qrByCode.get(qrCode)?.label || "Registered item"
          const action: ActivityRow["action"] = scan.channel === "CALL" ? "call" : "scan"
          if (scan.channel === "MESSAGE") continue

          nextRows.push({
            id: `scan-${scan.id}`,
            itemName,
            qrId: qrCode,
            location: scan.locationText || "Unknown",
            contact: scan.finderContact || "Not shared",
            contactFull: scan.finderContact || "Not shared",
            action,
            timestamp: scan.scannedAt,
            status: formatStatus(undefined, scan.resolved),
            details: truncate(action === "call" ? "Finder started a live call" : scan.finderMessage || "QR code scanned"),
            detailsFull: action === "call" ? "Finder started a live call" : scan.finderMessage || "QR code scanned",
            ownerLabel: ownerLabelByValuableId.get(valuable.id) || "Owner",
            relation: relationByValuableId.get(valuable.id) || "own",
          })
        }

        for (const message of messages) {
          const valuable = valuableById.get(message.valuableId)
          if (!valuable) continue

          nextRows.push({
            id: `message-${message.id}`,
            itemName: valuable.name || "Registered item",
            qrId: valuable.qrCodeId || qrCodeByValuableId.get(message.valuableId) || "-",
            location: "Unknown",
            contact: message.finderContact || "Not shared",
            contactFull: message.finderContact || "Not shared",
            action: "message",
            timestamp: message.createdAt || new Date(0).toISOString(),
            status: formatStatus(message.status, false),
            details: truncate(message.content),
            detailsFull: message.content,
            ownerLabel: ownerLabelByValuableId.get(valuable.id) || "Owner",
            relation: relationByValuableId.get(valuable.id) || "own",
          })
        }

        nextRows.sort((left, right) => right.timestamp.localeCompare(left.timestamp))

        if (active) {
          setRows(nextRows)
        }
      } catch (loadError: any) {
        if (active) {
          setError(loadError?.message || "Unable to load activity")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadActivity()

    return () => {
      active = false
    }
  }, [])

  const todaysScans = useMemo(() => {
    const today = new Date().toDateString()
    return rows.filter((row) => row.action === "scan" && new Date(row.timestamp).toDateString() === today).length
  }, [rows])

  const contactAttempts = useMemo(
    () => rows.filter((row) => row.action === "call" || row.action === "message").length,
    [rows],
  )

  const uniqueLocations = useMemo(() => {
    return new Set(
      rows
        .map((row) => row.location)
        .filter((location) => location && location !== "Unknown"),
    ).size
  }, [rows])

  const exportCsv = () => {
    const header = ["Timestamp", "Action", "Item", "Shared By", "QR Code", "Location", "Contact", "Status", "Details"]
    const lines = rows.map((row) =>
      [
        row.timestamp,
        row.action,
        row.itemName,
        row.relation === "shared" ? row.ownerLabel : "",
        row.qrId,
        row.location,
        row.contactFull,
        row.status,
        row.detailsFull.replace(/"/g, '""'),
      ]
        .map((value) => `"${String(value)}"`)
        .join(","),
    )

    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `activity-${ownerId.slice(0, 8) || "user"}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Scan Activity
          </h1>
          <p className="text-muted-foreground">Track scans, finder contacts, and live call attempts for your items and items shared with you.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button
            variant="outline"
            className="rounded-xl border-border/50"
            onClick={exportCsv}
            disabled={!rows.length}
          >
            Export CSV
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Today's Scans</p>
          <p className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {todaysScans}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Contact Attempts</p>
          <p className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {contactAttempts}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Unique Locations</p>
          <p className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {uniqueLocations}
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/50 bg-card/30 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading activity...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <DataTable
            data={rows}
            columns={columns}
            searchKey="itemName"
            searchPlaceholder="Search activity..."
            filterOptions={[
              {
                key: "action",
                label: "Action",
                options: [
                  { value: "scan", label: "Scanned" },
                  { value: "call", label: "Called" },
                  { value: "message", label: "Messaged" },
                ],
              },
              {
                key: "relation",
                label: "Access",
                options: [
                  { value: "own", label: "My items" },
                  { value: "shared", label: "Shared with me" },
                ],
              },
            ]}
          />
        </motion.div>
      )}
    </div>
  )
}
