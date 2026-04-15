import { defineFunction } from "@aws-amplify/backend";

export const linkUserIdentity = defineFunction({
  name: "link-user-identity",
  entry: "./handler.ts",
  timeoutSeconds: 20,
  resourceGroupName: "data",
});
