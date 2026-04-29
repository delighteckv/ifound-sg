import { NextRequest, NextResponse } from "next/server"
import outputs from "@/amplify_outputs.json"
import { CognitoJwtVerifier } from "aws-jwt-verify"
import AWS from "aws-sdk"

const awsProfile = process.env.AWS_PROFILE || process.env.AMPLIFY_PROFILE || "default"
const sharedCredentials = new AWS.SharedIniFileCredentials({ profile: awsProfile })
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: outputs.auth.aws_region,
  credentials: sharedCredentials,
})

const verifier = CognitoJwtVerifier.create({
  userPoolId: outputs.auth.user_pool_id,
  tokenUse: "access",
  clientId: outputs.auth.user_pool_client_id,
})

function getAttribute(attributes: { Name?: string; Value?: string }[] | undefined, name: string) {
  return attributes?.find((attribute) => attribute.Name === name)?.Value || ""
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || ""
    if (!auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 })
    }

    const token = auth.slice("Bearer ".length)
    const payload = await verifier.verify(token)
    const groups = Array.isArray(payload["cognito:groups"]) ? payload["cognito:groups"] : []
    if (!groups.includes("Admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await cognito
      .listUsers({
        UserPoolId: outputs.auth.user_pool_id,
        Limit: 60,
      })
      .promise()

    const users = await Promise.all(
      (result.Users || []).map(async (user) => {
        const groupResult = await cognito
          .adminListGroupsForUser({
            UserPoolId: outputs.auth.user_pool_id,
            Username: user.Username || "",
          })
          .promise()

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
          groups: (groupResult.Groups || []).map((group) => group.GroupName).filter(Boolean),
        }
      }),
    )

    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to load Cognito users" },
      { status: 500 },
    )
  }
}
