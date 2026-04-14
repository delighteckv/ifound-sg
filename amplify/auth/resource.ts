import { defineAuth } from "@aws-amplify/backend";

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
