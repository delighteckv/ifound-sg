import { defineFunction } from "@aws-amplify/backend";

export const chimeCreateMeeting = defineFunction({
  name: "chimeCreateMeeting",
  entry: "./handler.ts",
  timeoutSeconds: 15,
  resourceGroupName: "data",
});
