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
  Download,
  Loader2,
  PackagePlus,
  Pencil,
  Plus,
  Power,
  PowerOff,
  QrCode,
} from "lucide-react"

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

type QrRecord = {
  code: string
  packId?: string | null
  packSize?: number | null
  packPosition?: number | null
  batchLabel?: string | null
  generatedBy?: string | null
  ownerId?: string | null
  valuableId?: string | null
  status?: string | null
  label?: string | null
  assignedAt?: string | null
  registeredAt?: string | null
  createdAt?: string | null
}

type ValuableRecord = {
  id: string
  ownerId: string
  name?: string | null
  description?: string | null
  category?: string | null
  status?: string | null
  qrCodeId?: string | null
  qrCodeValue?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type ScanRecord = {
  qrCodeId?: string | null
  scannedAt?: string | null
}

type QRRow = {
  id: string
  itemName: string
  category: string
  owner: string
  status: "active" | "inactive" | "unassigned"
  scans: number
  lastScanned: string | null
  createdAt: string
  description?: string
  valuableId?: string
  packId?: string
  packLabel?: string
}

type ItemFormState = {
  qrCode: string
  itemName: string
  category: string
  description: string
}

type PackFormState = {
  packSize: "4" | "10"
  packsCount: string
  batchLabel: string
}

const CATEGORIES = [
  { value: "Electronics", label: "Electronics" },
  { value: "Accessories", label: "Accessories" },
  { value: "Bags", label: "Bags" },
  { value: "Keys", label: "Keys" },
  { value: "Documents", label: "Documents" },
  { value: "Vehicle", label: "Vehicle" },
  { value: "Other", label: "Other" },
] as const

const qrCodesByOwnerQuery = /* GraphQL */ `
  query QrCodesByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    QrCodesByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        code
        packId
        packSize
        packPosition
        batchLabel
        generatedBy
        ownerId
        valuableId
        status
        label
        assignedAt
        registeredAt
        createdAt
      }
    }
  }
`

const qrCodesByStatusQuery = /* GraphQL */ `
  query QrCodesByStatus($status: QrStatus!, $limit: Int, $nextToken: String) {
    QrCodesByStatus(status: $status, limit: $limit, nextToken: $nextToken) {
      items {
        code
        packId
        packSize
        packPosition
        batchLabel
        generatedBy
        ownerId
        valuableId
        status
        label
        assignedAt
        registeredAt
        createdAt
      }
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
    }
  }
`

const scansByOwnerQuery = /* GraphQL */ `
  query ScansByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    ScansByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        qrCodeId
        scannedAt
      }
    }
  }
`

const getQrCodeQuery = /* GraphQL */ `
  query GetQrCode($code: String!) {
    getQrCode(code: $code) {
      code
      packId
      packSize
      packPosition
      batchLabel
      generatedBy
      ownerId
      valuableId
      status
      label
      assignedAt
      registeredAt
      createdAt
    }
  }
`

const createValuableMutation = /* GraphQL */ `
  mutation CreateValuable($input: CreateValuableInput!) {
    createValuable(input: $input) {
      id
    }
  }
`

const createQrCodeMutation = /* GraphQL */ `
  mutation CreateQrCode($input: CreateQrCodeInput!) {
    createQrCode(input: $input) {
      code
    }
  }
`

const updateValuableMutation = /* GraphQL */ `
  mutation UpdateValuable($input: UpdateValuableInput!) {
    updateValuable(input: $input) {
      id
    }
  }
`

const updateQrCodeMutation = /* GraphQL */ `
  mutation UpdateQrCode($input: UpdateQrCodeInput!) {
    updateQrCode(input: $input) {
      code
    }
  }
`

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": outputs.data.api_key,
  }
}

async function runGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
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

function generateQrCodeCode() {
  return `QR-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`
}

function generatePackId() {
  return `PACK-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`
}

function buildQrCodeValue(code: string) {
  return `${window.location.origin}/found/${encodeURIComponent(code)}`
}

async function uploadQrPng(code: string, payload: string) {
  const response = await fetch("/api/qr/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, payload }),
  })
  const json = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(json?.error || "Unable to upload QR image")
  }
  return json as { publicUrl: string }
}

function statusFromQr(record: QrRecord): QRRow["status"] {
  if (record.status === "UNASSIGNED") return "unassigned"
  if (record.status === "RETIRED") return "inactive"
  return "active"
}

export default function QRCodesPage() {
  const [ownerId, setOwnerId] = useState("")
  const [ownerLabel, setOwnerLabel] = useState("You")
  const [isAdmin, setIsAdmin] = useState(false)
  const [rows, setRows] = useState<QRRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isPackOpen, setIsPackOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<QRRow | null>(null)
  const [itemForm, setItemForm] = useState<ItemFormState>({ qrCode: "", itemName: "", category: "", description: "" })
  const [packForm, setPackForm] = useState<PackFormState>({ packSize: "4", packsCount: "1", batchLabel: "" })

  const columns: Column<QRRow>[] = useMemo(
    () => [
      {
        key: "id",
        title: "QR Code",
        sortable: true,
        render: (_, row) => (
          <div>
            <p className="font-mono text-sm">{row.id}</p>
            <p className="text-xs text-muted-foreground">{row.packLabel || "Single QR"}</p>
          </div>
        ),
      },
      {
        key: "itemName",
        title: "Tagged To",
        sortable: true,
        render: (_, row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{row.itemName}</p>
              <p className="text-xs text-muted-foreground">{row.category}</p>
            </div>
          </div>
        ),
      },
      { key: "owner", title: "Owner", sortable: true },
      {
        key: "status",
        title: "Status",
        sortable: true,
        render: (value) => {
          const status = value as QRRow["status"]
          const colors = {
            active: "bg-accent/20 text-accent",
            inactive: "bg-muted text-muted-foreground",
            unassigned: "bg-primary/20 text-primary",
          }
          return (
            <Badge variant="secondary" className={colors[status]}>
              {status === "unassigned" ? "Unassigned" : status === "active" ? "Assigned" : "Retired"}
            </Badge>
          )
        },
      },
      { key: "scans", title: "Scans", sortable: true },
      {
        key: "lastScanned",
        title: "Last Scanned",
        sortable: true,
        render: (value) => (value ? new Date(value as string).toLocaleDateString() : "Never"),
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

  const loadRows = async (currentOwnerId: string, currentOwnerLabel: string, adminMode: boolean) => {
    setIsLoading(true)
    setError("")
    try {
      if (adminMode) {
        const [unassignedData, assignedData] = await Promise.all([
          runGraphQL<{ QrCodesByStatus: { items: QrRecord[] } }>(qrCodesByStatusQuery, { status: "UNASSIGNED", limit: 500 }),
          runGraphQL<{ QrCodesByStatus: { items: QrRecord[] } }>(qrCodesByStatusQuery, { status: "ASSIGNED", limit: 500 }),
        ])

        const nextRows = [...(unassignedData.QrCodesByStatus.items || []), ...(assignedData.QrCodesByStatus.items || [])]
          .map((qr) => ({
            id: qr.code,
            itemName: qr.label || (qr.status === "UNASSIGNED" ? "Awaiting registration" : "Registered item"),
            category: qr.status === "UNASSIGNED" ? "Inventory" : "Assigned",
            owner: qr.ownerId ? qr.ownerId.slice(0, 8) : "Not assigned",
            status: statusFromQr(qr),
            scans: 0,
            lastScanned: null,
            createdAt: qr.createdAt || new Date().toISOString(),
            description: "",
            valuableId: qr.valuableId || undefined,
            packId: qr.packId || undefined,
            packLabel: qr.packId ? `${qr.batchLabel || "Pack"} · ${qr.packId} · ${qr.packPosition || 1}/${qr.packSize || 1}` : undefined,
          }))
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

        setRows(nextRows)
        return
      }

      const [qrData, valuableData, scanData] = await Promise.all([
        runGraphQL<{ QrCodesByOwner: { items: QrRecord[] } }>(qrCodesByOwnerQuery, { ownerId: currentOwnerId, limit: 200 }),
        runGraphQL<{ ValuablesByOwner: { items: ValuableRecord[] } }>(valuablesByOwnerQuery, { ownerId: currentOwnerId, limit: 200 }),
        runGraphQL<{ ScansByOwner: { items: ScanRecord[] } }>(scansByOwnerQuery, { ownerId: currentOwnerId, limit: 500 }),
      ])

      const valuableById = new Map(valuableData.ValuablesByOwner.items.map((item) => [item.id, item]))
      const scanStats = new Map<string, { scans: number; lastScanned: string | null }>()

      for (const scan of scanData.ScansByOwner.items) {
        if (!scan.qrCodeId) continue
        const current = scanStats.get(scan.qrCodeId) ?? { scans: 0, lastScanned: null }
        current.scans += 1
        if (!current.lastScanned || (scan.scannedAt && scan.scannedAt > current.lastScanned)) {
          current.lastScanned = scan.scannedAt
        }
        scanStats.set(scan.qrCodeId, current)
      }

      const nextRows = qrData.QrCodesByOwner.items.map((qr) => {
        const valuable = qr.valuableId ? valuableById.get(qr.valuableId) : undefined
        const stats = scanStats.get(qr.code) ?? { scans: 0, lastScanned: null }
        return {
          id: qr.code,
          itemName: valuable?.name || qr.label || "Registered item",
          category: valuable?.category || "Other",
          owner: currentOwnerLabel,
          status: statusFromQr(qr),
          scans: stats.scans,
          lastScanned: stats.lastScanned,
          createdAt: qr.createdAt || valuable?.createdAt || new Date().toISOString(),
          description: valuable?.description || "",
          valuableId: qr.valuableId || undefined,
          packId: qr.packId || undefined,
          packLabel: qr.packId ? `${qr.batchLabel || "Pack"} · ${qr.packId} · ${qr.packPosition || 1}/${qr.packSize || 1}` : undefined,
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
        const groups = (payload?.["cognito:groups"] as string[] | undefined) ?? []
        const label = name || email || "You"

        if (!sub) {
          setError("User identity is missing")
          setIsLoading(false)
          return
        }

        const adminMode = groups.includes("Admin")
        setIsAdmin(adminMode)
        setOwnerId(sub)
        setOwnerLabel(label)
        await loadRows(sub, label, adminMode)
      } catch (err: any) {
        setError(err?.message || "Unable to initialize QR codes")
        setIsLoading(false)
      }
    }
    void run()
  }, [])

  const resetForms = () => {
    setItemForm({ qrCode: "", itemName: "", category: "", description: "" })
    setPackForm({ packSize: "4", packsCount: "1", batchLabel: "" })
    setSelectedRow(null)
  }

  const handleRegisterQr = async () => {
    if (!ownerId || !itemForm.qrCode.trim() || !itemForm.itemName.trim() || !itemForm.category) {
      setError("QR code, item name and category are required")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const normalizedCode = itemForm.qrCode.trim().toUpperCase()
      const qrLookup = await runGraphQL<{ getQrCode: QrRecord | null }>(getQrCodeQuery, { code: normalizedCode })

      if (!qrLookup.getQrCode) {
        throw new Error("This QR code does not exist")
      }
      if (qrLookup.getQrCode.status !== "UNASSIGNED" || qrLookup.getQrCode.ownerId) {
        throw new Error("This QR code has already been assigned")
      }

      const qrValue = buildQrCodeValue(normalizedCode)
      const valuableResult = await runGraphQL<{ createValuable: { id: string } }>(createValuableMutation, {
        input: {
          ownerId,
          name: itemForm.itemName.trim(),
          description: itemForm.description.trim() || null,
          category: itemForm.category,
          status: "ACTIVE",
          qrCodeValue: qrValue,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })

      await Promise.all([
        runGraphQL(updateQrCodeMutation, {
          input: {
            code: normalizedCode,
            ownerId,
            valuableId: valuableResult.createValuable.id,
            status: "ASSIGNED",
            label: itemForm.itemName.trim(),
            assignedAt: new Date().toISOString(),
            registeredAt: new Date().toISOString(),
          },
        }),
        runGraphQL(updateValuableMutation, {
          input: {
            id: valuableResult.createValuable.id,
            qrCodeId: normalizedCode,
            qrCodeValue: qrValue,
            updatedAt: new Date().toISOString(),
          },
        }),
      ])

      await uploadQrPng(normalizedCode, qrValue)
      setSuccess("QR code registered to your account")
      setIsRegisterOpen(false)
      resetForms()
      await loadRows(ownerId, ownerLabel, isAdmin)
    } catch (err: any) {
      setError(err?.message || "Unable to register QR code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGeneratePacks = async () => {
    const packSize = Number(packForm.packSize)
    const packsCount = Number(packForm.packsCount)
    if (!ownerId || !Number.isInteger(packSize) || ![4, 10].includes(packSize) || !Number.isInteger(packsCount) || packsCount < 1) {
      setError("Pack size must be 4 or 10, and pack count must be at least 1")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      for (let packNumber = 0; packNumber < packsCount; packNumber += 1) {
        const packId = generatePackId()
        const codes = Array.from({ length: packSize }, (_, index) => ({ code: generateQrCodeCode(), packPosition: index + 1 }))

        await Promise.all(
          codes.map(async (entry) => {
            await runGraphQL(createQrCodeMutation, {
              input: {
                code: entry.code,
                packId,
                packSize,
                packPosition: entry.packPosition,
                batchLabel: packForm.batchLabel.trim() || null,
                generatedBy: ownerId,
                status: "UNASSIGNED",
              },
            })
            await uploadQrPng(entry.code, buildQrCodeValue(entry.code))
          }),
        )
      }

      setSuccess(`Generated ${packsCount} pack${packsCount === 1 ? "" : "s"} of ${packSize}`)
      setIsPackOpen(false)
      resetForms()
      await loadRows(ownerId, ownerLabel, isAdmin)
    } catch (err: any) {
      setError(err?.message || "Unable to generate QR packs")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (row: QRRow) => {
    setSelectedRow(row)
    setItemForm({ qrCode: row.id, itemName: row.itemName, category: row.category, description: row.description || "" })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedRow?.valuableId || !itemForm.itemName.trim() || !itemForm.category) {
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
            name: itemForm.itemName.trim(),
            description: itemForm.description.trim() || null,
            category: itemForm.category,
            updatedAt: new Date().toISOString(),
          },
        }),
        runGraphQL(updateQrCodeMutation, {
          input: {
            code: selectedRow.id,
            label: itemForm.itemName.trim(),
          },
        }),
      ])
      setSuccess("QR registration updated")
      setIsEditOpen(false)
      resetForms()
      await loadRows(ownerId, ownerLabel, isAdmin)
    } catch (err: any) {
      setError(err?.message || "Unable to update QR code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (row: QRRow) => {
    if (row.status === "unassigned") return
    setError("")
    setSuccess("")
    try {
      const nextStatus = row.status === "active" ? "RETIRED" : "ASSIGNED"
      await runGraphQL(updateQrCodeMutation, { input: { code: row.id, status: nextStatus } })
      if (row.valuableId) {
        await runGraphQL(updateValuableMutation, {
          input: {
            id: row.valuableId,
            status: nextStatus === "ASSIGNED" ? "ACTIVE" : "ARCHIVED",
            updatedAt: new Date().toISOString(),
          },
        })
      }
      setSuccess(nextStatus === "ASSIGNED" ? "QR reactivated" : "QR retired")
      await loadRows(ownerId, ownerLabel, isAdmin)
    } catch (err: any) {
      setError(err?.message || "Unable to update status")
    }
  }

  const handleDownload = async (row: QRRow) => {
    try {
      const result = await uploadQrPng(row.id, buildQrCodeValue(row.id))
      window.open(result.publicUrl, "_blank", "noopener,noreferrer")
    } catch (err: any) {
      setError(err?.message || "Unable to download QR code")
    }
  }

  const title = isAdmin ? "QR Inventory" : "My QR Codes"
  const subtitle = isAdmin ? "Generate QR packs for customers and monitor assignment" : "Register valid QR codes from your pack and manage assigned items"

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2">
          {isAdmin ? (
            <Dialog open={isPackOpen} onOpenChange={setIsPackOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Generate QR Packs
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Generate QR Packs</DialogTitle>
                  <DialogDescription>Create packs of 4 or 10 QR codes for new customers.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Pack size</Label>
                    <Select value={packForm.packSize} onValueChange={(value: "4" | "10") => setPackForm((current) => ({ ...current, packSize: value }))}>
                      <SelectTrigger className="h-11 rounded-xl border-border/50 bg-secondary/50"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="4">Pack of 4</SelectItem>
                        <SelectItem value="10">Pack of 10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of packs</Label>
                    <Input value={packForm.packsCount} onChange={(event) => setPackForm((current) => ({ ...current, packsCount: event.target.value.replace(/[^0-9]/g, "") }))} className="h-11 rounded-xl border-border/50 bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch label</Label>
                    <Input value={packForm.batchLabel} onChange={(event) => setPackForm((current) => ({ ...current, batchLabel: event.target.value }))} placeholder="e.g. April Singapore Batch" className="h-11 rounded-xl border-border/50 bg-secondary/50" />
                  </div>
                  <Button onClick={handleGeneratePacks} disabled={isSubmitting} className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Packs"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Register QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Register QR Code</DialogTitle>
                  <DialogDescription>Enter a QR code from your pack and attach it to your item.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>QR Code</Label>
                    <Input value={itemForm.qrCode} onChange={(event) => setItemForm((current) => ({ ...current, qrCode: event.target.value.toUpperCase() }))} placeholder="QR-XXXXXXXXXXXX" className="h-11 rounded-xl border-border/50 bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tagged to</Label>
                    <Input value={itemForm.itemName} onChange={(event) => setItemForm((current) => ({ ...current, itemName: event.target.value }))} placeholder="e.g. MacBook Pro or Bicycle" className="h-11 rounded-xl border-border/50 bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={itemForm.category} onValueChange={(value) => setItemForm((current) => ({ ...current, category: value }))}>
                      <SelectTrigger className="h-11 rounded-xl border-border/50 bg-secondary/50"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CATEGORIES.map((category) => (<SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={itemForm.description} onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional notes" className="h-11 rounded-xl border-border/50 bg-secondary/50" />
                  </div>
                  <Button onClick={handleRegisterQr} disabled={isSubmitting} className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate & Register"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
      </div>

      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div> : null}
      {success ? <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent">{success}</div> : null}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="rounded-xl border border-border/50 bg-card/30 p-6 text-sm text-muted-foreground">Loading QR codes...</div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            searchKey="id"
            searchPlaceholder={isAdmin ? "Search QR inventory..." : "Search my QR codes..."}
            filterOptions={[
              {
                key: "status",
                label: "Status",
                options: [
                  { value: "unassigned", label: "Unassigned" },
                  { value: "active", label: "Assigned" },
                  { value: "inactive", label: "Retired" },
                ],
              },
            ]}
            actions={(row) => (
              <>
                <DropdownMenuItem className="rounded-lg" onClick={() => void handleDownload(row)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download QR
                </DropdownMenuItem>
                {!isAdmin && row.status !== "unassigned" ? (
                  <>
                    <DropdownMenuItem className="rounded-lg" onClick={() => openEdit(row)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Registration
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg" onClick={() => void handleToggleStatus(row)}>
                      {row.status === "active" ? (
                        <><PowerOff className="mr-2 h-4 w-4" />Retire QR</>
                      ) : (
                        <><Power className="mr-2 h-4 w-4" />Reactivate QR</>
                      )}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </>
            )}
          />
        )}
      </motion.div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Edit Registration</DialogTitle>
            <DialogDescription>Update what this QR code is attached to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>QR Code</Label>
              <Input value={itemForm.qrCode} disabled className="h-11 rounded-xl border-border/50 bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>Tagged to</Label>
              <Input value={itemForm.itemName} onChange={(event) => setItemForm((current) => ({ ...current, itemName: event.target.value }))} className="h-11 rounded-xl border-border/50 bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={itemForm.category} onValueChange={(value) => setItemForm((current) => ({ ...current, category: value }))}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CATEGORIES.map((category) => (<SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={itemForm.description} onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))} className="h-11 rounded-xl border-border/50 bg-secondary/50" />
            </div>
            <Button onClick={handleUpdate} disabled={isSubmitting} className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
