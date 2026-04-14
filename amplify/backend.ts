import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { chimeCreateMeeting } from "./functions/chime-create-meeting/resource";
import { chimeJoinMeeting } from "./functions/chime-join-meeting/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

const backend = defineBackend({
  auth,
  data,
  storage,
  chimeCreateMeeting,
  chimeJoinMeeting,
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
cfnUserPoolClient.refreshTokenValidity = 180;
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

const meetingRoomTable = backend.data.resources.tables["MeetingRoom"];
backend.chimeCreateMeeting.resources.lambda.addEnvironment(
  "CHIME_MEETINGS_TABLE_NAME",
  meetingRoomTable.tableName,
);
backend.chimeJoinMeeting.resources.lambda.addEnvironment(
  "CHIME_MEETINGS_TABLE_NAME",
  meetingRoomTable.tableName,
);
