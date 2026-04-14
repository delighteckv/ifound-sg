"use client"

import { motion } from "framer-motion"
import { DataTable, Column } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Eye, MapPin, Smartphone, Globe, Clock } from "lucide-react"

interface ScanLog {
  id: string
  itemName: string
  qrId: string
  location: string
  device: string
  browser: string
  action: "scan" | "call" | "message"
  timestamp: string
  ip: string
}

const mockScanLogs: ScanLog[] = [
  { id: "1", itemName: "MacBook Pro 16\"", qrId: "QR001", location: "San Francisco, CA", device: "iPhone 15 Pro", browser: "Safari", action: "scan", timestamp: "2024-03-10T14:32:00", ip: "192.168.1.xxx" },
  { id: "2", itemName: "MacBook Pro 16\"", qrId: "QR001", location: "San Francisco, CA", device: "iPhone 15 Pro", browser: "Safari", action: "message", timestamp: "2024-03-10T14:33:00", ip: "192.168.1.xxx" },
  { id: "3", itemName: "Leather Wallet", qrId: "QR002", location: "New York, NY", device: "Samsung S24", browser: "Chrome", action: "scan", timestamp: "2024-03-10T12:15:00", ip: "10.0.0.xxx" },
  { id: "4", itemName: "Leather Wallet", qrId: "QR002", location: "New York, NY", device: "Samsung S24", browser: "Chrome", action: "call", timestamp: "2024-03-10T12:16:00", ip: "10.0.0.xxx" },
  { id: "5", itemName: "AirPods Pro", qrId: "QR003", location: "Los Angeles, CA", device: "Pixel 8", browser: "Chrome", action: "scan", timestamp: "2024-03-09T18:45:00", ip: "172.16.0.xxx" },
  { id: "6", itemName: "Car Keys", qrId: "QR005", location: "Seattle, WA", device: "iPhone 14", browser: "Safari", action: "scan", timestamp: "2024-03-09T16:20:00", ip: "192.168.2.xxx" },
  { id: "7", itemName: "Car Keys", qrId: "QR005", location: "Seattle, WA", device: "iPhone 14", browser: "Safari", action: "message", timestamp: "2024-03-09T16:22:00", ip: "192.168.2.xxx" },
  { id: "8", itemName: "iPhone 15 Pro", qrId: "QR006", location: "Chicago, IL", device: "iPad Pro", browser: "Safari", action: "scan", timestamp: "2024-03-09T14:10:00", ip: "10.1.0.xxx" },
  { id: "9", itemName: "Backpack", qrId: "QR004", location: "Denver, CO", device: "OnePlus 12", browser: "Chrome", action: "scan", timestamp: "2024-03-08T11:30:00", ip: "172.17.0.xxx" },
  { id: "10", itemName: "Laptop Sleeve", qrId: "QR010", location: "Austin, TX", device: "iPhone 13", browser: "Safari", action: "scan", timestamp: "2024-03-08T09:45:00", ip: "192.168.3.xxx" },
]

const columns: Column<ScanLog>[] = [
  {
    key: "timestamp",
    title: "Time",
    sortable: true,
    render: (value) => {
      const date = new Date(value as string)
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
        <p className="text-xs text-muted-foreground font-mono">{row.qrId}</p>
      </div>
    ),
  },
  {
    key: "action",
    title: "Action",
    sortable: true,
    render: (value) => {
      const action = value as ScanLog["action"]
      const colors = {
        scan: "bg-secondary text-secondary-foreground",
        call: "bg-accent/20 text-accent",
        message: "bg-primary/20 text-primary",
      }
      const labels = {
        scan: "Scanned",
        call: "Called",
        message: "Messaged",
      }
      return (
        <Badge variant="secondary" className={colors[action]}>
          {labels[action]}
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
        <span>{value as string}</span>
      </div>
    ),
  },
  {
    key: "device",
    title: "Device",
    sortable: true,
    render: (_, row) => (
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm">{row.device}</p>
          <p className="text-xs text-muted-foreground">{row.browser}</p>
        </div>
      </div>
    ),
  },
  {
    key: "ip",
    title: "IP Address",
    render: (value) => (
      <span className="font-mono text-sm text-muted-foreground">{value as string}</span>
    ),
  },
]

export default function ActivityPage() {
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
            Scan Activity
          </h1>
          <p className="text-muted-foreground">
            Track all QR code scans and interactions
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button variant="outline" className="rounded-xl border-border/50">
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
          <p className="text-sm text-muted-foreground">{"Today's Scans"}</p>
          <p className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>247</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Contact Attempts</p>
          <p className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>34</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Unique Locations</p>
          <p className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>18</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DataTable
          data={mockScanLogs}
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
          ]}
          actions={() => (
            <>
              <DropdownMenuItem className="rounded-lg">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <Globe className="mr-2 h-4 w-4" />
                View on Map
              </DropdownMenuItem>
            </>
          )}
        />
      </motion.div>
    </div>
  )
}
