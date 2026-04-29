import { defineFunction, secret } from "@aws-amplify/backend";

export const adminListCognitoUsers = defineFunction({
  name: "admin-list-cognito-users",
  entry: "./handler.ts",
  timeoutSeconds: 20,
  resourceGroupName: "data",
  environment: {
    USER_POOL_ID: secret("USER_POOL_ID"),
    IFOUND_AWS_REGION: secret("IFOUND_AWS_REGION"),
  },
});
