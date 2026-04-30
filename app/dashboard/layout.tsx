"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  QrCode,
  Activity,
  CreditCard,
  Settings,
  PhoneCall,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  ShieldCheck,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fetchAuthSession, signOut } from "aws-amplify/auth"
import { syncCognitoAttributesFromToken } from "@/lib/auth-sync"

const navItems = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Users", href: "/dashboard/users", icon: Users, adminOnly: true },
      { title: "QR Codes", href: "/dashboard/qr-codes", icon: QrCode },
      { title: "Invitations", href: "/dashboard/invitations", icon: KeyRound },
      { title: "Scan Activity", href: "/dashboard/activity", icon: Activity },
      { title: "Calls", href: "/dashboard/calls", icon: PhoneCall },
    ],
  },
  {
    title: "Billing",
    items: [
      { title: "Payments", href: "/dashboard/payments", icon: CreditCard },
    ],
  },
  {
    title: "System",
    items: [
      { title: "Manage", href: "/dashboard/manage-cognito", icon: ShieldCheck, adminOnly: true },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{
    email?: string
    name?: string
    groups?: string[]
  } | null>(null)

  const isAdmin = user?.groups?.includes("Admin") ?? false

  const filteredNav = useMemo(() => {
    return navItems
      .map((group) => ({
        ...group,
        items: group.items.filter((item: any) => !item.adminOnly || isAdmin),
      }))
      .filter((group) => group.items.length > 0)
  }, [isAdmin])

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const session = await fetchAuthSession()
        const payload = session.tokens?.idToken?.payload
        const groups = (payload?.["cognito:groups"] as string[] | undefined) ?? []
        const email = payload?.email as string | undefined
        const name = (payload?.name as string | undefined) ||
          [payload?.given_name, payload?.family_name].filter(Boolean).join(" ").trim()

        await syncCognitoAttributesFromToken()

        if (!session.tokens?.idToken) {
          router.replace("/login")
          return
        }

        if (!groups.includes("Admin")) {
          const adminOnlyRoutes = new Set(["/dashboard/users", "/dashboard/manage-cognito"])
          if (adminOnlyRoutes.has(pathname)) {
            router.replace("/dashboard")
            return
          }
        }

        if (active) {
          setUser({ email, name, groups })
        }
      } catch {
        router.replace("/login")
      }
    }
    run()
    return () => {
      active = false
    }
  }, [pathname, router])

  const handleSignOut = async () => {
    await signOut()
    router.replace("/login")
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              iFound
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          {filteredNav.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        className="rounded-xl"
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-sidebar-accent transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
                  {(user?.name || user?.email || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{user?.name || "Signed in"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl">
              <DropdownMenuItem className="rounded-lg">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg text-destructive" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6">
          <SidebarTrigger className="-ml-2" />
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-9 pl-9 rounded-lg bg-secondary/50 border-border/50"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative rounded-lg">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
