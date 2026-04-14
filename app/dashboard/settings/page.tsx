"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Building2, 
  Bell, 
  Palette, 
  Shield, 
  Upload,
  Save,
  Mail,
  Smartphone,
  MessageSquare
} from "lucide-react"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
  }

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
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and platform settings
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="bg-secondary/50 rounded-xl p-1">
            <TabsTrigger value="branding" className="rounded-lg data-[state=active]:bg-background">
              <Palette className="mr-2 h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-background">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="organization" className="rounded-lg data-[state=active]:bg-background">
              <Building2 className="mr-2 h-4 w-4" />
              Organization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Brand Identity
              </h3>
              
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input 
                      defaultValue="FindR Inc." 
                      className="h-11 rounded-xl bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input 
                      defaultValue="support@findr.io" 
                      className="h-11 rounded-xl bg-secondary/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
                      <span className="text-2xl font-bold text-white">F</span>
                    </div>
                    <Button variant="outline" className="rounded-xl border-border/50">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary" />
                      <Input 
                        defaultValue="#8B5CF6" 
                        className="h-11 rounded-xl bg-secondary/50 border-border/50 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-accent" />
                      <Input 
                        defaultValue="#14B8A6" 
                        className="h-11 rounded-xl bg-secondary/50 border-border/50 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                QR Code Customization
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Include Logo in QR</p>
                    <p className="text-sm text-muted-foreground">Display your logo in the center of QR codes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Custom Colors</p>
                    <p className="text-sm text-muted-foreground">Use brand colors for QR code patterns</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Notification Channels
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive scan alerts via email</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                      <Smartphone className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Get instant SMS when items are scanned</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Browser push notifications for real-time alerts</p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Message Templates
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Finder Message</Label>
                  <Textarea 
                    defaultValue="Hello! Someone has found your item and is trying to return it. Please check your FindR dashboard for details."
                    className="min-h-[100px] rounded-xl bg-secondary/50 border-border/50 resize-none"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Authentication
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Privacy Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hide Phone Number</p>
                    <p className="text-sm text-muted-foreground">Use masked calling instead of showing your number</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Anonymous Messaging</p>
                    <p className="text-sm text-muted-foreground">Hide your identity in finder messages</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="organization" className="space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Organization Details
              </h3>
              
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input 
                      defaultValue="Acme Corp" 
                      className="h-11 rounded-xl bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Input 
                      defaultValue="Technology" 
                      className="h-11 rounded-xl bg-secondary/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input 
                    defaultValue="123 Tech Street, San Francisco, CA 94102" 
                    className="h-11 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Billing Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-muted-foreground">Pro Plan - $12.99/month</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-border/50">
                    Upgrade
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground">Visa ending in 4242</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-border/50">
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
