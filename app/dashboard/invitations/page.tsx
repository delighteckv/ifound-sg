"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { fetchAuthSession } from "aws-amplify/auth"
import outputs from "@/amplify_outputs.json"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, KeyRound, CheckCircle2, XCircle } from "lucide-react"

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

type AccessInviteRecord = {
  code: string
  ownerId: string
  valuableId: string
  canViewScanInfo?: boolean | null
  canReceiveNotifications?: boolean | null
  canReceiveCalls?: boolean | null
  status?: string | null
  createdAt?: string | null
  expiresAt?: string | null
  acceptedAt?: string | null
  acceptedByUserId?: string | null
}

type ValuableRecord = {
  id: string
  ownerId: string
  name?: string | null
  category?: string | null
}

type UserRecord = {
  cognitoId: string
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

type AccessRecord = {
  id: string
  ownerId: string
  valuableId: string
  granteeUserId: string
  canViewScanInfo?: boolean | null
  canReceiveNotifications?: boolean | null
  canReceiveCalls?: boolean | null
}

type ActiveAccessView = {
  id: string
  itemName: string
  ownerLabel: string
  permissions: string[]
}

const getInviteQuery = /* GraphQL */ `
  query GetValuableAccessInvite($code: String!) {
    getValuableAccessInvite(code: $code) {
      code
      ownerId
      valuableId
      canViewScanInfo
      canReceiveNotifications
      canReceiveCalls
      status
      createdAt
      expiresAt
      acceptedAt
      acceptedByUserId
    }
  }
`

const getValuableQuery = /* GraphQL */ `
  query GetValuableForInvite($id: ID!) {
    getValuable(id: $id) {
      id
      ownerId
      name
      category
    }
  }
`

const getUserQuery = /* GraphQL */ `
  query GetUserForInvite($cognitoId: ID!) {
    getUser(cognitoId: $cognitoId) {
      cognitoId
      displayName
      firstName
      lastName
      email
    }
  }
`

const valuableAccessByGranteeQuery = /* GraphQL */ `
  query ValuableAccessByGranteeInvites($granteeUserId: ID!, $limit: Int) {
    ValuableAccessByGrantee(granteeUserId: $granteeUserId, limit: $limit) {
      items {
        id
        ownerId
        valuableId
        granteeUserId
        canViewScanInfo
        canReceiveNotifications
        canReceiveCalls
      }
    }
  }
`

const valuableAccessByValuableQuery = /* GraphQL */ `
  query ValuableAccessByValuableInvites($valuableId: ID!, $limit: Int) {
    ValuableAccessByValuable(valuableId: $valuableId, limit: $limit) {
      items {
        id
        ownerId
        valuableId
        granteeUserId
        canViewScanInfo
        canReceiveNotifications
        canReceiveCalls
      }
    }
  }
`

const createValuableAccessMutation = /* GraphQL */ `
  mutation CreateValuableAccessFromInvite($input: CreateValuableAccessInput!) {
    createValuableAccess(input: $input) {
      id
    }
  }
`

const updateValuableAccessInviteMutation = /* GraphQL */ `
  mutation UpdateValuableAccessInviteFromInvite($input: UpdateValuableAccessInviteInput!) {
    updateValuableAccessInvite(input: $input) {
      code
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

function getUserLabel(user?: UserRecord | null) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  return user?.displayName || fullName || user?.email || user?.cognitoId || "Owner"
}

function invitePermissions(invite: Pick<AccessInviteRecord, "canViewScanInfo" | "canReceiveNotifications" | "canReceiveCalls">) {
  return [
    invite.canViewScanInfo ? "Scan info" : null,
    invite.canReceiveNotifications ? "Messages" : null,
    invite.canReceiveCalls ? "Calls" : null,
  ].filter(Boolean) as string[]
}

export default function InvitationsPage() {
  const [userId, setUserId] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [code, setCode] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [invite, setInvite] = useState<AccessInviteRecord | null>(null)
  const [inviteItem, setInviteItem] = useState<ValuableRecord | null>(null)
  const [inviteOwner, setInviteOwner] = useState<UserRecord | null>(null)
  const [activeAccess, setActiveAccess] = useState<ActiveAccessView[]>([])

  const permissions = useMemo(() => invite ? invitePermissions(invite) : [], [invite])

  const loadActiveAccess = async (currentToken: string, currentUserId: string) => {
    const accessData = await runAuthenticatedGraphQL<{ ValuableAccessByGrantee: { items: AccessRecord[] } }>(
      currentToken,
      valuableAccessByGranteeQuery,
      { granteeUserId: currentUserId, limit: 200 },
    )

    const views = await Promise.all(
      (accessData.ValuableAccessByGrantee.items || []).map(async (entry) => {
        const [valuableData, ownerData] = await Promise.all([
          runAuthenticatedGraphQL<{ getValuable: ValuableRecord | null }>(currentToken, getValuableQuery, { id: entry.valuableId }),
          runAuthenticatedGraphQL<{ getUser: UserRecord | null }>(currentToken, getUserQuery, { cognitoId: entry.ownerId }),
        ])

        return {
          id: entry.id,
          itemName: valuableData.getValuable?.name || valuableData.getValuable?.category || entry.valuableId,
          ownerLabel: getUserLabel(ownerData.getUser),
          permissions: invitePermissions(entry),
        } satisfies ActiveAccessView
      }),
    )

    setActiveAccess(views)
  }

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        const session = await fetchAuthSession()
        const sub = session.tokens?.idToken?.payload?.sub as string | undefined
        const token = session.tokens?.accessToken?.toString() || ""
        if (!sub || !token) {
          throw new Error("User session is not available")
        }

        if (!active) return
        setUserId(sub)
        setAccessToken(token)
        await loadActiveAccess(token, sub)
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Unable to load invitations")
        }
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [])

  const handleLookup = async () => {
    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode || !accessToken) {
      setError("Enter an invitation code")
      return
    }

    setLookupLoading(true)
    setError("")
    setSuccess("")
    try {
      const inviteData = await runAuthenticatedGraphQL<{ getValuableAccessInvite: AccessInviteRecord | null }>(
        accessToken,
        getInviteQuery,
        { code: normalizedCode },
      )
      const foundInvite = inviteData.getValuableAccessInvite
      if (!foundInvite) {
        throw new Error("Invitation code was not found")
      }
      if (foundInvite.status !== "PENDING") {
        throw new Error(`Invitation is ${String(foundInvite.status || "not available").toLowerCase()}`)
      }
      if (foundInvite.expiresAt && new Date(foundInvite.expiresAt).getTime() < Date.now()) {
        throw new Error("Invitation has expired")
      }
      if (foundInvite.ownerId === userId) {
        throw new Error("You cannot accept your own invitation")
      }

      const [valuableData, ownerData] = await Promise.all([
        runAuthenticatedGraphQL<{ getValuable: ValuableRecord | null }>(accessToken, getValuableQuery, { id: foundInvite.valuableId }),
        runAuthenticatedGraphQL<{ getUser: UserRecord | null }>(accessToken, getUserQuery, { cognitoId: foundInvite.ownerId }),
      ])

      setInvite(foundInvite)
      setInviteItem(valuableData.getValuable)
      setInviteOwner(ownerData.getUser)
    } catch (err: any) {
      setInvite(null)
      setInviteItem(null)
      setInviteOwner(null)
      setError(err?.message || "Unable to validate invitation")
    } finally {
      setLookupLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invite || !inviteItem || !accessToken || !userId) {
      setError("Load an invitation first")
      return
    }

    setSubmitLoading(true)
    setError("")
    setSuccess("")
    try {
      const existingAccessData = await runAuthenticatedGraphQL<{ ValuableAccessByValuable: { items: AccessRecord[] } }>(
        accessToken,
        valuableAccessByValuableQuery,
        { valuableId: invite.valuableId, limit: 200 },
      )

      const existing = (existingAccessData.ValuableAccessByValuable.items || []).find(
        (entry) => entry.granteeUserId === userId,
      )

      if (!existing) {
        await runAuthenticatedGraphQL(accessToken, createValuableAccessMutation, {
          input: {
            ownerId: invite.ownerId,
            valuableId: invite.valuableId,
            granteeUserId: userId,
            canViewScanInfo: invite.canViewScanInfo ?? true,
            canReceiveNotifications: invite.canReceiveNotifications ?? true,
            canReceiveCalls: invite.canReceiveCalls ?? false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      }

      await runAuthenticatedGraphQL(accessToken, updateValuableAccessInviteMutation, {
        input: {
          code: invite.code,
          status: "ACCEPTED",
          acceptedByUserId: userId,
          acceptedAt: new Date().toISOString(),
        },
      })

      setSuccess(`Invitation ${invite.code} accepted`)
      setInvite(null)
      setInviteItem(null)
      setInviteOwner(null)
      setCode("")
      await loadActiveAccess(accessToken, userId)
    } catch (err: any) {
      setError(err?.message || "Unable to accept invitation")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReject = async () => {
    if (!invite || !accessToken) {
      setError("Load an invitation first")
      return
    }

    setSubmitLoading(true)
    setError("")
    setSuccess("")
    try {
      await runAuthenticatedGraphQL(accessToken, updateValuableAccessInviteMutation, {
        input: {
          code: invite.code,
          status: "REJECTED",
          rejectedAt: new Date().toISOString(),
        },
      })
      setSuccess(`Invitation ${invite.code} rejected`)
      setInvite(null)
      setInviteItem(null)
      setInviteOwner(null)
      setCode("")
    } catch (err: any) {
      setError(err?.message || "Unable to reject invitation")
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Invitations
          </h1>
          <p className="text-muted-foreground">
            Accept item access using an invitation code. Your login method can be phone, email, Google, or Apple.
          </p>
        </motion.div>
      </div>

      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div> : null}
      {success ? <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent">{success}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>Accept Invitation</h2>
              <p className="text-sm text-muted-foreground">Enter the code shared by the item owner.</p>
            </div>
            <div className="space-y-2">
              <Label>Invitation code</Label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="IFD-XXXXXX"
                className="h-11 rounded-xl border-border/50 bg-secondary/50 font-mono"
              />
            </div>
            <Button onClick={handleLookup} disabled={lookupLoading} className="h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Validate Code
            </Button>

            {invite && inviteItem ? (
              <div className="space-y-4 rounded-xl border border-border/50 bg-secondary/20 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{inviteItem.name || inviteItem.category || inviteItem.id}</p>
                  <p className="text-xs text-muted-foreground">Shared by {getUserLabel(inviteOwner)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="bg-primary/15 text-primary">
                      {permission}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Expires {invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : "soon"}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleAccept} disabled={submitLoading} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                    {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Accept
                  </Button>
                  <Button onClick={handleReject} disabled={submitLoading} variant="outline" className="rounded-xl border-border/50">
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>Active Shared Access</h2>
              <p className="text-sm text-muted-foreground">Items other owners already shared with your account.</p>
            </div>
            {activeAccess.length ? (
              <div className="space-y-3">
                {activeAccess.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                    <p className="text-sm font-medium text-foreground">{entry.itemName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Owner: {entry.ownerLabel}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="bg-primary/15 text-primary">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
                No accepted shared access on this account yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
