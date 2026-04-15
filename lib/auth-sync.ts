import { fetchAuthSession, fetchUserAttributes, updateUserAttributes } from "aws-amplify/auth";

type TokenPayload = {
  email?: string;
  phone_number?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

export async function syncCognitoAttributesFromToken() {
  try {
    const session = await fetchAuthSession();
    const payload = session.tokens?.idToken?.payload as TokenPayload | undefined;
    if (!payload) return;

    const attrs = await fetchUserAttributes();
    const updates: Record<string, string> = {};

    if (payload.email && !attrs.email) updates.email = payload.email;
    if (payload.phone_number && !attrs.phone_number) updates.phone_number = payload.phone_number;
    if (payload.given_name && !attrs.given_name) updates.given_name = payload.given_name;
    if (payload.family_name && !attrs.family_name) updates.family_name = payload.family_name;
    if (payload.name && !attrs.name) updates.name = payload.name;

    const keys = Object.keys(updates);
    if (!keys.length) return;

    await updateUserAttributes({ userAttributes: updates });
  } catch {
    // best-effort sync only
  }
}
