import { deleteToken, getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";

import { registerPushToken, unregisterPushToken } from "./user.service";

const PUSH_TOKEN_STORAGE_KEY = "lmax_push_token";
const FIREBASE_SW_PATH = "/firebase-messaging-sw.js";

const getFirebaseWebConfig = (): FirebaseOptions | null => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

const getFirebaseAppInstance = (): FirebaseApp => {
  const config = getFirebaseWebConfig();
  if (!config) {
    throw new Error("Firebase web push config is missing");
  }

  return getApps().length ? getApp() : initializeApp(config);
};

const getStoredPushToken = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY) || "";
};

const setStoredPushToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
};

const buildServiceWorkerUrl = (): string => {
  const config = getFirebaseWebConfig();
  if (!config) {
    throw new Error("Firebase web push config is missing");
  }

  const params = new URLSearchParams();
  Object.entries(config).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `${FIREBASE_SW_PATH}?${params.toString()}`;
};

const registerMessagingServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser");
  }

  return navigator.serviceWorker.register(buildServiceWorkerUrl(), { scope: "/" });
};

export const hasFirebasePushConfig = (): boolean => {
  return Boolean(getFirebaseWebConfig() && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
};

export const getBrowserNotificationPermission = (): NotificationPermission => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }

  return Notification.permission;
};

export const isPushNotificationsSupported = async (): Promise<boolean> => {
  if (typeof window === "undefined") {
    return false;
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }

  return isSupported();
};

export const getPushSupportDiagnostics = async (): Promise<{
  isSecureContext: boolean;
  hasNotificationApi: boolean;
  hasServiceWorker: boolean;
  firebaseSupported: boolean;
}> => {
  const isSecureContext = typeof window !== "undefined" ? window.isSecureContext : false;
  const hasNotificationApi = typeof window !== "undefined" && "Notification" in window;
  const hasServiceWorker = typeof window !== "undefined" && "serviceWorker" in navigator;

  let firebaseSupported = false;
  if (hasNotificationApi && hasServiceWorker && typeof window !== "undefined") {
    try {
      firebaseSupported = await isSupported();
    } catch {
      firebaseSupported = false;
    }
  }

  return {
    isSecureContext,
    hasNotificationApi,
    hasServiceWorker,
    firebaseSupported,
  };
};

export const enablePushNotifications = async (): Promise<{ token: string }> => {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || !hasFirebasePushConfig()) {
    throw new Error("Firebase push config is incomplete");
  }

  const supported = await isPushNotificationsSupported();
  if (!supported) {
    throw new Error("Push notifications are not supported on this device/browser");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted");
  }

  const serviceWorkerRegistration = await registerMessagingServiceWorker();
  const messaging = getMessaging(getFirebaseAppInstance());
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });

  if (!token) {
    throw new Error("Could not get a push notification token");
  }

  await registerPushToken(token);
  setStoredPushToken(token);
  return { token };
};

export const disablePushNotifications = async (): Promise<void> => {
  const storedToken = getStoredPushToken();
  if (storedToken) {
    await unregisterPushToken(storedToken);
  } else {
    await unregisterPushToken();
  }

  if (hasFirebasePushConfig()) {
    const supported = await isPushNotificationsSupported();
    if (supported) {
      const messaging = getMessaging(getFirebaseAppInstance());
      await deleteToken(messaging).catch(() => undefined);
    }
  }

  setStoredPushToken("");
};

export const subscribeToForegroundPushMessages = async (
  callback: Parameters<typeof onMessage>[1]
) => {
  if (!hasFirebasePushConfig()) {
    return () => undefined;
  }

  const supported = await isPushNotificationsSupported();
  if (!supported) {
    return () => undefined;
  }

  const messaging = getMessaging(getFirebaseAppInstance());
  return onMessage(messaging, callback);
};