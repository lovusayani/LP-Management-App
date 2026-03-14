/* eslint-disable no-undef */

importScripts("https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js");

(function () {
  const params = new URL(self.location.href).searchParams;
  const config = {
    apiKey: params.get("apiKey") || "",
    authDomain: params.get("authDomain") || undefined,
    projectId: params.get("projectId") || "",
    storageBucket: params.get("storageBucket") || undefined,
    messagingSenderId: params.get("messagingSenderId") || "",
    appId: params.get("appId") || "",
  };

  if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function (payload) {
    const notificationTitle =
      payload.notification?.title || payload.data?.title || "L Max Notification";
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || "You have a new update.",
      icon: payload.notification?.icon || "/favicon.ico",
      image: payload.notification?.image,
      data: {
        url: payload.data?.url || "/dashboard",
      },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    const targetUrl = event.notification?.data?.url || "/dashboard";

    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }

        return undefined;
      })
    );
  });
})();