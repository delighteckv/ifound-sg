import fs from "fs";
import path from "path";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const outputsPath = path.resolve(process.cwd(), "amplify_outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const userPoolId = outputs?.auth?.user_pool_id;
const region = outputs?.auth?.aws_region;

if (!userPoolId || !region) {
  throw new Error("Missing auth.user_pool_id or auth.aws_region in amplify_outputs.json");
}

const client = new CognitoIdentityProviderClient({ region });

function getAttr(attrs, name) {
  return attrs?.find((a) => a.Name === name)?.Value;
}

function looksLikeEmail(value) {
  return /.+@.+\..+/.test(value);
}

function looksLikeE164(value) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

async function listAllUsers() {
  let paginationToken = undefined;
  const users = [];
  do {
    const res = await client.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        PaginationToken: paginationToken,
        Limit: 60,
      })
    );
    if (res.Users?.length) users.push(...res.Users);
    paginationToken = res.PaginationToken;
  } while (paginationToken);
  return users;
}

async function run() {
  const users = await listAllUsers();
  let updated = 0;
  for (const user of users) {
    const attrs = user.Attributes ?? [];
    const username = user.Username ?? "";
    const email = getAttr(attrs, "email");
    const emailVerified = getAttr(attrs, "email_verified");
    const phone = getAttr(attrs, "phone_number");
    const phoneVerified = getAttr(attrs, "phone_number_verified");

    const updates = [];
    if (!email && looksLikeEmail(username)) {
      updates.push({ Name: "email", Value: username });
      updates.push({ Name: "email_verified", Value: "true" });
    } else if (email && emailVerified !== "true" && looksLikeEmail(email)) {
      updates.push({ Name: "email_verified", Value: "true" });
    }

    if (!phone && looksLikeE164(username)) {
      updates.push({ Name: "phone_number", Value: username });
      updates.push({ Name: "phone_number_verified", Value: "true" });
    } else if (phone && phoneVerified !== "true" && looksLikeE164(phone)) {
      updates.push({ Name: "phone_number_verified", Value: "true" });
    }

    if (!updates.length) continue;

    await client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: updates,
      })
    );
    updated++;
  }

  console.log(`Updated users: ${updated} / ${users.length}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
