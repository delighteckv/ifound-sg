"use client"

import { useEffect, useState } from "react"
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
import {
  confirmUserAttribute,
  confirmResetPassword,
  fetchUserAttributes,
  resetPassword,
  signInWithRedirect,
  signOut,
  updateUserAttributes,
} from "aws-amplify/auth"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState("")
  const [accountSuccess, setAccountSuccess] = useState("")
  const [email, setEmail] = useState("")
  const [draftEmail, setDraftEmail] = useState("")
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [emailCode, setEmailCode] = useState("")
  const [showEmailVerify, setShowEmailVerify] = useState(false)
  const [phone, setPhone] = useState("")
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null)
  const [phoneCode, setPhoneCode] = useState("")
  const [showPhoneVerify, setShowPhoneVerify] = useState(false)
  const [linkedProviders, setLinkedProviders] = useState<string[]>([])
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const isGoogleLinked = linkedProviders.includes("Google")
  const isAppleLinked = linkedProviders.includes("SignInWithApple") || linkedProviders.includes("Apple")

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
  }

  const loadAccount = async () => {
    setAccountLoading(true)
    setAccountError("")
    setAccountSuccess("")
    try {
      const attrs = await fetchUserAttributes()
      const identitiesRaw = attrs.identities
      const identities = identitiesRaw ? JSON.parse(identitiesRaw) : []
      const providers = Array.isArray(identities)
        ? identities.map((i: any) => i.providerName).filter(Boolean)
        : []

      setEmail(attrs.email ?? "")
      setDraftEmail(attrs.email ?? "")
      setEmailVerified(attrs.email_verified === "true")
      setPhone(attrs.phone_number ?? "")
      setPhoneVerified(attrs.phone_number_verified === "true")
      setLinkedProviders(Array.from(new Set(providers)))
    } catch (err: any) {
      setAccountError(err?.message || "Unable to load account data")
    } finally {
      setAccountLoading(false)
    }
  }

  useEffect(() => {
    loadAccount()
  }, [])

  const handleUpdatePhone = async () => {
    setAccountLoading(true)
    setAccountError("")
    setAccountSuccess("")
    try {
      const result = await updateUserAttributes({
        userAttributes: {
          phone_number: phone,
        },
      })
      const phoneStep = result.phone_number
      setPhoneVerified(false)
      setShowPhoneVerify(
        phoneStep?.nextStep?.updateAttributeStep === "CONFIRM_ATTRIBUTE_WITH_CODE",
      )
      setAccountSuccess(
        phoneStep?.nextStep?.updateAttributeStep === "CONFIRM_ATTRIBUTE_WITH_CODE"
          ? "Verification code sent to your phone."
          : "Phone number updated.",
      )
    } catch (err: any) {
      setAccountError(err?.message || "Unable to update phone number")
    } finally {
      setAccountLoading(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!draftEmail) return
    setAccountLoading(true)
    setAccountError("")
    setAccountSuccess("")
    try {
      const result = await updateUserAttributes({
        userAttributes: {
          email: draftEmail,
        },
      })
      setEmail(draftEmail)
      setEmailVerified(false)
      const emailStep = result.email
      setShowEmailVerify(
        emailStep?.nextStep?.updateAttributeStep === "CONFIRM_ATTRIBUTE_WITH_CODE",
      )
      setAccountSuccess(
        emailStep?.nextStep?.updateAttributeStep === "CONFIRM_ATTRIBUTE_WITH_CODE"
          ? "Verification code sent to your email."
          : "Email updated.",
      )
    } catch (err: any) {
      setAccountError(err?.message || "Unable to update email")
    } finally {
      setAccountLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!emailCode) return
    setAccountLoading(true)
    setAccountError("")
    setAccountSuccess("")
    try {
      await confirmUserAttribute({
        userAttributeKey: "email",
        confirmationCode: emailCode,
      })
      setEmailVerified(true)
      setShowEmailVerify(false)
      setEmailCode("")
      setAccountSuccess("Email verified.")
      await loadAccount()
    } catch (err: any) {
      setAccountError(err?.message || "Invalid verification code")
    } finally {
      setAccountLoading(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!phoneCode) return
    setAccountLoading(true)
    setAccountError("")
    setAccountSuccess("")
    try {
      await confirmUserAttribute({
        userAttributeKey: "phone_number",
        confirmationCode: phoneCode,
      })
      setPhoneVerified(true)
      setShowPhoneVerify(false)
      setPhoneCode("")
      setAccountSuccess("Phone number verified.")
      await loadAccount()
    } catch (err: any) {
      setAccountError(err?.message || "Invalid verification code")
    } finally {
      setAccountLoading(false)
    }
  }

  const handleSendPasswordReset = async () => {
    if (!email) return
    setAccountLoading(true)
    setAccountError("")
    setAccountSuccess("")
    try {
      await resetPassword({ username: email })
      setShowResetConfirm(true)
      setAccountSuccess("Password reset code sent to your email.")
    } catch (err: any) {
      setAccountError(err?.message || "Unable to send password reset code")
    } finally {
      setAccountLoading(false)
    }
  }

  const handleConfirmPasswordReset = async () => {
    if (!email || !resetCode || !newPassword) return
    setAccountLoading(true)
    setAccountError("")
    setAccountSuccess("")
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: resetCode,
        newPassword,
      })
      setShowResetConfirm(false)
      setResetCode("")
      setNewPassword("")
      setAccountSuccess("Password updated. You can now sign in with email.")
    } catch (err: any) {
      setAccountError(err?.message || "Unable to update password")
    } finally {
      setAccountLoading(false)
    }
  }

  const handleLinkGoogle = async () => {
    setAccountError("")
    setAccountSuccess("")
    localStorage.setItem("ifound_post_link_redirect", "/dashboard/settings")
    await signOut()
    await signInWithRedirect({ provider: "Google" })
  }

  const handleLinkApple = async () => {
    setAccountError("")
    setAccountSuccess("")
    localStorage.setItem("ifound_post_link_redirect", "/dashboard/settings")
    await signOut()
    await signInWithRedirect({ provider: "Apple" })
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
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-secondary/50 rounded-xl p-1">
            <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-background">
              <Shield className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
           
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-background">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              </TabsTrigger>
             {/*
             
            <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
           
            <TabsTrigger value="branding" className="rounded-lg data-[state=active]:bg-background">
              <Palette className="mr-2 h-4 w-4" />
              Branding
            </TabsTrigger>
             <TabsTrigger value="organization" className="rounded-lg data-[state=active]:bg-background">
              <Building2 className="mr-2 h-4 w-4" />
              Organization
            </TabsTrigger>
            */}
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Account Settings
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value.trim().toLowerCase())}
                    placeholder="name@example.com"
                    className="h-11 rounded-xl bg-secondary/50 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    {emailVerified ? "Email verified" : "Email not verified"}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl border-border/50"
                      onClick={handleUpdateEmail}
                      disabled={accountLoading || !draftEmail}
                    >
                      {email ? "Update Email" : "Add Email"}
                    </Button>
                    {!emailVerified && !email && (
                      <span className="text-xs text-amber-600">
                        Google did not provide email. Add one to enable email sign-in and recovery.
                      </span>
                    )}
                  </div>
                </div>

                {showEmailVerify && (
                  <div className="space-y-2">
                    <Label>Verify Email</Label>
                    <div className="flex gap-3">
                      <Input
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        placeholder="Enter code"
                        className="h-11 rounded-xl bg-secondary/50 border-border/50"
                      />
                      <Button
                        onClick={handleVerifyEmail}
                        className="rounded-xl"
                        disabled={accountLoading || emailCode.length < 4}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="h-11 rounded-xl bg-secondary/50 border-border/50"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl border-border/50"
                      onClick={handleUpdatePhone}
                      disabled={accountLoading || !phone}
                    >
                      {phoneVerified ? "Update Phone" : "Add Phone"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {phoneVerified ? "Verified" : "Not verified"}
                    </span>
                  </div>
                </div>

                {showPhoneVerify && (
                  <div className="space-y-2">
                    <Label>Verify Phone</Label>
                    <div className="flex gap-3">
                      <Input
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        placeholder="Enter code"
                        className="h-11 rounded-xl bg-secondary/50 border-border/50"
                      />
                      <Button
                        onClick={handleVerifyPhone}
                        className="rounded-xl"
                        disabled={accountLoading || phoneCode.length < 4}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <Label>Linked Providers</Label>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {linkedProviders.length === 0 && (
                      <span className="text-muted-foreground">None linked yet</span>
                    )}
                    {linkedProviders.map((p) => (
                      <span key={p} className="rounded-full border border-border/50 px-3 py-1">
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    {isGoogleLinked ? (
                      <span className="rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 text-sm">
                        Linked With Google
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        className="rounded-xl border-border/50"
                        onClick={handleLinkGoogle}
                      >
                        Link Google
                      </Button>
                    )}
                    {isAppleLinked ? (
                      <span className="rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 text-sm">
                        Linked With Apple
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        className="rounded-xl border-border/50"
                        onClick={handleLinkApple}
                      >
                        Link Apple
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We will link providers to your account by matching email or phone.
                  </p>
                </div>

                {accountError && (
                  <p className="text-sm text-destructive">{accountError}</p>
                )}
                {accountSuccess && (
                  <p className="text-sm text-green-600">{accountSuccess}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Password
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="rounded-xl border-border/50"
                  onClick={handleSendPasswordReset}
                  disabled={accountLoading || !email}
                >
                  Send Password Reset Code
                </Button>
                {showResetConfirm && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Reset code"
                      className="h-11 rounded-xl bg-secondary/50 border-border/50"
                    />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="h-11 rounded-xl bg-secondary/50 border-border/50"
                    />
                    <Button
                      className="rounded-xl md:col-span-2"
                      onClick={handleConfirmPasswordReset}
                      disabled={accountLoading || !resetCode || !newPassword}
                    >
                      Confirm New Password
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

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
                      defaultValue="iFound Inc." 
                      className="h-11 rounded-xl bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input 
                      defaultValue="support@iFound.io" 
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
                    defaultValue="Hello! Someone has found your item and is trying to return it. Please check your iFound dashboard for details."
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
