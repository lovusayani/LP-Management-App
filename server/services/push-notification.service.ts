import admin from "firebase-admin";

import { env } from "../config/env";

const hasFirebaseAdminConfig = () => {
  return Boolean(env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey);
};

let firebaseApp: admin.app.App | null = null;

export const isPushNotificationConfigured = (): boolean => {
  return hasFirebaseAdminConfig();
};

export const getFirebaseMessaging = (): admin.messaging.Messaging | null => {
  if (!hasFirebaseAdminConfig()) {
    return null;
  }

  if (!firebaseApp) {
    firebaseApp = admin.apps[0]
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert({
            projectId: env.firebaseProjectId,
            clientEmail: env.firebaseClientEmail,
            privateKey: env.firebasePrivateKey,
          }),
        });
  }

  return admin.messaging(firebaseApp);
};

export const sendPushNotificationToTokens = async (
  tokens: string[],
  payload: Omit<admin.messaging.MulticastMessage, "tokens">
) => {
  const messaging = getFirebaseMessaging();
  if (!messaging || tokens.length === 0) {
    return null;
  }

  return messaging.sendEachForMulticast({
    ...payload,
    tokens,
  });
};