import {
  a,
  defineData,
  type ClientSchema,
} from "@aws-amplify/backend";
import { chimeCreateMeeting } from "../functions/chime-create-meeting/resource";
import { chimeJoinMeeting } from "../functions/chime-join-meeting/resource";
import { linkUserIdentity } from "../functions/link-user-identity/resource";
import { adminListCognitoUsers } from "../functions/admin-list-cognito-users/resource";

const UserRole = ["OWNER", "ADMIN"] as const;
const UserStatus = ["PENDING", "ACTIVE", "INACTIVE"] as const;
const ItemStatus = ["ACTIVE", "LOST", "FOUND", "ARCHIVED"] as const;
const QrStatus = ["UNASSIGNED", "ASSIGNED", "RETIRED"] as const;
const ScanChannel = ["CALL", "MESSAGE", "UNKNOWN"] as const;
const MessageChannel = ["CALL", "SMS", "WHATSAPP", "IN_APP"] as const;
const DevicePlatform = ["APNS", "GCM"] as const;
const SubscriptionStatus = ["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] as const;
const PaymentStatus = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
const AccessInviteStatus = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"] as const;

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
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()]),

  Valuable: a
    .model({
      ownerId: a.id().required(),
      name: a.string().required(),
      serialNumber: a.string(),
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
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()]),

  ValuableAccess: a
    .model({
      ownerId: a.id().required(),
      valuableId: a.id().required(),
      granteeUserId: a.id().required(),
      granteeEmail: a.string(),
      canViewScanInfo: a.boolean().default(true),
      canReceiveNotifications: a.boolean().default(true),
      canReceiveCalls: a.boolean().default(false),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index("ownerId").queryField("ValuableAccessByOwner"),
      index("valuableId").queryField("ValuableAccessByValuable"),
      index("granteeUserId").queryField("ValuableAccessByGrantee"),
    ])
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()]),

  ValuableAccessInvite: a
    .model({
      code: a.string().required(),
      ownerId: a.id().required(),
      valuableId: a.id().required(),
      canViewScanInfo: a.boolean().default(true),
      canReceiveNotifications: a.boolean().default(true),
      canReceiveCalls: a.boolean().default(false),
      status: a.enum(AccessInviteStatus),
      createdByUserId: a.id(),
      acceptedByUserId: a.id(),
      createdAt: a.datetime(),
      expiresAt: a.datetime(),
      acceptedAt: a.datetime(),
      rejectedAt: a.datetime(),
      cancelledAt: a.datetime(),
    })
    .identifier(["code"])
    .secondaryIndexes((index) => [
      index("ownerId").queryField("ValuableAccessInvitesByOwner"),
      index("valuableId").queryField("ValuableAccessInvitesByValuable"),
      index("acceptedByUserId").queryField("ValuableAccessInvitesByAcceptedUser"),
      index("status").queryField("ValuableAccessInvitesByStatus"),
    ])
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()]),

  QrCode: a
    .model({
      code: a.string().required(),
      qrImagePath: a.string(),
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
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()]),

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
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()]),

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
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()]),

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
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()]),

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

  CognitoAdminUser: a.customType({
    username: a.string(),
    status: a.string(),
    enabled: a.boolean(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    email: a.string(),
    phone: a.string(),
    name: a.string(),
    givenName: a.string(),
    familyName: a.string(),
    identities: a.string(),
    groups: a.string().array(),
  }),

  CognitoAdminListResult: a.customType({
    users: a.ref("CognitoAdminUser").array(),
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

  adminListCognitoUsers: a
    .query()
    .returns(a.ref("CognitoAdminListResult"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(adminListCognitoUsers)),
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
