import type { AppSyncResolverHandler } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  AdminLinkProviderForUserCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  GetItemCommand,
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";

const USER_TABLE = process.env.USER_TABLE_NAME || "";
const USER_POOL_ID = process.env.USER_POOL_ID || "";
const REGION = process.env.AWS_REGION || "ap-south-1";

if (!USER_TABLE || !USER_POOL_ID) {
  throw new Error("Missing USER_TABLE_NAME or USER_POOL_ID env var");
}

const db = new DynamoDBClient({ region: REGION });
const cognito = new CognitoIdentityProviderClient({ region: REGION });

type IdentityProviderInfo = {
  providerName: string;
  userId: string;
};

type SyncResult = {
  userId: string;
  action: string;
  providers: string[];
};

function parseIdentities(raw?: string): IdentityProviderInfo[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((i) => ({
        providerName: i?.providerName || i?.providerType,
        userId: i?.userId,
      }))
      .filter((i) => i.providerName && i.userId);
  } catch {
    return [];
  }
}

async function findUserByEmailOrPhone(email?: string, phone?: string) {
  if (!email && !phone) return null;
  // Use scan to avoid relying on unknown GSI names. For production, add explicit GSIs.
  const filterParts: string[] = [];
  const values: Record<string, any> = {};

  if (email) {
    filterParts.push("email = :email");
    values[":email"] = { S: email };
  }
  if (phone) {
    filterParts.push("phone = :phone");
    values[":phone"] = { S: phone };
  }

  const res = await db.send(
    new ScanCommand({
      TableName: USER_TABLE,
      FilterExpression: filterParts.join(" OR "),
      ExpressionAttributeValues: values,
      Limit: 1,
    })
  );

  const item = res.Items?.[0];
  return item ? (unmarshall(item) as any) : null;
}

async function findUserByCognitoId(cognitoId: string) {
  const res = await db.send(
    new GetItemCommand({
      TableName: USER_TABLE,
      Key: marshall({ cognitoId }),
      ConsistentRead: true,
    })
  );

  return res.Item ? (unmarshall(res.Item) as any) : null;
}

async function upsertUserRecord(params: {
  cognitoId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  providers: string[];
}) {
  const { cognitoId, email, phone, firstName, lastName, displayName, providers } = params;
  const now = new Date().toISOString();
  const existing = await findUserByCognitoId(cognitoId);
  const mergedProviders = Array.from(
    new Set([...(existing?.providers ?? []), ...providers].filter(Boolean))
  );

  if (!existing) {
    await db.send(
      new PutItemCommand({
        TableName: USER_TABLE,
        Item: marshall({
          cognitoId,
          email: email ?? null,
          phone: phone ?? null,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          displayName: displayName ?? null,
          providers: mergedProviders,
          createdAt: now,
          updatedAt: now,
        }),
      })
    );
    return;
  }

  await db.send(
    new UpdateItemCommand({
      TableName: USER_TABLE,
      Key: marshall({ cognitoId }),
      UpdateExpression:
        "SET #email = :email, #phone = :phone, #firstName = :firstName, #lastName = :lastName, #displayName = :displayName, #providers = :providers, updatedAt = :now",
      ExpressionAttributeNames: {
        "#email": "email",
        "#phone": "phone",
        "#firstName": "firstName",
        "#lastName": "lastName",
        "#displayName": "displayName",
        "#providers": "providers",
      },
      ExpressionAttributeValues: marshall({
        ":email": email ?? existing.email ?? null,
        ":phone": phone ?? existing.phone ?? null,
        ":firstName": firstName ?? existing.firstName ?? null,
        ":lastName": lastName ?? existing.lastName ?? null,
        ":displayName": displayName ?? existing.displayName ?? null,
        ":providers": mergedProviders,
        ":now": now,
      }),
    })
  );
}

async function updateCognitoAttributes(params: {
  username: string;
  email?: string;
  phone?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
}) {
  const { username, email, phone, name, givenName, familyName } = params;
  const updates: { Name: string; Value: string }[] = [];

  if (email) {
    updates.push({ Name: "email", Value: email });
    updates.push({ Name: "email_verified", Value: "true" });
  }
  if (phone) {
    updates.push({ Name: "phone_number", Value: phone });
    updates.push({ Name: "phone_number_verified", Value: "true" });
  }
  if (name) updates.push({ Name: "name", Value: name });
  if (givenName) updates.push({ Name: "given_name", Value: givenName });
  if (familyName) updates.push({ Name: "family_name", Value: familyName });

  if (!updates.length) return;

  await cognito.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: updates,
    })
  );
}

export const handler: AppSyncResolverHandler<{}, SyncResult> = async (event) => {
  const claims = (event.identity as any)?.claims ?? {};
  const sub = claims.sub as string | undefined;
  if (!sub) throw new Error("Missing Cognito sub");

  const email = claims.email as string | undefined;
  const phone = claims.phone_number as string | undefined;
  const name = claims.name as string | undefined;
  const givenName = claims.given_name as string | undefined;
  const familyName = claims.family_name as string | undefined;

  const identitiesRaw = claims.identities as string | undefined;
  const identities = parseIdentities(identitiesRaw);

  const provider = identities[0]?.providerName ?? "Cognito";
  const providerUserId = identities[0]?.userId;

  // 1) Find an existing user by email/phone
  const existingUser = await findUserByEmailOrPhone(email, phone);

  // 2) Decide target user
  const targetCognitoId = existingUser?.cognitoId ?? sub;
  const actionParts: string[] = [];

  // 3) Link external provider to existing Cognito user if needed
  if (existingUser && existingUser.cognitoId && existingUser.cognitoId !== sub) {
    if (provider !== "Cognito" && providerUserId) {
      await cognito.send(
        new AdminLinkProviderForUserCommand({
          UserPoolId: USER_POOL_ID,
          DestinationUser: {
            ProviderName: "Cognito",
            ProviderAttributeName: "Cognito_Subject",
            ProviderAttributeValue: existingUser.cognitoId,
          },
          SourceUser: {
            ProviderName: provider,
            ProviderAttributeName: "Cognito_Subject",
            ProviderAttributeValue: providerUserId,
          },
        })
      );
      actionParts.push("linked_external_provider");
    } else {
      // For Cognito->Cognito duplicates we cannot link. Keep target as existing user.
      actionParts.push("duplicate_cognito_user_detected");
    }
  }

  // 4) Update Cognito attributes on target user
  await updateCognitoAttributes({
    username: targetCognitoId,
    email,
    phone,
    name,
    givenName,
    familyName,
  });

  // 5) Upsert user record in DynamoDB
  const providers = Array.from(new Set([provider]));
  await upsertUserRecord({
    cognitoId: targetCognitoId,
    email,
    phone,
    firstName: givenName,
    lastName: familyName,
    displayName: name,
    providers,
  });

  return {
    userId: targetCognitoId,
    action: actionParts.length ? actionParts.join("|") : "synced",
    providers,
  };
};
