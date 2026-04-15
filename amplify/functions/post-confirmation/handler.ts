import type { PostConfirmationTriggerHandler } from "aws-lambda";
import {
  AdminUpdateUserAttributesCommand,
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});
const DEFAULT_GROUP = "Owner";

export const handler: PostConfirmationTriggerHandler = async (event) => {
  try {
    const userPoolId = event.userPoolId;
    const username = event.userName;

    if (userPoolId && username) {
      const attrs = event.request.userAttributes ?? {};
      const updates: { Name: string; Value: string }[] = [];

      if (attrs.email) {
        updates.push({ Name: "email", Value: attrs.email });
        updates.push({ Name: "email_verified", Value: "true" });
      }
      if (attrs.phone_number) {
        updates.push({ Name: "phone_number", Value: attrs.phone_number });
        updates.push({ Name: "phone_number_verified", Value: "true" });
      }
      if (attrs.given_name) {
        updates.push({ Name: "given_name", Value: attrs.given_name });
      }
      if (attrs.family_name) {
        updates.push({ Name: "family_name", Value: attrs.family_name });
      }
      if (attrs.name) {
        updates.push({ Name: "name", Value: attrs.name });
      }

      if (updates.length) {
        await client.send(
          new AdminUpdateUserAttributesCommand({
            UserPoolId: userPoolId,
            Username: username,
            UserAttributes: updates,
          })
        );
      }

      await client.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: username,
          GroupName: DEFAULT_GROUP,
        })
      );
    }
  } catch (err) {
    console.error("post-confirmation add group failed", err);
  }

  return event;
};
