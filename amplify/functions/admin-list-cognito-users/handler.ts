import type { AppSyncResolverHandler } from "aws-lambda";
import {
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const USER_POOL_ID = process.env.USER_POOL_ID || "";

function normalizeRegion(value?: string) {
  const raw = (value || "").trim();
  const match = raw.match(/[a-z]{2}-[a-z]+-\d/);
  return match?.[0] || "ap-south-1";
}

const REGION = normalizeRegion(process.env.IFOUND_AWS_REGION);

if (!USER_POOL_ID) {
  throw new Error("Missing USER_POOL_ID env var");
}

const cognito = new CognitoIdentityProviderClient({ region: REGION });

type CognitoAdminUser = {
  username: string;
  status: string;
  enabled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  email: string;
  phone: string;
  name: string;
  givenName: string;
  familyName: string;
  identities: string;
  groups: string[];
};

type CognitoAdminListResult = {
  users: CognitoAdminUser[];
};

function getAttribute(
  attributes: { Name?: string; Value?: string }[] | undefined,
  name: string,
) {
  return attributes?.find((attribute) => attribute.Name === name)?.Value || "";
}

export const handler: AppSyncResolverHandler<{}, CognitoAdminListResult> = async (event) => {
  const claims = (event.identity as any)?.claims ?? {};
  const groups = Array.isArray(claims["cognito:groups"]) ? claims["cognito:groups"] : [];

  if (!groups.includes("Admin")) {
    throw new Error("Forbidden");
  }

  const result = await cognito.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 60,
    }),
  );

  const users = await Promise.all(
    (result.Users || []).map(async (user) => {
      const groupResult = await cognito.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: user.Username || "",
        }),
      );

      return {
        username: user.Username || "",
        status: user.UserStatus || "",
        enabled: Boolean(user.Enabled),
        createdAt: user.UserCreateDate?.toISOString() || null,
        updatedAt: user.UserLastModifiedDate?.toISOString() || null,
        email: getAttribute(user.Attributes, "email"),
        phone: getAttribute(user.Attributes, "phone_number"),
        name: getAttribute(user.Attributes, "name"),
        givenName: getAttribute(user.Attributes, "given_name"),
        familyName: getAttribute(user.Attributes, "family_name"),
        identities: getAttribute(user.Attributes, "identities"),
        groups: (groupResult.Groups || []).map((group) => group.GroupName || "").filter(Boolean),
      };
    }),
  );

  return { users };
};
