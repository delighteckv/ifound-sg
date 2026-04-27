import { defineFunction, secret } from "@aws-amplify/backend";

export const linkUserIdentity = defineFunction({
  name: "link-user-identity",
  entry: "./handler.ts",
  timeoutSeconds: 20,
  resourceGroupName: "data",
    environment: {
       // AMPLIFY_RW_BUCKET_NAME: secret('AMPLIFY_RW_BUCKET_NAME'),
        //need to change email
     //   FROM_EMAIL_ADDRESS: secret('AMPLIFY_RW_FROM_EMAIL'),
        APPLICATION_ID_FOR_TABLE: secret('APPLICATION_ID_FOR_TABLE'),
        PLATFORM_FOR_TABLE: secret('PLATFORM_FOR_TABLE'),
        USER_POOL_ID:secret('USER_POOL_ID'),
        IFOUND_AWS_REGION: secret('IFOUND_AWS_REGION'),
    }
});
