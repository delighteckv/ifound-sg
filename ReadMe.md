# DONT RUN THIS UNTIL ASKED TO DO:

npx ampx sandbox --identifier ifound

1. Set environment variables and secret to run backend project

npx ampx sandbox secret set GOOGLE_CLIENT_ID --identifier ifound
enter value "ampx"

GOOGLE_CLIENT_ID
""

GOOGLE_CLIENT_SECRET
""
""


amplify-myproject-ifound--chimeCreateMeetinglambda-LeWMnq7ueKra


npx ampx sandbox secret set PLATFORM_FOR_TABLE 



PRODUCTION

APPLICATION_ID_FOR_TABLE    
PLATFORM_FOR_TABLE          NONE
CHIME_MEDIA_REGION          ap-southeast-1
CHIME_MEETINGS_REGION       ap-southeast-1
CHIME_MEETINGS_TABLE_NAME   MeetingRoom
CHIME_MEETING_TTL_SECONDS   14400
IFOUND_AWS_REGION      


USER_POOL_ID
USER_TABLE_NAME


const appid = process.env.APPLICATION_ID_FOR_TABLE;
const platform = process.env.PLATFORM_FOR_TABLE;
const USER_TABLE_NAME =