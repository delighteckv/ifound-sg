import type { DynamoDBStreamHandler } from "aws-lambda";
import {
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const dynamo = new DynamoDBClient({
  region: process.env.IFOUND_AWS_REGION || "ap-south-1",
});

const ANALYTICS_TABLE_NAME = process.env.IFOUND_ANALYTICS_TABLE_NAME || "";

const PAID_STATUSES = new Set(["PAID"]);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["ACTIVE"]);

type AnyRecord = Record<string, any>;

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function metricKey(base: string, suffix: string) {
  return `${base}#${suffix}`;
}

function getTableNameFromArn(arn?: string) {
  if (!arn) return "";
  const match = arn.match(/table\/([^/]+)\//);
  return match ? match[1] : "";
}

function ownerScope(ownerId?: string | null) {
  return ownerId ? `owner#${ownerId}` : "";
}

async function incrementMetric(scope: string, metric: string, delta: number) {
  if (!ANALYTICS_TABLE_NAME || !scope || !metric || !Number.isFinite(delta) || delta === 0) {
    return;
  }

  await dynamo.send(
    new UpdateItemCommand({
      TableName: ANALYTICS_TABLE_NAME,
      Key: marshall({ scope, metric }),
      UpdateExpression: "ADD #value :delta SET updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#value": "value",
      },
      ExpressionAttributeValues: marshall({
        ":delta": delta,
        ":updatedAt": new Date().toISOString(),
      }),
    }),
  );
}

async function incrementRecordMetrics(scope: string, table: string, delta: number, when?: Date) {
  if (!scope) return;
  const month = monthKey(when || new Date());
  const base = `records.${table}`;
  await Promise.all([
    incrementMetric(scope, metricKey(`${base}.total`, "all"), delta),
    incrementMetric(scope, metricKey(`${base}.monthly`, month), delta),
  ]);
}

async function handleScanEvent(eventName?: string, next?: AnyRecord | null, previous?: AnyRecord | null) {
  const record = next || previous;
  if (!record) return;
  const scope = ownerScope(record.ownerId);
  if (!scope) return;

  const occurredAt = new Date(record.scannedAt || new Date().toISOString());
  const month = monthKey(occurredAt);
  const newChannel = String(next?.channel || "");
  const oldChannel = String(previous?.channel || "");

  if (eventName === "INSERT" && next) {
    await incrementRecordMetrics(scope, "scanEvent", 1, occurredAt);

    if (newChannel === "CALL") {
      await Promise.all([
        incrementMetric(scope, metricKey("contacts.total", "all"), 1),
        incrementMetric(scope, metricKey("contacts.call", "all"), 1),
        incrementMetric(scope, metricKey("contacts.call.monthly", month), 1),
      ]);
      return;
    }

    await Promise.all([
      incrementMetric(scope, metricKey("scans.total", "all"), 1),
      incrementMetric(scope, metricKey("scans.monthly", month), 1),
    ]);
    return;
  }

  if (eventName === "REMOVE" && previous) {
    await incrementRecordMetrics(scope, "scanEvent", -1, occurredAt);

    if (oldChannel === "CALL") {
      await Promise.all([
        incrementMetric(scope, metricKey("contacts.total", "all"), -1),
        incrementMetric(scope, metricKey("contacts.call", "all"), -1),
        incrementMetric(scope, metricKey("contacts.call.monthly", month), -1),
      ]);
      return;
    }

    await Promise.all([
      incrementMetric(scope, metricKey("scans.total", "all"), -1),
      incrementMetric(scope, metricKey("scans.monthly", month), -1),
    ]);
  }
}

async function handleMessage(eventName?: string, next?: AnyRecord | null, previous?: AnyRecord | null) {
  const record = next || previous;
  if (!record) return;
  const scope = ownerScope(record.ownerId);
  if (!scope) return;

  const occurredAt = new Date(record.createdAt || new Date().toISOString());
  const month = monthKey(occurredAt);

  if (eventName === "INSERT" && next) {
    await Promise.all([
      incrementRecordMetrics(scope, "message", 1, occurredAt),
      incrementMetric(scope, metricKey("contacts.total", "all"), 1),
      incrementMetric(scope, metricKey("contacts.message", "all"), 1),
      incrementMetric(scope, metricKey("contacts.message.monthly", month), 1),
    ]);
    return;
  }

  if (eventName === "REMOVE" && previous) {
    await Promise.all([
      incrementRecordMetrics(scope, "message", -1, occurredAt),
      incrementMetric(scope, metricKey("contacts.total", "all"), -1),
      incrementMetric(scope, metricKey("contacts.message", "all"), -1),
      incrementMetric(scope, metricKey("contacts.message.monthly", month), -1),
    ]);
  }
}

async function handleOwnerPayment(eventName?: string, next?: AnyRecord | null, previous?: AnyRecord | null) {
  const record = next || previous;
  if (!record) return;
  const scope = ownerScope(record.ownerId);
  if (!scope) return;

  const occurredAt = new Date(record.createdAt || new Date().toISOString());
  const month = monthKey(occurredAt);
  const newPaid = PAID_STATUSES.has(String(next?.status || ""));
  const oldPaid = PAID_STATUSES.has(String(previous?.status || ""));
  const amount = Number(record.amount || 0) || 0;

  if (eventName === "INSERT" && next) {
    await incrementRecordMetrics(scope, "payment", 1, occurredAt);
    if (newPaid) {
      await Promise.all([
        incrementMetric(scope, metricKey("payments.paid", "all"), 1),
        incrementMetric(scope, metricKey("payments.paid.monthly", month), 1),
        incrementMetric(scope, metricKey("revenue.total", "all"), amount),
        incrementMetric(scope, metricKey("revenue.monthly", month), amount),
      ]);
    }
    return;
  }

  if (eventName === "MODIFY" && next && previous) {
    if (!oldPaid && newPaid) {
      await Promise.all([
        incrementMetric(scope, metricKey("payments.paid", "all"), 1),
        incrementMetric(scope, metricKey("payments.paid.monthly", month), 1),
        incrementMetric(scope, metricKey("revenue.total", "all"), amount),
        incrementMetric(scope, metricKey("revenue.monthly", month), amount),
      ]);
    }

    if (oldPaid && !newPaid) {
      const previousAmount = Number(previous.amount || 0) || 0;
      await Promise.all([
        incrementMetric(scope, metricKey("payments.paid", "all"), -1),
        incrementMetric(scope, metricKey("payments.paid.monthly", month), -1),
        incrementMetric(scope, metricKey("revenue.total", "all"), -previousAmount),
        incrementMetric(scope, metricKey("revenue.monthly", month), -previousAmount),
      ]);
    }
    return;
  }

  if (eventName === "REMOVE" && previous) {
    await incrementRecordMetrics(scope, "payment", -1, occurredAt);
    if (oldPaid) {
      const previousAmount = Number(previous.amount || 0) || 0;
      await Promise.all([
        incrementMetric(scope, metricKey("payments.paid", "all"), -1),
        incrementMetric(scope, metricKey("payments.paid.monthly", month), -1),
        incrementMetric(scope, metricKey("revenue.total", "all"), -previousAmount),
        incrementMetric(scope, metricKey("revenue.monthly", month), -previousAmount),
      ]);
    }
  }
}

async function handleOwnerSubscription(eventName?: string, next?: AnyRecord | null, previous?: AnyRecord | null) {
  const record = next || previous;
  if (!record) return;
  const scope = ownerScope(record.ownerId);
  if (!scope) return;

  const occurredAt = new Date(record.createdAt || new Date().toISOString());
  const month = monthKey(occurredAt);
  const newStatus = String(next?.status || "");
  const oldStatus = String(previous?.status || "");
  const newActive = ACTIVE_SUBSCRIPTION_STATUSES.has(newStatus);
  const oldActive = ACTIVE_SUBSCRIPTION_STATUSES.has(oldStatus);

  if (eventName === "INSERT" && next) {
    await Promise.all([
      incrementRecordMetrics(scope, "subscription", 1, occurredAt),
      incrementMetric(scope, metricKey("subscriptions.total", "all"), 1),
      incrementMetric(scope, metricKey(`subscriptions.status.${newStatus.toLowerCase() || "unknown"}`, "all"), 1),
    ]);

    if (newActive) {
      await Promise.all([
        incrementMetric(scope, metricKey("subscriptions.active", "all"), 1),
        incrementMetric(scope, metricKey("subscriptions.active.monthly", month), 1),
      ]);
    }
    return;
  }

  if (eventName === "MODIFY" && next && previous && newStatus !== oldStatus) {
    await Promise.all([
      incrementMetric(scope, metricKey(`subscriptions.status.${oldStatus.toLowerCase() || "unknown"}`, "all"), -1),
      incrementMetric(scope, metricKey(`subscriptions.status.${newStatus.toLowerCase() || "unknown"}`, "all"), 1),
    ]);

    if (!oldActive && newActive) {
      await Promise.all([
        incrementMetric(scope, metricKey("subscriptions.active", "all"), 1),
        incrementMetric(scope, metricKey("subscriptions.active.monthly", month), 1),
      ]);
    }

    if (oldActive && !newActive) {
      await Promise.all([
        incrementMetric(scope, metricKey("subscriptions.active", "all"), -1),
        incrementMetric(scope, metricKey("subscriptions.active.monthly", month), -1),
      ]);
    }
    return;
  }

  if (eventName === "REMOVE" && previous) {
    await Promise.all([
      incrementRecordMetrics(scope, "subscription", -1, occurredAt),
      incrementMetric(scope, metricKey("subscriptions.total", "all"), -1),
      incrementMetric(scope, metricKey(`subscriptions.status.${oldStatus.toLowerCase() || "unknown"}`, "all"), -1),
    ]);

    if (oldActive) {
      await Promise.all([
        incrementMetric(scope, metricKey("subscriptions.active", "all"), -1),
        incrementMetric(scope, metricKey("subscriptions.active.monthly", month), -1),
      ]);
    }
  }
}

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    if (!record.dynamodb) continue;

    const tableName = getTableNameFromArn(record.eventSourceARN);
    const next = record.dynamodb.NewImage
      ? (unmarshall(record.dynamodb.NewImage as any) as AnyRecord)
      : null;
    const previous = record.dynamodb.OldImage
      ? (unmarshall(record.dynamodb.OldImage as any) as AnyRecord)
      : null;

    if (tableName.startsWith("ScanEvent-")) {
      await handleScanEvent(record.eventName, next, previous);
      continue;
    }

    if (tableName.startsWith("Message-")) {
      await handleMessage(record.eventName, next, previous);
      continue;
    }

    if (tableName.startsWith("OwnerPayment-")) {
      await handleOwnerPayment(record.eventName, next, previous);
      continue;
    }

    if (tableName.startsWith("OwnerSubscription-")) {
      await handleOwnerSubscription(record.eventName, next, previous);
    }
  }
};
