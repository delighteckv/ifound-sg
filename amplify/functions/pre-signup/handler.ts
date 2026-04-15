import type { PreSignUpTriggerHandler } from "aws-lambda";
import {
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

export const handler: PreSignUpTriggerHandler = async (event) => {
  if (event.triggerSource !== "PreSignUp_ExternalProvider") {
    const email = event.request.userAttributes?.email;
    const phone = event.request.userAttributes?.phone_number;

    if (email) {
      const byEmail = await client.send(
        new ListUsersCommand({
          UserPoolId: event.userPoolId,
          Filter: `email = \"${email}\"`,
          Limit: 1,
        })
      );
      const existing = byEmail.Users?.[0];
      if (existing && existing.Username && existing.Username !== event.userName) {
        throw new Error("An account with this email already exists.");
      }
    }

    if (phone) {
      const byPhone = await client.send(
        new ListUsersCommand({
          UserPoolId: event.userPoolId,
          Filter: `phone_number = \"${phone}\"`,
          Limit: 1,
        })
      );
      const existing = byPhone.Users?.[0];
      if (existing && existing.Username && existing.Username !== event.userName) {
        throw new Error("An account with this phone number already exists.");
      }
    }

    return event;
  }

  const email = event.request.userAttributes?.email;
  const phone = event.request.userAttributes?.phone_number;
  const parsed = parseProvider(event.userName);

  if (!parsed) {
    return event;
  }

  let existing = null as any;
  if (email) {
    const byEmail = await client.send(
      new ListUsersCommand({
        UserPoolId: event.userPoolId,
        Filter: `email = \"${email}\"`,
        Limit: 1,
      })
    );
    existing = byEmail.Users?.[0];
  }

  if (!existing && phone) {
    const byPhone = await client.send(
      new ListUsersCommand({
        UserPoolId: event.userPoolId,
        Filter: `phone_number = \"${phone}\"`,
        Limit: 1,
      })
    );
    existing = byPhone.Users?.[0];
  }

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
