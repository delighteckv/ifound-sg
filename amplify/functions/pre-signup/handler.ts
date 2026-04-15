import type { PreSignUpTriggerHandler } from "aws-lambda";
import {
  AdminGetUserCommand,
  AdminLinkProviderForUserCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

function parseProvider(userName: string) {
  const idx = userName.indexOf("_");
  if (idx === -1) return null;
  const providerName = userName.slice(0, idx);
  const providerSubject = userName.slice(idx + 1);
  if (!providerName || !providerSubject) return null;
  return { providerName, providerSubject };
}

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase();
}

async function getUserByUsername(userPoolId: string, username?: string) {
  if (!username) return null;
  try {
    const result = await client.send(
      new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      })
    );

    return {
      Username: result.Username,
      Attributes: result.UserAttributes,
    };
  } catch {
    return null;
  }
}

async function findExistingUser(userPoolId: string, email?: string, phone?: string) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail) {
    const directByUsername =
      (await getUserByUsername(userPoolId, normalizedEmail)) ??
      (email !== normalizedEmail ? await getUserByUsername(userPoolId, email) : null);
    if (directByUsername?.Username) {
      return directByUsername;
    }

    for (const candidate of Array.from(new Set([email, normalizedEmail].filter(Boolean)))) {
      const byEmail = await client.send(
        new ListUsersCommand({
          UserPoolId: userPoolId,
          Filter: `email = \"${candidate}\"`,
          Limit: 1,
        })
      );
      const existing = byEmail.Users?.[0];
      if (existing?.Username) {
        return existing;
      }
    }
  }

  if (phone) {
    const directByPhone = await getUserByUsername(userPoolId, phone);
    if (directByPhone?.Username) {
      return directByPhone;
    }

    const byPhone = await client.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `phone_number = \"${phone}\"`,
        Limit: 1,
      })
    );
    const existing = byPhone.Users?.[0];
    if (existing?.Username) {
      return existing;
    }
  }

  return null;
}

export const handler: PreSignUpTriggerHandler = async (event) => {
  if (event.triggerSource !== "PreSignUp_ExternalProvider") {
    const email = normalizeEmail(event.request.userAttributes?.email);
    const phone = event.request.userAttributes?.phone_number;

    if (email) {
      event.request.userAttributes.email = email;
    }

    if (email) {
      const existing = await findExistingUser(event.userPoolId, email, undefined);
      if (existing && existing.Username && existing.Username !== event.userName) {
        throw new Error("An account with this email already exists.");
      }
    }

    if (phone) {
      const existing = await findExistingUser(event.userPoolId, undefined, phone);
      if (existing && existing.Username && existing.Username !== event.userName) {
        throw new Error("An account with this phone number already exists.");
      }
    }

    return event;
  }

  const email = normalizeEmail(event.request.userAttributes?.email);
  const phone = event.request.userAttributes?.phone_number;
  const parsed = parseProvider(event.userName);

  if (email) {
    event.request.userAttributes.email = email;
  }

  if (!parsed) {
    return event;
  }

  const existing = await findExistingUser(event.userPoolId, email, phone);

  if (!existing || !existing.Username) {
    event.response.autoConfirmUser = true;
    if (email) event.response.autoVerifyEmail = true;
    if (phone) event.response.autoVerifyPhone = true;
    return event;
  }

  try {
    const currentAttrs = existing.Attributes ?? [];
    const getAttr = (name: string) =>
      currentAttrs.find((a) => a.Name === name)?.Value;
    const updates: { Name: string; Value: string }[] = [];

    if (email) {
      const currentEmail = getAttr("email");
      if (!currentEmail || currentEmail !== email) {
        updates.push({ Name: "email", Value: email });
        updates.push({ Name: "email_verified", Value: "true" });
      }
    }
    if (phone) {
      const currentPhone = getAttr("phone_number");
      if (!currentPhone || currentPhone !== phone) {
        updates.push({ Name: "phone_number", Value: phone });
        updates.push({ Name: "phone_number_verified", Value: "true" });
      }
    }

    if (updates.length > 0) {
      await client.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: event.userPoolId,
          Username: existing.Username,
          UserAttributes: updates,
        })
      );
    }
  } catch (error) {
    console.warn("Update user attributes failed", error);
  }

  try {
    await client.send(
      new AdminLinkProviderForUserCommand({
        UserPoolId: event.userPoolId,
        DestinationUser: {
          ProviderName: "Cognito",
          ProviderAttributeName: "Cognito_Subject",
          ProviderAttributeValue: existing.Username,
        },
        SourceUser: {
          ProviderName: parsed.providerName,
          ProviderAttributeName: "Cognito_Subject",
          ProviderAttributeValue: parsed.providerSubject,
        },
      })
    );
  } catch (error) {
    console.warn("Link provider failed", error);
  }

  event.response.autoConfirmUser = true;
  if (email) event.response.autoVerifyEmail = true;
  if (phone) event.response.autoVerifyPhone = true;
  return event;
};
