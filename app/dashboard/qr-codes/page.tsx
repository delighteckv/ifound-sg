"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { fetchAuthSession } from "aws-amplify/auth"
import outputs from "@/amplify_outputs.json"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Eye,
  Download,
  QrCode,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Pencil,
  Loader2,
} from "lucide-react"

type QRRow = {
  id: string
  itemName: string
  category: string
  owner: string
  status: "active" | "inactive"
  scans: number
  lastScanned: string | null
  createdAt: string
  description?: string
  valuableId?: string
}

type FormState = {
  itemName: string
  category: string
  description: string
}

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

const CATEGORIES = [
  { value: "Electronics", label: "Electronics" },
  { value: "Accessories", label: "Accessories" },
  { value: "Bags", label: "Bags" },
  { value: "Keys", label: "Keys" },
  { value: "Documents", label: "Documents" },
  { value: "Other", label: "Other" },
] as const

const initialForm: FormState = {
  itemName: "",
  category: "",
  description: "",
}

const qrCodesByOwnerQuery = /* GraphQL */ `
  query QrCodesByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    QrCodesByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        code
        ownerId
        valuableId
        status
        label
        createdAt
      }
      nextToken
    }
  }
`

const valuablesByOwnerQuery = /* GraphQL */ `
  query ValuablesByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    ValuablesByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        ownerId
        name
        description
        category
        status
        qrCodeId
        qrCodeValue
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`

const scansByOwnerQuery = /* GraphQL */ `
  query ScansByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    ScansByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        qrCodeId
        scannedAt
      }
      nextToken
    }
  }
`

const createValuableMutation = /* GraphQL */ `
  mutation CreateValuable($input: CreateValuableInput!) {
    createValuable(input: $input) {
      id
      ownerId
      name
      description
      category
      status
      qrCodeId
      qrCodeValue
      createdAt
    }
  }
`

const createQrCodeMutation = /* GraphQL */ `
  mutation CreateQrCode($input: CreateQrCodeInput!) {
    createQrCode(input: $input) {
      code
      ownerId
      valuableId
      status
      label
      createdAt
    }
  }
`

const updateValuableMutation = /* GraphQL */ `
  mutation UpdateValuable($input: UpdateValuableInput!) {
    updateValuable(input: $input) {
      id
      name
      description
      category
      status
      qrCodeId
      qrCodeValue
      updatedAt
    }
  }
`

const updateQrCodeMutation = /* GraphQL */ `
  mutation UpdateQrCode($input: UpdateQrCodeInput!) {
    updateQrCode(input: $input) {
      code
      status
      label
      valuableId
      ownerId
      createdAt
    }
  }
`

const deleteQrCodeMutation = /* GraphQL */ `
  mutation DeleteQrCode($input: DeleteQrCodeInput!) {
    deleteQrCode(input: $input) {
      code
    }
  }
`

const deleteValuableMutation = /* GraphQL */ `
  mutation DeleteValuable($input: DeleteValuableInput!) {
    deleteValuable(input: $input) {
      id
    }
  }
`

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": outputs.data.api_key,
  }
}

async function runGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
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

function normalizeQrStatus(status?: string): QRRow["status"] {
  return status === "ASSIGNED" ? "active" : "inactive"
}

function toQrBackendStatus(status: QRRow["status"]) {
  return status === "active" ? "ASSIGNED" : "RETIRED"
}

function buildQrCodeValue(ownerId: string, code: string) {
  return `${window.location.origin}/found/${encodeURIComponent(code)}`
}

function generateQrCodeCode() {
  return `QR-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`
}

function qrAssetPath(code: string) {
  return `public/qr-codes/${code}.png`
}

async function uploadQrPng(code: string, payload: string) {
  const response = await fetch("/api/qr/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, payload }),
  })

  const json = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(json?.error || "Unable to upload QR image")
  }

  return json as { path: string; publicUrl: string }
}

export default function QRCodesPage() {
  const [ownerId, setOwnerId] = useState("")
  const [ownerLabel, setOwnerLabel] = useState("You")
  const [rows, setRows] = useState<QRRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [selectedRow, setSelectedRow] = useState<QRRow | null>(null)

  const columns: Column<QRRow>[] = useMemo(
    () => [
      {
        key: "id",
        title: "ID",
        sortable: true,
        render: (value) => (
          <span className="font-mono text-sm text-muted-foreground">{value as string}</span>
        ),
      },
      {
        key: "itemName",
        title: "Item",
        sortable: true,
        render: (_, row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{row.itemName}</p>
              <p className="text-xs text-muted-foreground">{row.category || "Uncategorized"}</p>
            </div>
          </div>
        ),
      },
      {
        key: "owner",
        title: "Owner",
        sortable: true,
      },
      {
        key: "status",
        title: "Status",
        sortable: true,
        render: (value) => {
          const status = value as QRRow["status"]
          return (
            <Badge
              variant="secondary"
              className={
                status === "active"
                  ? "bg-accent/20 text-accent"
                  : "bg-muted text-muted-foreground"
              }
            >
              {status === "active" ? "Active" : "Inactive"}
            </Badge>
          )
        },
      },
      {
        key: "scans",
        title: "Scans",
        sortable: true,
      },
      {
        key: "lastScanned",
        title: "Last Scanned",
        sortable: true,
        render: (value) =>
          value ? new Date(value as string).toLocaleDateString() : "Never",
      },
      {
        key: "createdAt",
        title: "Created",
        sortable: true,
        render: (value) => new Date(value as string).toLocaleDateString(),
      },
    ],
    [],
  )

  const loadRows = async (
    currentOwnerId: string,
    currentOwnerLabel: string,
  ) => {
    setIsLoading(true)
    setError("")
    try {
      const [qrData, valuableData, scanData] = await Promise.all([
        runGraphQL<{
          QrCodesByOwner: {
            items: Array<{
              code: string
              ownerId?: string
              valuableId?: string
              status?: string
              label?: string
              createdAt?: string
            }>
          }
        }>(qrCodesByOwnerQuery, { ownerId: currentOwnerId, limit: 200 }),
        runGraphQL<{
          ValuablesByOwner: {
            items: Array<{
              id: string
              name?: string
              description?: string
              category?: string
              status?: string
              qrCodeId?: string
              qrCodeValue?: string
              createdAt?: string
            }>
          }
        }>(valuablesByOwnerQuery, { ownerId: currentOwnerId, limit: 200 }),
        runGraphQL<{
          ScansByOwner: {
            items: Array<{
              qrCodeId?: string
              scannedAt?: string
            }>
          }
        }>(scansByOwnerQuery, { ownerId: currentOwnerId, limit: 500 }),
      ])

      const valuableById = new Map(
        valuableData.ValuablesByOwner.items.map((item) => [item.id, item]),
      )

      const scanStats = new Map<string, { scans: number; lastScanned: string | null }>()
      for (const scan of scanData.ScansByOwner.items) {
        const key = scan.qrCodeId
        if (!key) continue
        const current = scanStats.get(key) ?? { scans: 0, lastScanned: null }
        current.scans += 1
        if (!current.lastScanned || (scan.scannedAt && scan.scannedAt > current.lastScanned)) {
          current.lastScanned = scan.scannedAt ?? current.lastScanned
        }
        scanStats.set(key, current)
      }

      const nextRows = qrData.QrCodesByOwner.items.map((qr) => {
        const valuable = qr.valuableId ? valuableById.get(qr.valuableId) : undefined
        const stats = scanStats.get(qr.code) ?? { scans: 0, lastScanned: null }

        return {
          id: qr.code,
          itemName: valuable?.name || qr.label || "Untitled item",
          category: valuable?.category || "Other",
          owner: currentOwnerLabel,
          status: normalizeQrStatus(qr.status),
          scans: stats.scans,
          lastScanned: stats.lastScanned,
          createdAt: qr.createdAt || valuable?.createdAt || new Date().toISOString(),
          description: valuable?.description || "",
          valuableId: qr.valuableId,
        } satisfies QRRow
      })

      setRows(nextRows)
    } catch (err: any) {
      setError(err?.message || "Unable to load QR codes")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      try {
        const session = await fetchAuthSession()
        const payload = session.tokens?.idToken?.payload
        const sub = payload?.sub as string | undefined
        const email = payload?.email as string | undefined
        const name = payload?.name as string | undefined
        const label = name || email || "You"

        if (!sub) {
          setError("Owner identity is missing")
          setIsLoading(false)
          return
        }

        setOwnerId(sub)
        setOwnerLabel(label)
        await loadRows(sub, label)
      } catch (err: any) {
        setError(err?.message || "Unable to initialize QR codes")
        setIsLoading(false)
      }
    }
    run()
  }, [])

  const resetForm = () => {
    setForm(initialForm)
    setSelectedRow(null)
  }

  const openEdit = (row: QRRow) => {
    setSelectedRow(row)
    setForm({
      itemName: row.itemName,
      category: row.category,
      description: row.description || "",
    })
    setIsEditOpen(true)
    setError("")
    setSuccess("")
  }

  const handleCreate = async () => {
    if (!ownerId || !form.itemName.trim() || !form.category) {
      setError("Item name and category are required")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const code = generateQrCodeCode()
      const qrValue = buildQrCodeValue(ownerId, code)

      const valuableResult = await runGraphQL<{
        createValuable: { id: string }
      }>(createValuableMutation, {
          input: {
            ownerId,
            name: form.itemName.trim(),
            description: form.description.trim() || null,
            category: form.category,
            status: "ACTIVE",
            qrCodeValue: qrValue,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })

      await runGraphQL(createQrCodeMutation, {
          input: {
            code,
            ownerId,
            valuableId: valuableResult.createValuable.id,
            status: "ASSIGNED",
            label: form.itemName.trim(),
            createdAt: new Date().toISOString(),
          },
        })

      await runGraphQL(updateValuableMutation, {
          input: {
            id: valuableResult.createValuable.id,
            qrCodeId: code,
            qrCodeValue: qrValue,
            updatedAt: new Date().toISOString(),
          },
        })

      await uploadQrPng(code, qrValue)

      setSuccess("QR code created")
      setIsCreateOpen(false)
      resetForm()
      await loadRows(ownerId, ownerLabel)
    } catch (err: any) {
      setError(err?.message || "Unable to create QR code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedRow?.valuableId || !form.itemName.trim() || !form.category) {
      setError("Item name and category are required")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      await Promise.all([
        runGraphQL(updateValuableMutation, {
            input: {
              id: selectedRow.valuableId,
              name: form.itemName.trim(),
              description: form.description.trim() || null,
              category: form.category,
              updatedAt: new Date().toISOString(),
            },
          }),
        runGraphQL(updateQrCodeMutation, {
            input: {
              code: selectedRow.id,
              label: form.itemName.trim(),
            },
          }),
      ])

      setSuccess("QR code updated")
      setIsEditOpen(false)
      resetForm()
      await loadRows(ownerId, ownerLabel)
    } catch (err: any) {
      setError(err?.message || "Unable to update QR code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (row: QRRow) => {
    setError("")
    setSuccess("")
    try {
      const nextStatus: QRRow["status"] = row.status === "active" ? "inactive" : "active"
      await runGraphQL(updateQrCodeMutation, {
          input: {
            code: row.id,
            status: toQrBackendStatus(nextStatus),
          },
        })
      if (row.valuableId) {
        await runGraphQL(updateValuableMutation, {
            input: {
              id: row.valuableId,
              status: nextStatus === "active" ? "ACTIVE" : "ARCHIVED",
              updatedAt: new Date().toISOString(),
            },
          })
      }
      setSuccess(`QR code ${nextStatus === "active" ? "activated" : "deactivated"}`)
      await loadRows(ownerId, ownerLabel)
    } catch (err: any) {
      setError(err?.message || "Unable to update status")
    }
  }

  const handleDelete = async (row: QRRow) => {
    setError("")
    setSuccess("")
    try {
      await runGraphQL(deleteQrCodeMutation, {
          input: {
            code: row.id,
          },
        })

      if (row.valuableId) {
        await runGraphQL(deleteValuableMutation, {
            input: {
              id: row.valuableId,
            },
          })
      }

      setSuccess("QR code deleted")
      await loadRows(ownerId, ownerLabel)
    } catch (err: any) {
      setError(err?.message || "Unable to delete QR code")
    }
  }

  const handleDownload = (row: QRRow) => {
    void (async () => {
      try {
        const payload = `${window.location.origin}/found/${encodeURIComponent(row.id)}`
        await uploadQrPng(row.id, payload)
        const result = await uploadQrPng(row.id, payload)
        window.open(result.publicUrl, "_blank", "noopener,noreferrer")
      } catch (err: any) {
        setError(err?.message || "Unable to download QR code")
      }
    })()
  }

  const currentDialogTitle = selectedRow ? "Edit QR Code" : "Generate New QR Code"

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            QR Codes
          </h1>
          <p className="text-muted-foreground">
            Manage QR codes and track their activity
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Generate QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
                  Generate New QR Code
                </DialogTitle>
                <DialogDescription>
                  Create a new QR code for your item
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={form.itemName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, itemName: event.target.value }))
                    }
                    placeholder="e.g., MacBook Pro"
                    className="h-11 rounded-xl border-border/50 bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, category: value }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-border/50 bg-secondary/50">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CATEGORIES.map((category) => (
                        <SelectItem
                          key={category.value}
                          value={category.value}
                        >
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Brief description..."
                    className="h-11 rounded-xl border-border/50 bg-secondary/50"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Generate QR Code"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {(error || success) && (
        <div className="space-y-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DataTable
          data={rows}
          columns={columns}
          searchKey="itemName"
          searchPlaceholder={isLoading ? "Loading QR codes..." : "Search QR codes..."}
          filterOptions={[
            {
              key: "category",
              label: "Category",
              options: CATEGORIES.map((category) => ({
                value: category.value,
                label: category.label,
              })),
            },
            {
              key: "status",
              label: "Status",
              options: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ],
            },
          ]}
          actions={(row) => (
            <>
              <DropdownMenuItem className="rounded-lg" onClick={() => openEdit(row)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg" onClick={() => openEdit(row)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg" onClick={() => handleDownload(row)}>
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg" onClick={() => handleToggleStatus(row)}>
                {row.status === "active" ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg text-destructive"
                onClick={() => handleDelete(row)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        />
      </motion.div>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
              {currentDialogTitle}
            </DialogTitle>
            <DialogDescription>
              Update the linked item details for this QR code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>QR Code ID</Label>
              <Input
                value={selectedRow?.id || ""}
                disabled
                className="h-11 rounded-xl border-border/50 bg-secondary/50 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                value={form.itemName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, itemName: event.target.value }))
                }
                className="h-11 rounded-xl border-border/50 bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, category: value }))
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-secondary/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="h-11 rounded-xl border-border/50 bg-secondary/50"
              />
            </div>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
