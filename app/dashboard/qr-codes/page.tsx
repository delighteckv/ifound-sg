"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { DataTable, Column } from "@/components/dashboard/data-table"
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
import { Eye, Download, QrCode, Plus, Trash2, Power, PowerOff } from "lucide-react"

interface QRCode {
  id: string
  itemName: string
  category: string
  owner: string
  status: "active" | "inactive"
  scans: number
  lastScanned: string | null
  createdAt: string
}

const mockQRCodes: QRCode[] = [
  { id: "QR001", itemName: "MacBook Pro 16\"", category: "Electronics", owner: "John Smith", status: "active", scans: 45, lastScanned: "2024-03-10", createdAt: "2024-01-15" },
  { id: "QR002", itemName: "Leather Wallet", category: "Accessories", owner: "Sarah Johnson", status: "active", scans: 12, lastScanned: "2024-03-08", createdAt: "2024-01-12" },
  { id: "QR003", itemName: "AirPods Pro", category: "Electronics", owner: "Michael Brown", status: "active", scans: 8, lastScanned: "2024-03-05", createdAt: "2024-01-10" },
  { id: "QR004", itemName: "Backpack", category: "Bags", owner: "Emily Davis", status: "inactive", scans: 23, lastScanned: "2024-02-20", createdAt: "2024-01-08" },
  { id: "QR005", itemName: "Car Keys", category: "Keys", owner: "James Wilson", status: "active", scans: 67, lastScanned: "2024-03-09", createdAt: "2024-01-05" },
  { id: "QR006", itemName: "iPhone 15 Pro", category: "Electronics", owner: "Emma Taylor", status: "active", scans: 34, lastScanned: "2024-03-07", createdAt: "2024-01-03" },
  { id: "QR007", itemName: "Passport", category: "Documents", owner: "Daniel Martinez", status: "active", scans: 5, lastScanned: "2024-01-20", createdAt: "2024-01-01" },
  { id: "QR008", itemName: "Camera Bag", category: "Bags", owner: "Olivia Anderson", status: "inactive", scans: 15, lastScanned: "2024-02-15", createdAt: "2023-12-28" },
  { id: "QR009", itemName: "Sunglasses", category: "Accessories", owner: "William Thomas", status: "active", scans: 9, lastScanned: "2024-03-01", createdAt: "2023-12-25" },
  { id: "QR010", itemName: "Laptop Sleeve", category: "Accessories", owner: "Sophia Jackson", status: "active", scans: 28, lastScanned: "2024-03-06", createdAt: "2023-12-22" },
]

const columns: Column<QRCode>[] = [
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
          <p className="text-xs text-muted-foreground">{row.category}</p>
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
      const status = value as QRCode["status"]
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
]

export default function QRCodesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                    placeholder="e.g., MacBook Pro"
                    className="h-11 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger className="h-11 rounded-xl bg-secondary/50 border-border/50">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                      <SelectItem value="keys">Keys</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    placeholder="Brief description..."
                    className="h-11 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reward Amount (Optional)</Label>
                  <Input
                    placeholder="$0.00"
                    className="h-11 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <Button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                >
                  Generate QR Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DataTable
          data={mockQRCodes}
          columns={columns}
          searchKey="itemName"
          searchPlaceholder="Search QR codes..."
          filterOptions={[
            {
              key: "category",
              label: "Category",
              options: [
                { value: "Electronics", label: "Electronics" },
                { value: "Accessories", label: "Accessories" },
                { value: "Bags", label: "Bags" },
                { value: "Keys", label: "Keys" },
                { value: "Documents", label: "Documents" },
              ],
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
              <DropdownMenuItem className="rounded-lg">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
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
              <DropdownMenuItem className="rounded-lg text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        />
      </motion.div>
    </div>
  )
}
