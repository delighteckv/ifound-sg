import { defineFunction, secret} from "@aws-amplify/backend";

export const analyticsAggregator = defineFunction({
  name: "analytics-aggregator",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  resourceGroupName: "data",
  IFOUND_AWS_REGION: secret("IFOUND_AWS_REGION"),
});
