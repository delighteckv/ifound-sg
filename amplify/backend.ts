import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { chimeCreateMeeting } from "./functions/chime-create-meeting/resource";
import { chimeJoinMeeting } from "./functions/chime-join-meeting/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { postConfirmation } from "./functions/post-confirmation/resource";
import { preSignup } from "./functions/pre-signup/resource";
import { linkUserIdentity } from "./functions/link-user-identity/resource";

const backend = defineBackend({
  auth,
  data,
  storage,
  chimeCreateMeeting,
  chimeJoinMeeting,
  postConfirmation,
  preSignup,
  linkUserIdentity,
});

// Ensure passwordless SMS OTP works by enabling USER_AUTH on the app client
const cfnUserPoolClient = backend.auth.resources.cfnResources.cfnUserPoolClient;
const existingAuthFlows = cfnUserPoolClient.explicitAuthFlows ?? [];
cfnUserPoolClient.explicitAuthFlows = Array.from(
  new Set([...existingAuthFlows, "ALLOW_USER_AUTH", "ALLOW_CUSTOM_AUTH"]),
);

// Extend session lifetime to reduce OTP frequency
cfnUserPoolClient.accessTokenValidity = 24;
cfnUserPoolClient.idTokenValidity = 24;
cfnUserPoolClient.refreshTokenValidity = 10;
cfnUserPoolClient.tokenValidityUnits = {
  accessToken: "hours",
  idToken: "hours",
  refreshToken: "days",
};

const chimePolicy = new PolicyStatement({
  actions: [
    "chime:CreateMeeting",
    "chime:CreateAttendee",
    "dynamodb:PutItem",
    "dynamodb:GetItem",
    "dynamodb:Query",
    "dynamodb:Scan",
    "dynamodb:UpdateItem",
    "dynamodb:DescribeTable",
  ],
  resources: ["*"],
});

backend.chimeCreateMeeting.resources.lambda.addToRolePolicy(chimePolicy);
backend.chimeJoinMeeting.resources.lambda.addToRolePolicy(chimePolicy);

backend.postConfirmation.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminUpdateUserAttributes",
    ],
    resources: ["*"],
  }),
);

backend.preSignup.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminGetUser",
      "cognito-idp:ListUsers",
      "cognito-idp:AdminLinkProviderForUser",
      "cognito-idp:AdminUpdateUserAttributes",
    ],
    resources: ["*"],
  }),
);

backend.linkUserIdentity.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminLinkProviderForUser",
      "cognito-idp:AdminUpdateUserAttributes",
    ],
    resources: ["*"],
  }),
);

const userTable = backend.data.resources.tables["User"];
backend.linkUserIdentity.resources.lambda.addEnvironment(
  "USER_TABLE_NAME",
  userTable.tableName,
);
backend.linkUserIdentity.resources.lambda.addEnvironment(
  "USER_POOL_ID",
  backend.auth.resources.userPool.userPoolId,
);

const meetingRoomTable = backend.data.resources.tables["MeetingRoom"];
backend.chimeCreateMeeting.resources.lambda.addEnvironment(
  "IFOUND_CHIME_MEETINGS_TABLE_NAME",
  meetingRoomTable.tableName,
);
backend.chimeJoinMeeting.resources.lambda.addEnvironment(
  "IFOUND_CHIME_MEETINGS_TABLE_NAME",
  meetingRoomTable.tableName,
);
