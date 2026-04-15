"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, Phone, QrCode, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import {
  autoSignIn,
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  resendSignUpCode,
  signIn,
  signInWithRedirect,
  signOut,
  signUp,
} from "aws-amplify/auth"
import { syncCognitoAttributesFromToken } from "@/lib/auth-sync"

type AuthStep = "phone" | "otp"
type AuthMode = "signin" | "signup"
type AuthMethod = "email" | "phone"

const detectMethod = (value: string): AuthMethod => {
  if (!value.trim()) return "email"
  return /[A-Za-z@]/.test(value) ? "email" : "phone"
}

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<AuthStep>("phone")
  const [mode, setMode] = useState<AuthMode>("signin")
  const [method, setMethod] = useState<AuthMethod>("email")
  const [identifier, setIdentifier] = useState("")
  const [countryCode, setCountryCode] = useState("+91")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [pendingFlow, setPendingFlow] = useState<AuthMode>("signin")
  const [pendingMethod, setPendingMethod] = useState<AuthMethod>("phone")
  const [pendingIdentifier, setPendingIdentifier] = useState("")
  const [accountExists, setAccountExists] = useState(false)
  const [accountExistsMessage, setAccountExistsMessage] = useState("")
  const lastOtpSubmitted = useRef<string | null>(null)
  const identifierInputRef = useRef<HTMLInputElement | null>(null)

  const routeSignedInUser = async () => {
    const session = await fetchAuthSession()
    const payload = session.tokens?.idToken?.payload
    const groups = (payload?.["cognito:groups"] as string[] | undefined) ?? []

    if (session.tokens?.idToken) {
      router.replace("/dashboard")
      return
    }

    router.replace("/")
  }

  useEffect(() => {
    const run = async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          const session = await fetchAuthSession()
          if (session.tokens?.idToken) {
            await syncCognitoAttributesFromToken()
            try {
              await fetch("/api/auth/sync-user", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${session.tokens.idToken.toString()}`,
                },
              })
            } catch {
              // best-effort
            }
            const postLink = localStorage.getItem("ifound_post_link_redirect")
            if (postLink) {
              localStorage.removeItem("ifound_post_link_redirect")
              router.replace(postLink)
              return
            }
            await routeSignedInUser()
            return
          }
        } catch {
          // not signed in yet
        }

        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }

    try {
      void run()
    } catch {
      // no-op
    }
  }, [router])

  useEffect(() => {
    if (otp.length !== 6) {
      lastOtpSubmitted.current = null
      return
    }
    if (isLoading) return
    if (lastOtpSubmitted.current === otp) return
    lastOtpSubmitted.current = otp
    handleVerifyOTP()
  }, [otp, isLoading])

  const handleIdentifierChange = (value: string) => {
    const nextMethod = detectMethod(value)
    setMethod(nextMethod)
    setError("")
    setAccountExists(false)
    setAccountExistsMessage("")

    if (nextMethod === "phone") {
      setIdentifier(value.replace(/[^0-9]/g, ""))
      return
    }

    setIdentifier(value.trim().toLowerCase())
  }

  const getPhoneValue = () => `${countryCode}${identifier}`.replace(/\s+/g, "")

  const canSubmitPrimary = () => {
    if (method === "email") {
      if (!identifier || !identifier.includes("@")) return false
      if (!password) return false
      if (mode === "signup") {
        if (password.length < 8) return false
        if (password !== confirmPassword) return false
      }
      return true
    }

    return identifier.length >= 6
  }

  const handlePrimaryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return
    if (!canSubmitPrimary()) return
    handleSendOTP()
  }

  const handleSendOTP = async () => {
    const isEmail = method === "email"
    const phoneValue = getPhoneValue()

    if (isEmail) {
      if (!identifier || !identifier.includes("@")) {
        setError("Enter a valid email")
        return
      }
      if (!password) {
        setError("Password is required for email login")
        return
      }
      if (mode === "signup") {
        if (password.length < 8) {
          setError("Password must be at least 8 characters")
          return
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          return
        }
      }
    } else if (identifier.length < 6) {
      setError("Enter a valid phone number")
      return
    }

    setIsLoading(true)
    setError("")
    setAccountExists(false)
    setAccountExistsMessage("")

    try {
      if (isEmail) {
        if (mode === "signup") {
          await signUp({
            username: identifier,
            password,
            options: { userAttributes: { email: identifier }, autoSignIn: true },
          })
          setPendingFlow("signup")
          setPendingMethod("email")
          setPendingIdentifier(identifier)
          setStep("otp")
        } else {
          await signIn({ username: identifier, password })
          await routeSignedInUser()
        }
      } else if (mode === "signup") {
        const tempPassword = `Aa1!${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`
        await signUp({
          username: phoneValue,
          password: tempPassword,
          options: { userAttributes: { phone_number: phoneValue }, autoSignIn: true },
        })
        setPendingFlow("signup")
        setPendingMethod("phone")
        setPendingIdentifier(phoneValue)
        setStep("otp")
      } else {
        await signIn({ username: phoneValue })
        setPendingFlow("signin")
        setPendingMethod("phone")
        setPendingIdentifier(phoneValue)
        setStep("otp")
      }
    } catch (err: any) {
      const name = err?.name || err?.__type
      const msg = String(err?.message || "")
      if (
        mode === "signup" &&
        (name === "UsernameExistsException" ||
          msg.toLowerCase().includes("email already exists") ||
          msg.toLowerCase().includes("phone number already exists"))
      ) {
        setAccountExists(true)
        setAccountExistsMessage(msg || "We found an existing account with this email or phone.")
        setError("")
      } else {
        setError(err?.message || "Unable to continue")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      if (pendingFlow === "signup") {
        await confirmSignUp({ username: pendingIdentifier, confirmationCode: otp })
        try {
          await autoSignIn()
          await routeSignedInUser()
          return
        } catch {
          // fallback below
        }
        if (pendingMethod === "phone") {
          await signIn({ username: pendingIdentifier })
          setPendingFlow("signin")
          setOtp("")
          setError("Enter the new sign-in code we just sent.")
          return
        }
        await signIn({ username: pendingIdentifier, password })
        await routeSignedInUser()
      } else {
        await confirmSignIn({ challengeResponse: otp })
        await syncCognitoAttributesFromToken()
        try {
          const session = await fetchAuthSession()
          if (session.tokens?.idToken) {
            await fetch("/api/auth/sync-user", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.tokens.idToken.toString()}`,
              },
            })
          }
        } catch {
          // best-effort
        }
        await routeSignedInUser()
      }
    } catch (err: any) {
      setError(err?.message || "Invalid verification code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    try {
      if (pendingFlow === "signup") {
        await resendSignUpCode({ username: pendingIdentifier })
      } else {
        await signIn({ username: pendingIdentifier })
      }
    } catch (err: any) {
      setError(err?.message || "Unable to resend code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setIsLoading(true)
    setError("")
    try {
      const session = await fetchAuthSession()
      if (session.tokens?.idToken) {
        await routeSignedInUser()
        return
      }
      await signInWithRedirect({ provider: "Google" })
    } catch (err: any) {
      if (err?.name === "UserAlreadyAuthenticatedException") {
        await routeSignedInUser()
        return
      }
      setError(err?.message || "Google sign-in failed")
      setIsLoading(false)
    }
  }

  const handleApple = async () => {
    setIsLoading(true)
    setError("")
    try {
      const session = await fetchAuthSession()
      if (session.tokens?.idToken) {
        await routeSignedInUser()
        return
      }
      await signInWithRedirect({ provider: "Apple" })
    } catch (err: any) {
      if (err?.name === "UserAlreadyAuthenticatedException") {
        await routeSignedInUser()
        return
      }
      setError(err?.message || "Apple sign-in failed")
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    setError("")
    try {
      await signOut()
      router.replace("/login")
    } catch (err: any) {
      setError(err?.message || "Unable to sign out")
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === "otp") {
      setStep("phone")
      setOtp("")
      lastOtpSubmitted.current = null
    }
    setError("")
  }

  const handleContinueWithEmail = () => {
    setMode("signup")
    setMethod("email")
    setIdentifier("")
    setPassword("")
    setConfirmPassword("")
    setError("")
    setAccountExists(false)
    setAccountExistsMessage("")
    requestAnimationFrame(() => {
      identifierInputRef.current?.focus()
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_60%)]" />
        <div className="absolute -top-24 right-[-8rem] h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-8rem] left-[-6rem] h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <Link
        href="/"
        className="relative z-10 mx-auto inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 mx-auto mt-10 w-full max-w-md"
      >
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl" />

        <div className="relative rounded-[2rem] border border-border/50 bg-card/70 p-8 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                <QrCode className="h-7 w-7 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              iFound
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === "otp"
                ? "Verify your login"
                : "Sign in with phone, email, Google or Apple"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-border/50 bg-secondary/35 p-1">
                  <button
                    onClick={() => setMode("signin")}
                    className={`h-10 rounded-xl text-sm transition ${
                      mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className={`h-10 rounded-xl text-sm transition ${
                      mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Sign up
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 z-10 flex items-center transition-all ${
                        method === "phone"
                          ? "pointer-events-auto opacity-100"
                          : "pointer-events-none opacity-0"
                      }`}
                    >
                      <div className="ml-2 flex h-10 items-center gap-2 rounded-xl border border-border/50 bg-secondary/80 px-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="h-10 w-24 bg-transparent text-sm outline-none"
                          tabIndex={method === "phone" ? 0 : -1}
                        >
                          <option value="+91">+91 India</option>
                          <option value="+65">+65 Singapore</option>
                        </select>
                      </div>
                    </div>

                    <Input
                      type="text"
                      inputMode={method === "phone" ? "numeric" : "email"}
                      ref={identifierInputRef}
                      name="ifound-identifier"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-1p-ignore="true"
                      data-lpignore="true"
                      placeholder="Email or phone number"
                      value={identifier}
                      onChange={(e) => handleIdentifierChange(e.target.value)}
                      onKeyDown={handlePrimaryKeyDown}
                      className={`h-14 rounded-xl border-border/50 bg-secondary/50 text-lg focus:border-primary focus:ring-primary ${
                        method === "phone" ? "pl-40" : ""
                      }`}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {method === "email"
                      ? "Email detected. Password will be required."
                      : "Phone detected. We will send an OTP."}
                  </p>

                  {method === "email" && (
                    <>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError("")
                        }}
                        onKeyDown={handlePrimaryKeyDown}
                        className="h-12 rounded-xl border-border/50 bg-secondary/50 text-base focus:border-primary focus:ring-primary"
                      />
                      {mode === "signup" && (
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            setError("")
                          }}
                          onKeyDown={handlePrimaryKeyDown}
                          className="h-12 rounded-xl border-border/50 bg-secondary/50 text-base focus:border-primary focus:ring-primary"
                        />
                      )}
                    </>
                  )}

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}

                  {accountExists && (
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-sm">
                      <p className="font-medium text-foreground">
                        {accountExistsMessage || "We found an existing account with this email."}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Continue to sign in and link your account.
                      </p>
                      <Button className="mt-3 rounded-xl" onClick={() => setMode("signin")}>
                        Continue
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={handleSendOTP}
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-base hover:opacity-90"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "signup" ? "Create account" : "Continue"}
                  </Button>
                </div>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-4 text-muted-foreground">or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl border-border/50 bg-secondary/30 hover:bg-secondary/50"
                    onClick={handleGoogle}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl border-border/50 bg-secondary/30 hover:bg-secondary/50"
                    onClick={handleApple}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                    </svg>
                    Apple
                  </Button>
                </div>

                <div className="mt-6 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={handleContinueWithEmail}
                      className="text-sm text-primary transition-colors hover:underline"
                    >
                      Continue with Email
                    </button>
                    <Link
                      href="/scan"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Continue as Guest
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={handleBack}
                  className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change {pendingMethod === "phone" ? "number" : "email"}
                </button>

                <div className="mb-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                      <User className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    Enter verification code
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    We sent a code to {pendingIdentifier}
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-6">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => {
                      setOtp(value)
                      setError("")
                    }}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="h-14 w-12 rounded-xl border-border/50 bg-secondary/50 text-xl" />
                      <InputOTPSlot index={1} className="h-14 w-12 rounded-xl border-border/50 bg-secondary/50 text-xl" />
                      <InputOTPSlot index={2} className="h-14 w-12 rounded-xl border-border/50 bg-secondary/50 text-xl" />
                      <InputOTPSlot index={3} className="h-14 w-12 rounded-xl border-border/50 bg-secondary/50 text-xl" />
                      <InputOTPSlot index={4} className="h-14 w-12 rounded-xl border-border/50 bg-secondary/50 text-xl" />
                      <InputOTPSlot index={5} className="h-14 w-12 rounded-xl border-border/50 bg-secondary/50 text-xl" />
                    </InputOTPGroup>
                  </InputOTP>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.length !== 6}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-base hover:opacity-90"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : pendingFlow === "signup" ? "Verify & Sign in" : "Verify"}
                  </Button>

                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {"Didn't receive code?"} <span className="text-primary">Resend</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
