import type { Handler } from "aws-lambda";
import crypto from "crypto";
import {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
} from "@aws-sdk/client-chime-sdk-meetings";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
//import { env } from "$amplify/env/chimeCreateMeeting";

const appid = process.env.APPLICATION_ID_FOR_TABLE;
const platform = process.env.PLATFORM_FOR_TABLE;
const CHIME_MEETINGS_TABLE_NAME =
  process.env.IFOUND_CHIME_MEETINGS_TABLE_NAME ||
  process.env.CHIME_MEETINGS_TABLE_NAME ||
  (appid && platform ? `MeetingRoom-${appid}-${platform}` : "");


type StoredMeeting = {
  roomId: string;
  meeting: any;
  meetingId: string;
  createdAt: string;
  expiresAt: number;
};

function assertNonEmptyString(value: unknown, name: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
}

function externalMeetingIdFromRoomId(roomId: string) {
  const hash = crypto.createHash("sha256").update(roomId).digest("hex");
  return `rw-${hash}`.slice(0, 64);
}

function ttlSeconds() {
  const v = Number(process.env.CHIME_MEETING_TTL_SECONDS || "14400");
  return Number.isFinite(v) && v > 300 ? v : 14400;
}

function chimeClient() {
  const region = process.env.CHIME_MEETINGS_REGION || "us-east-1";
  return new ChimeSDKMeetingsClient({ region });
}

function dynamoClient() {
  const region = process.env.IFOUND_AWS_REGION || "ap-south-1";
  console.log("dynamoClient region:", region);
  return new DynamoDBClient({ region });
}

function tableName() {
  const name = CHIME_MEETINGS_TABLE_NAME;
  if (!name) throw new Error("Missing env CHIME_MEETINGS_TABLE_NAME");
  console.log("resolved CHIME_MEETINGS_TABLE_NAME:", name);
  return name;
}

async function getStoredMeeting(roomId: string): Promise<StoredMeeting | null> {
  console.log("getStoredMeeting start", { roomId });
  const res = await dynamoClient().send(
    new GetItemCommand({
      TableName: tableName(),
      Key: { roomId: { S: roomId } },
      ConsistentRead: true,
    })
  );

  if (!res.Item) return null;

  const meetingJson = res.Item.meeting?.S;
  const meetingId = res.Item.meetingId?.S;
  const createdAt = res.Item.createdAt?.S;
  const expiresAtStr = res.Item.expiresAt?.N;

  if (!meetingJson || !meetingId || !createdAt || !expiresAtStr) return null;

  return {
    roomId,
    meeting: JSON.parse(meetingJson),
    meetingId,
    createdAt,
    expiresAt: Number(expiresAtStr),
  };
}

async function putStoredMeeting(roomId: string, meeting: any, ttl: number) {
  const meetingId: string | undefined = meeting?.MeetingId;
  if (!meetingId) throw new Error("MeetingId missing from CreateMeeting response");

  const now = new Date();
  const expiresAt = Math.floor(now.getTime() / 1000) + ttl;

  console.log("putStoredMeeting start", { roomId, meetingId, ttl });
  await dynamoClient().send(
    new PutItemCommand({
      TableName: tableName(),
      Item: {
        roomId: { S: roomId },
        meetingId: { S: meetingId },
        meeting: { S: JSON.stringify(meeting) },
        createdAt: { S: now.toISOString() },
        expiresAt: { N: String(expiresAt) },
      },
    })
  );
}

export const handler: Handler = async (event) => {
  console.log("event input:", JSON.stringify(event));
  console.log("env snapshot:", {
    IFOUND_AWS_REGION: process.env.IFOUND_AWS_REGION,
    CHIME_MEETINGS_REGION: process.env.CHIME_MEETINGS_REGION,
    IFOUND_CHIME_MEETINGS_TABLE_NAME: process.env.IFOUND_CHIME_MEETINGS_TABLE_NAME,
    CHIME_MEETINGS_TABLE_NAME: process.env.CHIME_MEETINGS_TABLE_NAME,
    APPLICATION_ID_FOR_TABLE: process.env.APPLICATION_ID_FOR_TABLE,
    PLATFORM_FOR_TABLE: process.env.PLATFORM_FOR_TABLE,
  });

  try {
    const roomId = event.arguments?.roomId;
    assertNonEmptyString(roomId, "roomId");

    const now = Math.floor(Date.now() / 1000);
    const stored = await getStoredMeeting(roomId);
    console.log("chimeCreateMeeting stored:", stored, "roomId: ", roomId);

    if (stored && stored.expiresAt > now + 30) {
      return { meeting: JSON.stringify(stored.meeting) };
    }

    const mediaRegion =
      process.env.CHIME_MEDIA_REGION || process.env.IFOUND_AWS_REGION || "ap-south-1";

    const meetingRes = await chimeClient().send(
      new CreateMeetingCommand({
        ClientRequestToken: crypto.randomUUID(),
        ExternalMeetingId: externalMeetingIdFromRoomId(roomId),
        MediaRegion: mediaRegion,
      })
    );
    console.log("chimeCreateMeeting meetingRes:", meetingRes);

    const meeting = meetingRes.Meeting;
    if (!meeting) throw new Error("CreateMeeting returned no Meeting");

    await putStoredMeeting(roomId, meeting, ttlSeconds());

    return { meeting: JSON.stringify(meeting) };
  } catch (err: any) {
    console.error("chimeCreateMeeting error:", err);
    throw new Error(err?.message || "Failed to create meeting");
  }
};
