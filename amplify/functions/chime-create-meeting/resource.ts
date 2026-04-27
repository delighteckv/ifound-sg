import { defineFunction,secret } from "@aws-amplify/backend";

export const chimeCreateMeeting = defineFunction({
  name: "chimeCreateMeeting",
  entry: "./handler.ts",
  timeoutSeconds: 15,
  resourceGroupName: "data",
    environment: {
    CHIME_MEETINGS_TABLE_NAME: secret("CHIME_MEETINGS_TABLE_NAME"),
    CHIME_MEETINGS_REGION: secret("CHIME_MEETINGS_REGION"),
    CHIME_MEDIA_REGION: secret("CHIME_MEDIA_REGION"),
    CHIME_MEETING_TTL_SECONDS: secret("CHIME_MEETING_TTL_SECONDS"),
    IFOUND_AWS_REGION: secret("IFOUND_AWS_REGION"),
    APPLICATION_ID_FOR_TABLE: secret("APPLICATION_ID_FOR_TABLE"),
    PLATFORM_FOR_TABLE: secret("PLATFORM_FOR_TABLE"),
  },
});
