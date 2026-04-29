import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { chimeCreateMeeting } from "./functions/chime-create-meeting/resource";
import { chimeJoinMeeting } from "./functions/chime-join-meeting/resource";
import { analyticsAggregator } from "./functions/analytics-aggregator/resource";
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { EventSourceMapping, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { postConfirmation } from "./functions/post-confirmation/resource";
import { preSignup } from "./functions/pre-signup/resource";
import { linkUserIdentity } from "./functions/link-user-identity/resource";
import { adminListCognitoUsers } from "./functions/admin-list-cognito-users/resource";

const backend = defineBackend({
  auth,
  data,
  storage,
  chimeCreateMeeting,
  chimeJoinMeeting,
  analyticsAggregator,
  postConfirmation,
  preSignup,
  linkUserIdentity,
  adminListCognitoUsers,
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

backend.adminListCognitoUsers.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:ListUsers",
      "cognito-idp:AdminListGroupsForUser",
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

const analyticsTable = backend.data.resources.tables["AnalyticsStats"];
backend.analyticsAggregator.resources.lambda.addEnvironment(
  "IFOUND_ANALYTICS_TABLE_NAME",
  analyticsTable.tableName,
);

const analyticsStreamTables = [
  "ScanEvent",
  "Message",
  "OwnerPayment",
  "OwnerSubscription",
] as const;

const analyticsStreamPolicy = new Policy(
  Stack.of(analyticsTable),
  "AnalyticsAggregatorStreamPolicy",
  {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams",
        ],
        resources: ["*"],
      }),
    ],
  },
);

backend.analyticsAggregator.resources.lambda.role?.attachInlinePolicy(
  analyticsStreamPolicy,
);

backend.analyticsAggregator.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "dynamodb:UpdateItem",
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:DescribeTable",
    ],
    resources: ["*"],
  }),
);

for (const tableName of analyticsStreamTables) {
  const table = backend.data.resources.tables[tableName];
  if (!table?.tableStreamArn) continue;

  new EventSourceMapping(Stack.of(table), `AnalyticsAggregator${tableName}Stream`, {
    target: backend.analyticsAggregator.resources.lambda,
    eventSourceArn: table.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
  }).node.addDependency(analyticsStreamPolicy);
}
