"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { fetchAuthSession } from "aws-amplify/auth"
import { getUrl, uploadData } from "aws-amplify/storage"
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
  Edit,
  Download,
  Loader2,
  PackagePlus,
  Pencil,
  Plus,
  Power,
  PowerOff,
  QrCode,
  ShieldPlus,
  Trash2,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

type QrRecord = {
  code: string
  qrImagePath?: string | null
  packId?: string | null
  packSize?: number | null
  packPosition?: number | null
  batchLabel?: string | null
  generatedBy?: string | null
  packOwnerId?: string | null
  packAssignedAt?: string | null
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
  serialNumber?: string | null
  description?: string | null
  category?: string | null
  status?: string | null
  qrCodeId?: string | null
  qrCodeValue?: string | null
  images?: (string | null)[] | null
  createdAt?: string | null
  updatedAt?: string | null
}

type ScanRecord = {
  qrCodeId?: string | null
  scannedAt?: string | null
}

type UserRecord = {
  cognitoId: string
  email?: string | null
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
}

type AccessRecord = {
  id: string
  ownerId: string
  valuableId: string
  granteeUserId: string
  granteeEmail?: string | null
  canViewScanInfo?: boolean | null
  canReceiveNotifications?: boolean | null
  canReceiveCalls?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
}

type AccessInviteRecord = {
  code: string
  ownerId: string
  valuableId: string
  canViewScanInfo?: boolean | null
  canReceiveNotifications?: boolean | null
  canReceiveCalls?: boolean | null
  status?: string | null
  createdByUserId?: string | null
  acceptedByUserId?: string | null
  createdAt?: string | null
  expiresAt?: string | null
  acceptedAt?: string | null
  rejectedAt?: string | null
  cancelledAt?: string | null
}

type QRRow = {
  id: string
  qrImagePath?: string | null
  itemName: string
  packPosition?: number | null
  packSize?: number | null
  serialNumber?: string
  category: string
  owner: string
  packOwnerId?: string | null
  status: "active" | "inactive" | "unassigned"
  scans: number
  lastScanned: string | null
  createdAt: string
  description?: string
  imagePath?: string | null
  valuableId?: string
  packId?: string
  packLabel?: string
}

type ItemFormState = {
  qrCode: string
  itemName: string
  serialNumber: string
  category: string
  description: string
}

type PackFormState = {
  packSize: "4" | "10"
  packsCount: string
  batchLabel: string
}

type AssignPackFormState = {
  packId: string
  ownerId: string
}

type AccessFormState = {
  canViewScanInfo: boolean
  canReceiveNotifications: boolean
  canReceiveCalls: boolean
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
        qrImagePath
        packId
        packSize
        packPosition
        batchLabel
        generatedBy
        packOwnerId
        packAssignedAt
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

const qrCodesByPackOwnerQuery = /* GraphQL */ `
  query QrCodesByPackOwner($packOwnerId: ID!, $limit: Int, $nextToken: String) {
    QrCodesByPackOwner(packOwnerId: $packOwnerId, limit: $limit, nextToken: $nextToken) {
      items {
        code
        qrImagePath
        packId
        packSize
        packPosition
        batchLabel
        generatedBy
        packOwnerId
        packAssignedAt
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
  query QrCodesByStatus($status: QrCodeStatus!, $limit: Int, $nextToken: String) {
    QrCodesByStatus(status: $status, limit: $limit, nextToken: $nextToken) {
      items {
        code
        qrImagePath
        packId
        packSize
        packPosition
        batchLabel
        generatedBy
        packOwnerId
        packAssignedAt
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

const qrCodesByPackQuery = /* GraphQL */ `
  query QrCodesByPack($packId: String!, $limit: Int, $nextToken: String) {
    QrCodesByPack(packId: $packId, limit: $limit, nextToken: $nextToken) {
      items {
        code
        qrImagePath
        packId
        packSize
        packPosition
        batchLabel
        generatedBy
        packOwnerId
        packAssignedAt
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
        serialNumber
        description
        category
        status
        qrCodeId
        qrCodeValue
        images
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

const usersByRoleQuery = /* GraphQL */ `
  query UsersByRole($role: UserRole!, $limit: Int, $nextToken: String) {
    UsersByRole(role: $role, limit: $limit, nextToken: $nextToken) {
      items {
        cognitoId
        email
        displayName
        firstName
        lastName
      }
    }
  }
`

const valuableAccessByValuableQuery = /* GraphQL */ `
  query ValuableAccessByValuable($valuableId: ID!, $limit: Int) {
    ValuableAccessByValuable(valuableId: $valuableId, limit: $limit) {
      items {
        id
        ownerId
        valuableId
        granteeUserId
        granteeEmail
        canViewScanInfo
        canReceiveNotifications
        canReceiveCalls
        createdAt
        updatedAt
      }
    }
  }
`

const valuableAccessInvitesByValuableQuery = /* GraphQL */ `
  query ValuableAccessInvitesByValuable($valuableId: ID!, $limit: Int) {
    ValuableAccessInvitesByValuable(valuableId: $valuableId, limit: $limit) {
      items {
        code
        ownerId
        valuableId
        canViewScanInfo
        canReceiveNotifications
        canReceiveCalls
        status
        createdByUserId
        acceptedByUserId
        createdAt
        expiresAt
        acceptedAt
        rejectedAt
        cancelledAt
      }
    }
  }
`

const getQrCodeQuery = /* GraphQL */ `
  query GetQrCode($code: String!) {
    getQrCode(code: $code) {
      code
      qrImagePath
      packId
      packSize
      packPosition
      batchLabel
      generatedBy
      packOwnerId
      packAssignedAt
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
      qrImagePath
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
      qrImagePath
    }
  }
`

const createValuableAccessMutation = /* GraphQL */ `
  mutation CreateValuableAccess($input: CreateValuableAccessInput!) {
    createValuableAccess(input: $input) {
      id
    }
  }
`

const updateValuableAccessMutation = /* GraphQL */ `
  mutation UpdateValuableAccess($input: UpdateValuableAccessInput!) {
    updateValuableAccess(input: $input) {
      id
    }
  }
`

const deleteValuableAccessMutation = /* GraphQL */ `
  mutation DeleteValuableAccess($input: DeleteValuableAccessInput!) {
    deleteValuableAccess(input: $input) {
      id
    }
  }
`

const createValuableAccessInviteMutation = /* GraphQL */ `
  mutation CreateValuableAccessInvite($input: CreateValuableAccessInviteInput!) {
    createValuableAccessInvite(input: $input) {
      code
    }
  }
`

const updateValuableAccessInviteMutation = /* GraphQL */ `
  mutation UpdateValuableAccessInvite($input: UpdateValuableAccessInviteInput!) {
    updateValuableAccessInvite(input: $input) {
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

function generateAccessInviteCode() {
  return `IFD-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`
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
  if (!response.ok) {
    const json = await response.json().catch(() => null)
    throw new Error(json?.error || "Unable to upload QR image")
  }

  const blob = await response.blob()
  const path = `public/qr-codes/${code}.png`

  await uploadData({
    path,
    data: blob,
    options: {
      contentType: "image/png",
      metadata: {
        qrCode: code,
      },
    },
  }).result

  const url = await getUrl({
    path,
    options: {
      expiresIn: 3600,
      contentDisposition: `attachment; filename="${code}.png"`,
      contentType: "image/png",
    },
  })

  return { publicUrl: url.url.toString() }
}

async function getQrPngUrl(path: string, code: string) {
  const url = await getUrl({
    path,
    options: {
      expiresIn: 3600,
      contentDisposition: `attachment; filename="${code}.png"`,
      contentType: "image/png",
    },
  })

  return { publicUrl: url.url.toString(), path }
}

function sanitizeFileNamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-")
}

async function uploadItemImage(ownerId: string, file: File) {
  const extension = sanitizeFileNamePart(file.name.split(".").pop() || "jpg")
  const path = `public/item-images/${ownerId}/${crypto.randomUUID()}.${extension}`

  await uploadData({
    path,
    data: file,
    options: {
      contentType: file.type || "application/octet-stream",
      metadata: {
        ownerId,
        originalName: file.name,
      },
    },
  }).result

  return path
}

function statusFromQr(record: QrRecord): QRRow["status"] {
  if (record.status === "UNASSIGNED") return "unassigned"
  if (record.status === "RETIRED") return "inactive"
  return "active"
}

function getUserLabel(user: UserRecord) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || user.cognitoId
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
  const [isClaimPackOpen, setIsClaimPackOpen] = useState(false)
  const [isAssignPackOpen, setIsAssignPackOpen] = useState(false)
  const [isAccessOpen, setIsAccessOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<QRRow | null>(null)
  const [ownerOptions, setOwnerOptions] = useState<UserRecord[]>([])
  const [accessEntries, setAccessEntries] = useState<AccessRecord[]>([])
  const [inviteEntries, setInviteEntries] = useState<AccessInviteRecord[]>([])
  const [latestInviteCode, setLatestInviteCode] = useState("")
  const [itemForm, setItemForm] = useState<ItemFormState>({ qrCode: "", itemName: "", serialNumber: "", category: "", description: "" })
  const [itemImageFile, setItemImageFile] = useState<File | null>(null)
  const [itemImagePreview, setItemImagePreview] = useState<string>("")
  const [packForm, setPackForm] = useState<PackFormState>({ packSize: "4", packsCount: "1", batchLabel: "" })
  const [assignPackForm, setAssignPackForm] = useState<AssignPackFormState>({ packId: "", ownerId: "" })
  const [accessForm, setAccessForm] = useState<AccessFormState>({
    canViewScanInfo: true,
    canReceiveNotifications: true,
    canReceiveCalls: true,
  })
  const [claimPackId, setClaimPackId] = useState("")
  const ownerLabelMap = useMemo(
    () => new Map(ownerOptions.map((user) => [user.cognitoId, getUserLabel(user)])),
    [ownerOptions],
  )

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
            qrImagePath: qr.qrImagePath || null,
            itemName: qr.label || (qr.status === "UNASSIGNED" ? "Awaiting registration" : "Registered item"),
            packPosition: qr.packPosition || null,
            packSize: qr.packSize || null,
            category: qr.status === "UNASSIGNED" ? "Inventory" : "Assigned",
            owner: qr.packOwnerId ? ownerLabelMap.get(qr.packOwnerId) || qr.packOwnerId.slice(0, 8) : "Not assigned",
            packOwnerId: qr.packOwnerId || null,
            status: statusFromQr(qr),
            scans: 0,
            lastScanned: null,
            createdAt: qr.createdAt || new Date().toISOString(),
            description: "",
            imagePath: null,
            valuableId: qr.valuableId || undefined,
            packId: qr.packId || undefined,
            packLabel: qr.packId ? `${qr.batchLabel || "Pack"} Â· ${qr.packId} Â· ${qr.packPosition || 1}/${qr.packSize || 1}` : undefined,
          }))
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

        setRows(nextRows)
        return
      }

      const [qrData, valuableData, scanData] = await Promise.all([
        runGraphQL<{ QrCodesByPackOwner: { items: QrRecord[] } }>(qrCodesByPackOwnerQuery, { packOwnerId: currentOwnerId, limit: 200 }),
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
          current.lastScanned = scan.scannedAt || null
        }
        scanStats.set(scan.qrCodeId, current)
      }

      const nextRows = qrData.QrCodesByPackOwner.items.map((qr) => {
        const valuable = qr.valuableId ? valuableById.get(qr.valuableId) : undefined
        const stats = scanStats.get(qr.code) ?? { scans: 0, lastScanned: null }
        return {
          id: qr.code,
          qrImagePath: qr.qrImagePath || null,
          itemName: valuable?.name || qr.label || "Awaiting registration",
          packPosition: qr.packPosition || null,
          packSize: qr.packSize || null,
          serialNumber: valuable?.serialNumber || "",
          category: valuable?.category || (qr.status === "UNASSIGNED" ? "Purchased pack" : "Other"),
          owner: currentOwnerLabel,
          packOwnerId: qr.packOwnerId || null,
          status: statusFromQr(qr),
          scans: stats.scans,
          lastScanned: stats.lastScanned,
          createdAt: qr.createdAt || valuable?.createdAt || new Date().toISOString(),
          description: valuable?.description || "",
          imagePath: valuable?.images?.find(Boolean) || null,
          valuableId: qr.valuableId || undefined,
          packId: qr.packId || undefined,
          packLabel: qr.packId ? `${qr.batchLabel || "Pack"} Â· ${qr.packId} Â· ${qr.packPosition || 1}/${qr.packSize || 1}` : undefined,
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
        if (adminMode) {
          const owners = await runGraphQL<{ UsersByRole: { items: UserRecord[] } }>(usersByRoleQuery, { role: "OWNER", limit: 500 })
          setOwnerOptions((owners.UsersByRole.items || []).sort((left, right) => getUserLabel(left).localeCompare(getUserLabel(right))))
        }
        await loadRows(sub, label, adminMode)
      } catch (err: any) {
        setError(err?.message || "Unable to initialize QR codes")
        setIsLoading(false)
      }
    }
    void run()
  }, [])

  useEffect(() => {
    return () => {
      if (itemImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(itemImagePreview)
      }
    }
  }, [itemImagePreview])

  const handleItemImageChange = (file: File | null) => {
    if (itemImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(itemImagePreview)
    }

    setItemImageFile(file)
    if (!file) {
      setItemImagePreview("")
      return
    }

    setItemImagePreview(URL.createObjectURL(file))
  }

  const resetForms = () => {
    setItemForm({ qrCode: "", itemName: "", serialNumber: "", category: "", description: "" })
    handleItemImageChange(null)
    setPackForm({ packSize: "4", packsCount: "1", batchLabel: "" })
    setAssignPackForm({ packId: "", ownerId: "" })
    setAccessForm({
      canViewScanInfo: true,
      canReceiveNotifications: true,
      canReceiveCalls: true,
    })
    setAccessEntries([])
    setInviteEntries([])
    setLatestInviteCode("")
    setClaimPackId("")
    setSelectedRow(null)
  }

  const openAssignPack = (row: QRRow) => {
    if (!row.packId) {
      setError("This QR code is not part of a pack")
      return
    }
    setAssignPackForm({ packId: row.packId, ownerId: row.packOwnerId || "" })
    setIsAssignPackOpen(true)
  }

  const openAccess = async (row: QRRow) => {
    if (!row.valuableId) {
      setError("Register this QR code first before sharing access")
      return
    }

    setSelectedRow(row)
    setIsAccessOpen(true)
    setError("")
    setSuccess("")
    setLatestInviteCode("")

    try {
      const [accessData, inviteData] = await Promise.all([
        runGraphQL<{ ValuableAccessByValuable: { items: AccessRecord[] } }>(
          valuableAccessByValuableQuery,
          { valuableId: row.valuableId, limit: 100 },
        ),
        runGraphQL<{ ValuableAccessInvitesByValuable: { items: AccessInviteRecord[] } }>(
          valuableAccessInvitesByValuableQuery,
          { valuableId: row.valuableId, limit: 100 },
        ),
      ])
      setAccessEntries(accessData.ValuableAccessByValuable.items || [])
      setInviteEntries(
        (inviteData.ValuableAccessInvitesByValuable.items || []).sort((left, right) =>
          (right.createdAt || "").localeCompare(left.createdAt || ""),
        ),
      )
    } catch (err: any) {
      setError(err?.message || "Unable to load shared access")
    }
  }

  const handleCreateInvite = async () => {
    if (!selectedRow?.valuableId) {
      setError("Select an item first")
      return
    }

    if (
      !accessForm.canViewScanInfo &&
      !accessForm.canReceiveNotifications &&
      !accessForm.canReceiveCalls
    ) {
      setError("Select at least one permission")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const code = generateAccessInviteCode()
      await runGraphQL(createValuableAccessInviteMutation, {
        input: {
          code,
          ownerId,
          valuableId: selectedRow.valuableId,
          canViewScanInfo: accessForm.canViewScanInfo,
          canReceiveNotifications: accessForm.canReceiveNotifications,
          canReceiveCalls: accessForm.canReceiveCalls,
          status: "PENDING",
          createdByUserId: ownerId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })

      const refreshed = await runGraphQL<{ ValuableAccessInvitesByValuable: { items: AccessInviteRecord[] } }>(
        valuableAccessInvitesByValuableQuery,
        { valuableId: selectedRow.valuableId, limit: 100 },
      )
      setInviteEntries(
        (refreshed.ValuableAccessInvitesByValuable.items || []).sort((left, right) =>
          (right.createdAt || "").localeCompare(left.createdAt || ""),
        ),
      )
      setLatestInviteCode(code)
      setSuccess(`Invitation code ${code} created`)
    } catch (err: any) {
      setError(err?.message || "Unable to create invitation")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelInvite = async (invite: AccessInviteRecord) => {
    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      await runGraphQL(updateValuableAccessInviteMutation, {
        input: {
          code: invite.code,
          status: "CANCELLED",
          cancelledAt: new Date().toISOString(),
        },
      })

      const refreshed = await runGraphQL<{ ValuableAccessInvitesByValuable: { items: AccessInviteRecord[] } }>(
        valuableAccessInvitesByValuableQuery,
        { valuableId: selectedRow?.valuableId, limit: 100 },
      )
      setInviteEntries(
        (refreshed.ValuableAccessInvitesByValuable.items || []).sort((left, right) =>
          (right.createdAt || "").localeCompare(left.createdAt || ""),
        ),
      )
      setSuccess(`Invitation ${invite.code} cancelled`)
    } catch (err: any) {
      setError(err?.message || "Unable to cancel invitation")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAccess = async (entry: AccessRecord) => {
    if (!selectedRow?.valuableId) return
    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      await runGraphQL(deleteValuableAccessMutation, {
        input: {
          id: entry.id,
        },
      })

      const refreshed = await runGraphQL<{ ValuableAccessByValuable: { items: AccessRecord[] } }>(
        valuableAccessByValuableQuery,
        { valuableId: selectedRow.valuableId, limit: 100 },
      )
      setAccessEntries(refreshed.ValuableAccessByValuable.items || [])
      setSuccess(`Removed access for ${entry.granteeEmail || entry.granteeUserId}`)
    } catch (err: any) {
      setError(err?.message || "Unable to remove access")
    } finally {
      setIsSubmitting(false)
    }
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
      if (!qrLookup.getQrCode.packId) {
        throw new Error("This QR code is not part of a valid customer pack")
      }
      if (qrLookup.getQrCode.packOwnerId !== ownerId) {
        throw new Error("This QR code does not belong to a pack assigned to your account")
      }
      if (qrLookup.getQrCode.status !== "UNASSIGNED" || qrLookup.getQrCode.ownerId) {
        throw new Error("This QR code has already been assigned")
      }

      const qrValue = buildQrCodeValue(normalizedCode)
      const imagePath = itemImageFile ? await uploadItemImage(ownerId, itemImageFile) : null
      const valuableResult = await runGraphQL<{ createValuable: { id: string } }>(createValuableMutation, {
        input: {
          ownerId,
          name: itemForm.itemName.trim(),
          serialNumber: itemForm.serialNumber.trim() || null,
          description: itemForm.description.trim() || null,
          category: itemForm.category,
          status: "ACTIVE",
          qrCodeValue: qrValue,
          images: imagePath ? [imagePath] : [],
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

  const handleAssignPack = async () => {
    if (!assignPackForm.packId || !assignPackForm.ownerId) {
      setError("Pack and owner are required")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const packData = await runGraphQL<{ QrCodesByPack: { items: QrRecord[] } }>(qrCodesByPackQuery, {
        packId: assignPackForm.packId,
        limit: 50,
      })
      const packItems = packData.QrCodesByPack.items || []

      if (!packItems.length) {
        throw new Error("Pack does not exist")
      }

      const assignedAt = new Date().toISOString()
      await Promise.all(
        packItems.map((item) =>
          runGraphQL(updateQrCodeMutation, {
            input: {
              code: item.code,
              packOwnerId: assignPackForm.ownerId,
              packAssignedAt: assignedAt,
            },
          }),
        ),
      )

      const assignedOwner = ownerOptions.find((user) => user.cognitoId === assignPackForm.ownerId)
      setSuccess(`Pack ${assignPackForm.packId} assigned to ${assignedOwner ? getUserLabel(assignedOwner) : "owner"}`)
      setIsAssignPackOpen(false)
      resetForms()
      await loadRows(ownerId, ownerLabel, isAdmin)
    } catch (err: any) {
      setError(err?.message || "Unable to assign pack")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClaimPack = async () => {
    const normalizedPackId = claimPackId.trim().toUpperCase()
    if (!ownerId || !normalizedPackId) {
      setError("Pack ID is required")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const packData = await runGraphQL<{ QrCodesByPack: { items: QrRecord[] } }>(qrCodesByPackQuery, {
        packId: normalizedPackId,
        limit: 50,
      })

      const packItems = packData.QrCodesByPack.items || []
      if (!packItems.length) {
        throw new Error("Pack does not exist")
      }

      const ownerIds = Array.from(new Set(packItems.map((item) => item.packOwnerId).filter(Boolean)))
      if (ownerIds.length && !ownerIds.includes(ownerId)) {
        throw new Error("This pack has already been claimed by another owner")
      }

      if (ownerIds.includes(ownerId)) {
        throw new Error("This pack is already claimed on your account")
      }

      const assignedAt = new Date().toISOString()
      await Promise.all(
        packItems.map((item) =>
          runGraphQL(updateQrCodeMutation, {
            input: {
              code: item.code,
              packOwnerId: ownerId,
              packAssignedAt: assignedAt,
            },
          }),
        ),
      )

      setSuccess(`Pack ${normalizedPackId} claimed successfully`)
      setIsClaimPackOpen(false)
      resetForms()
      await loadRows(ownerId, ownerLabel, isAdmin)
    } catch (err: any) {
      setError(err?.message || "Unable to claim pack")
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
            const uploadResult = await uploadQrPng(entry.code, buildQrCodeValue(entry.code))
            await runGraphQL(updateQrCodeMutation, {
              input: {
                code: entry.code,
                qrImagePath: `public/qr-codes/${entry.code}.png`,
              },
            })
            return uploadResult
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
    setItemForm({ qrCode: row.id, itemName: row.itemName, serialNumber: row.serialNumber || "", category: row.category, description: row.description || "" })
    setItemImageFile(null)
    setItemImagePreview(row.imagePath || "")
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
      const imagePath = itemImageFile ? await uploadItemImage(ownerId, itemImageFile) : selectedRow.imagePath || null
      await Promise.all([
        runGraphQL(updateValuableMutation, {
          input: {
            id: selectedRow.valuableId,
            name: itemForm.itemName.trim(),
            serialNumber: itemForm.serialNumber.trim() || null,
            description: itemForm.description.trim() || null,
            category: itemForm.category,
            images: imagePath ? [imagePath] : [],
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
      let result
      if (row.qrImagePath) {
        result = await getQrPngUrl(row.qrImagePath, row.id)
      } else {
        result = await uploadQrPng(row.id, buildQrCodeValue(row.id))
        const qrImagePath = `public/qr-codes/${row.id}.png`
        await runGraphQL(updateQrCodeMutation, {
          input: {
            code: row.id,
            qrImagePath,
          },
        })
      }
      window.open(result.publicUrl, "_blank", "noopener,noreferrer")
      await loadRows(ownerId, ownerLabel, isAdmin)
    } catch (err: any) {
      setError(err?.message || "Unable to download QR code")
    }
  }

  const handleDownloadPack = async (row: QRRow) => {
    if (!row.packId) {
      setError("This QR code is not part of a pack")
      return
    }

    try {
      const packData = await runGraphQL<{ QrCodesByPack: { items: QrRecord[] } }>(qrCodesByPackQuery, {
        packId: row.packId,
        limit: 50,
      })

      const packItems = (packData.QrCodesByPack.items || [])
        .slice()
        .sort((left, right) => (left.packPosition || 0) - (right.packPosition || 0))
        .map((item) => ({
          code: item.code,
          position: item.packPosition || null,
        }))

      if (!packItems.length) {
        throw new Error("Pack does not exist")
      }

      const response = await fetch("/api/qr/pack-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packId: row.packId,
          baseUrl: window.location.origin,
          codes: packItems,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.error || "Unable to generate pack sheet")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${row.packId}.png`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message || "Unable to download full pack")
    }
  }

  const title = isAdmin ? "QR Inventory" : "My QR Codes"
  const subtitle = isAdmin
    ? "Generate QR packs, assign each pack to an owner, and monitor registration"
    : "Register QR codes only from packs assigned to your account and manage assigned items"

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2">
          {isAdmin ? (
            <>
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
                    <DialogDescription>Create packs of 4 or 10 QR codes for retail sale.</DialogDescription>
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
                    <p className="text-xs text-muted-foreground">
                      Customers claim purchased packs themselves. Admin can later edit pack ownership if needed.
                    </p>
                    <Button onClick={handleGeneratePacks} disabled={isSubmitting} className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Packs"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <>
              <Dialog open={isClaimPackOpen} onOpenChange={setIsClaimPackOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Claim Pack
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Claim Pack</DialogTitle>
                    <DialogDescription>Enter the pack ID printed on your purchased retail pack.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Pack ID</Label>
                      <Input value={claimPackId} onChange={(event) => setClaimPackId(event.target.value.toUpperCase())} placeholder="PACK-XXXXXXXXXX" className="h-11 rounded-xl border-border/50 bg-secondary/50" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Claim the pack first. After that, you can register each QR code from that pack to your items.
                    </p>
                    <Button onClick={handleClaimPack} disabled={isSubmitting} className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim Pack"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                    <DialogDescription>Enter a QR code from your claimed pack and attach it to your item.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>QR Code</Label>
                      <Input value={itemForm.qrCode} onChange={(event) => setItemForm((current) => ({ ...current, qrCode: event.target.value.toUpperCase() }))} placeholder="QR-XXXXXXXXXXXX" className="h-11 rounded-xl border-border/50 bg-secondary/50" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Registration succeeds only if the QR code belongs to a pack claimed on your account.
                    </p>
                    <div className="space-y-2">
                      <Label>Tagged to</Label>
                      <Input value={itemForm.itemName} onChange={(event) => setItemForm((current) => ({ ...current, itemName: event.target.value }))} placeholder="e.g. MacBook Pro or Bicycle" className="h-11 rounded-xl border-border/50 bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Serial Number</Label>
                      <Input value={itemForm.serialNumber} onChange={(event) => setItemForm((current) => ({ ...current, serialNumber: event.target.value }))} placeholder="Optional device or product serial number" className="h-11 rounded-xl border-border/50 bg-secondary/50" />
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
                    <div className="space-y-2">
                      <Label>Item Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleItemImageChange(event.target.files?.[0] || null)}
                        className="h-11 rounded-xl border-border/50 bg-secondary/50"
                      />
                      {itemImagePreview ? (
                        <img
                          src={itemImagePreview}
                          alt="Item preview"
                          className="h-32 w-full rounded-xl border border-border/50 object-cover"
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">Upload a clear photo of the item to help identify it when found.</p>
                      )}
                    </div>
                    <Button onClick={handleRegisterQr} disabled={isSubmitting} className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate & Register"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
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
                {isAdmin && row.packId ? (
                  <DropdownMenuItem className="rounded-lg" onClick={() => void handleDownloadPack(row)}>
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Download Full Pack
                  </DropdownMenuItem>
                ) : null}
                {isAdmin && row.packId ? (
                  <DropdownMenuItem className="rounded-lg" onClick={() => openAssignPack(row)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Pack Ownership
                  </DropdownMenuItem>
                ) : null}
                {!isAdmin && row.status !== "unassigned" ? (
                  <>
                    <DropdownMenuItem className="rounded-lg" onClick={() => void openAccess(row)}>
                      <ShieldPlus className="mr-2 h-4 w-4" />
                      Manage Access
                    </DropdownMenuItem>
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

      <Dialog open={isAssignPackOpen} onOpenChange={setIsAssignPackOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Edit Pack Ownership</DialogTitle>
            <DialogDescription>Move this pack to a different owner or correct its current ownership.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Pack ID</Label>
              <Input value={assignPackForm.packId} disabled className="h-11 rounded-xl border-border/50 bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={assignPackForm.ownerId} onValueChange={(value) => setAssignPackForm((current) => ({ ...current, ownerId: value }))}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-secondary/50">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {ownerOptions.map((owner) => (
                    <SelectItem key={owner.cognitoId} value={owner.cognitoId}>
                      {getUserLabel(owner)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignPack} disabled={isSubmitting} className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Ownership"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAccessOpen} onOpenChange={setIsAccessOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Manage Access</DialogTitle>
            <DialogDescription>
              Create an invitation code. The other user signs in with any method and accepts this item using the code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
              <p className="text-sm font-medium text-foreground">{selectedRow?.itemName || "Selected item"}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{selectedRow?.id || ""}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
                Share the generated code with the recipient. They can log in with phone, email, Google, or Apple and accept it from their dashboard.
              </div>
              <div className="grid gap-2 rounded-xl border border-border/50 bg-secondary/20 p-4">
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={accessForm.canViewScanInfo}
                    onCheckedChange={(checked) => setAccessForm((current) => ({ ...current, canViewScanInfo: checked === true }))}
                  />
                  Scan information
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={accessForm.canReceiveNotifications}
                    onCheckedChange={(checked) => setAccessForm((current) => ({ ...current, canReceiveNotifications: checked === true }))}
                  />
                  Finder messages
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={accessForm.canReceiveCalls}
                    onCheckedChange={(checked) => setAccessForm((current) => ({ ...current, canReceiveCalls: checked === true }))}
                  />
                  Live calls
                </label>
              </div>
            </div>

            <Button onClick={handleCreateInvite} disabled={isSubmitting} className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Invitation Code"}
            </Button>

            {latestInviteCode ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest invitation code</p>
                <p className="mt-2 font-mono text-lg font-semibold text-foreground">{latestInviteCode}</p>
                <p className="mt-1 text-xs text-muted-foreground">This code is valid for 7 days unless cancelled.</p>
              </div>
            ) : null}

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Pending invitations</h3>
                <p className="text-xs text-muted-foreground">
                  Recipients must sign in and accept the code before access becomes active.
                </p>
              </div>
              {inviteEntries.filter((entry) => entry.status === "PENDING").length ? (
                <div className="space-y-3">
                  {inviteEntries
                    .filter((entry) => entry.status === "PENDING")
                    .map((entry) => (
                    <div key={entry.code} className="flex flex-col gap-3 rounded-xl border border-border/50 bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="font-mono text-sm font-medium text-foreground">{entry.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            entry.canViewScanInfo ? "Scan info" : null,
                            entry.canReceiveNotifications ? "Messages" : null,
                            entry.canReceiveCalls ? "Calls" : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "recently"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => void handleCancelInvite(entry)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
                  No pending invitations for this item.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Active access</h3>
                <p className="text-xs text-muted-foreground">
                  These users already accepted an invitation and can access this item according to the listed permissions.
                </p>
              </div>
              {accessEntries.length ? (
                <div className="space-y-3">
                  {accessEntries.map((entry) => (
                    <div key={entry.id} className="flex flex-col gap-3 rounded-xl border border-border/50 bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{entry.granteeEmail || entry.granteeUserId}</p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            entry.canViewScanInfo ? "Scan info" : null,
                            entry.canReceiveNotifications ? "Messages" : null,
                            entry.canReceiveCalls ? "Calls" : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => void handleRemoveAccess(entry)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
                  No active shared users for this item yet.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <Label>Serial Number</Label>
              <Input value={itemForm.serialNumber} onChange={(event) => setItemForm((current) => ({ ...current, serialNumber: event.target.value }))} className="h-11 rounded-xl border-border/50 bg-secondary/50" />
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
            <div className="space-y-2">
              <Label>Item Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => handleItemImageChange(event.target.files?.[0] || null)}
                className="h-11 rounded-xl border-border/50 bg-secondary/50"
              />
              {itemImagePreview ? (
                <img
                  src={itemImagePreview}
                  alt="Item preview"
                  className="h-32 w-full rounded-xl border border-border/50 object-cover"
                />
              ) : (
                <p className="text-xs text-muted-foreground">No image uploaded for this item yet.</p>
              )}
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

