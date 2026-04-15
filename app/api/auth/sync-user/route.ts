import { NextRequest, NextResponse } from "next/server";
import outputs from "@/amplify_outputs.json";

const mutation = /* GraphQL */ `
  mutation SyncUserIdentity {
    syncUserIdentity {
      userId
      action
      providers
    }
  }
`;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
  }

  const res = await fetch(outputs.data.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify({ query: mutation }),
  });

  const json = await res.json();
  if (json.errors) {
    return NextResponse.json({ error: json.errors }, { status: 400 });
  }

  return NextResponse.json(json.data.syncUserIdentity);
}
