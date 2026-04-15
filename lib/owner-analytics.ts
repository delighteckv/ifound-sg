import outputs from "@/amplify_outputs.json"

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

export type AnalyticsStatRecord = {
  scope: string
  metric: string
  value: number
  updatedAt?: string | null
}

export type PaymentRecord = {
  id: string
  ownerId: string
  amount: number
  currency: string
  status?: string | null
  gateway?: string | null
  externalId?: string | null
  subscriptionId?: string | null
  createdAt?: string | null
}

export type SubscriptionRecord = {
  id: string
  ownerId: string
  planId: string
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  gateway?: string | null
  externalId?: string | null
  createdAt?: string | null
}

export type ValuableRecord = {
  id: string
  name: string
  qrCodeId?: string | null
}

export type QrCodeRecord = {
  code: string
  valuableId?: string | null
  label?: string | null
}

export type ScanRecord = {
  id: string
  qrCodeId: string
  valuableId?: string | null
  scannedAt: string
  locationText?: string | null
  channel?: "CALL" | "MESSAGE" | "UNKNOWN" | null
  resolved?: boolean | null
}

export type MessageRecord = {
  id: string
  valuableId: string
  content: string
  createdAt?: string | null
  finderContact?: string | null
}

const analyticsByScopeQuery = /* GraphQL */ `
  query ListAnalyticsStatsByScope($scope: String!, $limit: Int, $nextToken: String) {
    listAnalyticsStats(filter: { scope: { eq: $scope } }, limit: $limit, nextToken: $nextToken) {
      items {
        scope
        metric
        value
        updatedAt
      }
      nextToken
    }
  }
`

const ownerPaymentsQuery = /* GraphQL */ `
  query OwnerPaymentsByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    OwnerPaymentsByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        ownerId
        amount
        currency
        status
        gateway
        externalId
        subscriptionId
        createdAt
      }
    }
  }
`

const ownerSubscriptionsQuery = /* GraphQL */ `
  query OwnerSubscriptionsByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    OwnerSubscriptionsByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        ownerId
        planId
        status
        startDate
        endDate
        gateway
        externalId
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
        name
        qrCodeId
      }
    }
  }
`

const qrCodesByOwnerQuery = /* GraphQL */ `
  query QrCodesByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    QrCodesByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        code
        valuableId
        label
      }
    }
  }
`

const scansByOwnerQuery = /* GraphQL */ `
  query ScansByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    ScansByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        qrCodeId
        valuableId
        scannedAt
        locationText
        channel
        resolved
      }
    }
  }
`

const messagesByOwnerQuery = /* GraphQL */ `
  query MessagesByOwner($ownerId: ID!, $limit: Int, $nextToken: String) {
    MessagesByOwner(ownerId: $ownerId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        valuableId
        content
        createdAt
        finderContact
      }
    }
  }
`

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": outputs.data.api_key,
  }
}

export async function runPublicGraphQL<T>(
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

export async function loadOwnerAnalytics(scope: string) {
  const data = await runPublicGraphQL<{
    listAnalyticsStats: { items: AnalyticsStatRecord[] }
  }>(analyticsByScopeQuery, {
    scope,
    limit: 1000,
  })

  return data.listAnalyticsStats.items || []
}

export async function loadOwnerPayments(ownerId: string) {
  const data = await runPublicGraphQL<{
    OwnerPaymentsByOwner: { items: PaymentRecord[] }
  }>(ownerPaymentsQuery, {
    ownerId,
    limit: 200,
  })

  return data.OwnerPaymentsByOwner.items || []
}

export async function loadOwnerSubscriptions(ownerId: string) {
  const data = await runPublicGraphQL<{
    OwnerSubscriptionsByOwner: { items: SubscriptionRecord[] }
  }>(ownerSubscriptionsQuery, {
    ownerId,
    limit: 200,
  })

  return data.OwnerSubscriptionsByOwner.items || []
}

export async function loadOwnerActivitySupport(ownerId: string) {
  const [valuablesData, qrCodesData, scansData, messagesData] = await Promise.all([
    runPublicGraphQL<{ ValuablesByOwner: { items: ValuableRecord[] } }>(valuablesByOwnerQuery, {
      ownerId,
      limit: 200,
    }),
    runPublicGraphQL<{ QrCodesByOwner: { items: QrCodeRecord[] } }>(qrCodesByOwnerQuery, {
      ownerId,
      limit: 200,
    }),
    runPublicGraphQL<{ ScansByOwner: { items: ScanRecord[] } }>(scansByOwnerQuery, {
      ownerId,
      limit: 200,
    }),
    runPublicGraphQL<{ MessagesByOwner: { items: MessageRecord[] } }>(messagesByOwnerQuery, {
      ownerId,
      limit: 200,
    }),
  ])

  return {
    valuables: valuablesData.ValuablesByOwner.items || [],
    qrCodes: qrCodesData.QrCodesByOwner.items || [],
    scans: scansData.ScansByOwner.items || [],
    messages: messagesData.MessagesByOwner.items || [],
  }
}

export function metricValue(stats: AnalyticsStatRecord[], metric: string) {
  return stats.find((entry) => entry.metric === metric)?.value ?? 0
}

export function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}
