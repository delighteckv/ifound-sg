import {
  a,
  defineData,
  type ClientSchema,
} from "@aws-amplify/backend";
import { chimeCreateMeeting } from "../functions/chime-create-meeting/resource";
import { chimeJoinMeeting } from "../functions/chime-join-meeting/resource";
import { linkUserIdentity } from "../functions/link-user-identity/resource";

const UserRole = ["OWNER", "ADMIN"] as const;
const UserStatus = ["PENDING", "ACTIVE", "INACTIVE"] as const;
const ItemStatus = ["ACTIVE", "LOST", "FOUND", "ARCHIVED"] as const;
const QrStatus = ["UNASSIGNED", "ASSIGNED", "RETIRED"] as const;
const ScanChannel = ["CALL", "MESSAGE", "UNKNOWN"] as const;
const MessageChannel = ["CALL", "SMS", "WHATSAPP", "IN_APP"] as const;
const DevicePlatform = ["APNS", "GCM"] as const;
const SubscriptionStatus = ["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] as const;
const PaymentStatus = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

const schema = a.schema({
  AnalyticsStats: a
    .model({
      scope: a.string().required(),
      metric: a.string().required(),
      value: a.float().required(),
      updatedAt: a.datetime(),
    })
    .identifier(["scope", "metric"])
    .authorization((allow) => [allow.publicApiKey()]),

  User: a
    .model({
      cognitoId: a.id().required(),
      email: a.string(),
      phone: a.string(),
      firstName: a.string(),
      lastName: a.string(),
      displayName: a.string(),
      providers: a.string().array(),
      role: a.enum(UserRole),
      status: a.enum(UserStatus),
      primaryContact: a.string(),
      alternateContact: a.string(),
      createdAt: a.datetime(),
      lastLogin: a.timestamp(),
    })
    .identifier(["cognitoId"])
    .secondaryIndexes((index) => [
      index("email").queryField("UsersByEmail"),
      index("phone").queryField("UsersByPhone"),
      index("role").queryField("UsersByRole"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  Valuable: a
    .model({
      ownerId: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      category: a.string(),
      status: a.enum(ItemStatus),
      qrCodeId: a.id(),
      qrCodeValue: a.string(),
      images: a.string().array(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index("ownerId").queryField("ValuablesByOwner"),
      index("status").queryField("ValuablesByStatus"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  QrCode: a
    .model({
      code: a.string().required(),
      packId: a.string(),
      packSize: a.integer(),
      packPosition: a.integer(),
      batchLabel: a.string(),
      generatedBy: a.id(),
      packOwnerId: a.id(),
      packAssignedAt: a.datetime(),
      ownerId: a.id(),
      valuableId: a.id(),
      status: a.enum(QrStatus),
      label: a.string(),
      assignedAt: a.datetime(),
      registeredAt: a.datetime(),
      createdAt: a.datetime(),
    })
    .identifier(["code"])
    .secondaryIndexes((index) => [
      index("packId").queryField("QrCodesByPack"),
      index("packOwnerId").queryField("QrCodesByPackOwner"),
      index("ownerId").queryField("QrCodesByOwner"),
      index("valuableId").queryField("QrCodesByValuable"),
      index("status").queryField("QrCodesByStatus"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  ScanEvent: a
    .model({
      qrCodeId: a.string().required(),
      valuableId: a.id(),
      ownerId: a.id(),
      scannedAt: a.datetime().required(),
      locationText: a.string(),
      latitude: a.float(),
      longitude: a.float(),
      finderContact: a.string(),
      finderMessage: a.string(),
      channel: a.enum(ScanChannel),
      resolved: a.boolean().default(false),
    })
    .secondaryIndexes((index) => [
      index("qrCodeId").queryField("ScansByQrCode"),
      index("valuableId").queryField("ScansByValuable"),
      index("ownerId").queryField("ScansByOwner"),
      index("scannedAt").queryField("ScansByDate"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  Message: a
    .model({
      valuableId: a.id().required(),
      ownerId: a.id().required(),
      finderContact: a.string(),
      content: a.string().required(),
      channel: a.enum(MessageChannel),
      createdAt: a.datetime(),
      status: a.string(),
    })
    .secondaryIndexes((index) => [
      index("valuableId").queryField("MessagesByValuable"),
      index("ownerId").queryField("MessagesByOwner"),
      index("createdAt").queryField("MessagesByDate"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  DeviceToken: a
    .model({
      token: a.string().required(),
      userId: a.id().required(),
      platform: a.enum(DevicePlatform),
      updatedAt: a.datetime(),
    })
    .identifier(["token"])
    .secondaryIndexes((index) => [
      index("userId").queryField("DeviceTokensByUserId"),
      index(["userId", "updatedAt"]).queryField("DeviceTokensByUserIdAndUpdatedAt"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  OwnerSubscription: a
    .model({
      ownerId: a.id().required(),
      planId: a.string().required(),
      status: a.enum(SubscriptionStatus),
      startDate: a.date(),
      endDate: a.date(),
      gateway: a.string(),
      externalId: a.string(),
      createdAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index("ownerId").queryField("OwnerSubscriptionsByOwner"),
      index("status").queryField("OwnerSubscriptionsByStatus"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  OwnerPayment: a
    .model({
      ownerId: a.id().required(),
      amount: a.float().required(),
      currency: a.string().required(),
      status: a.enum(PaymentStatus),
      gateway: a.string(),
      externalId: a.string(),
      subscriptionId: a.id(),
      createdAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index("ownerId").queryField("OwnerPaymentsByOwner"),
      index("status").queryField("OwnerPaymentsByStatus"),
      index("createdAt").queryField("OwnerPaymentsByDate"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  MeetingRoom: a
    .model({
      roomId: a.string().required(),
      meetingId: a.string(),
      meeting: a.string(),
      description:a.string(),
      createdAt: a.datetime(),
      expiresAt: a.timestamp(),
    })
    .identifier(["roomId"])
    .authorization((allow) => [allow.publicApiKey()]),

  ChimeMeetingResult: a.customType({
    meeting: a.string(),
  }),

  ChimeJoinResult: a.customType({
    meeting: a.string(),
    attendee: a.string(),
  }),

  SyncUserResult: a.customType({
    userId: a.string(),
    action: a.string(),
    providers: a.string().array(),
  }),

  chimeCreateMeeting: a
    .mutation()
    .arguments({
      roomId: a.string(),
    })
    .returns(a.ref("ChimeMeetingResult"))
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()])
    .handler(a.handler.function(chimeCreateMeeting)),

  chimeJoinMeeting: a
    .mutation()
    .arguments({
      roomId: a.string(),
      userId: a.string(),
    })
    .returns(a.ref("ChimeJoinResult"))
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()])
    .handler(a.handler.function(chimeJoinMeeting)),

  syncUserIdentity: a
    .mutation()
    .returns(a.ref("SyncUserResult"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(linkUserIdentity)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
