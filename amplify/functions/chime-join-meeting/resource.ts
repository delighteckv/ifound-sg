import { defineFunction } from "@aws-amplify/backend";

export const chimeJoinMeeting = defineFunction({
  name: "chimeJoinMeeting",
  entry: "./handler.ts",
  timeoutSeconds: 15,
  resourceGroupName: "data",
});
