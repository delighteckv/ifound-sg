import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "iFound: Verify your account",
      verificationEmailBody: (createCode) =>
        `Your iFound verification code is ${createCode()}`,
    },
    phone: {
      otpLogin: true,
    },
    externalProviders: {
      google: {
        clientId: secret("GOOGLE_CLIENT_ID"),
        clientSecret: secret("GOOGLE_CLIENT_SECRET"),
      },
      apple: {
        clientId: secret("APPLE_CLIENT_ID"),
        teamId: secret("APPLE_TEAM_ID"),
        keyId: secret("APPLE_KEY_ID"),
        privateKey: secret("APPLE_PRIVATE_KEY"),
      },
    },
    callbackUrls: [
      "http://localhost:3000/login",
      "http://127.0.0.1:3000/login",
      "http://localhost:3000/",
      "http://127.0.0.1:3000/",
      "ifound://callback/",
    ],
    logoutUrls: [
      "http://localhost:3000/login",
      "http://127.0.0.1:3000/login",
      "http://localhost:3000/",
      "http://127.0.0.1:3000/",
      "ifound://signout/",
    ],
  },
  userAttributes: {
    email: {
      required: false,
    },
    phoneNumber: {
      required: false,
    },
  },
  passwordlessOptions: {
    preferredChallenge: "SMS_OTP",
  },
  groups: ["Admin", "Owner"],
});
