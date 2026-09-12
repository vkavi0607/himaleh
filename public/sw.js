// Himaleh Service Worker - Real OS Notification Engine
/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming messages from the main application
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: '/public/favicon.svg',
        badge: '/public/favicon.svg',
        ...options,
      })
    );
  }
});

// Handle notification interaction (actions & clicks)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const routineId = event.notification.data?.routineId;
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If action is complete, notify clients to log completion
      if (action === 'complete' && routineId) {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION_COMPLETE',
            routineId: Number(routineId),
          });
        });
        return;
      }

      // Default or 'open' action: focus existing window or open a new one
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (routineId) {
            client.postMessage({
              type: 'FOCUS_ROUTINE',
              routineId: Number(routineId),
            });
          }
          return;
        }
      }

      // If no window client open, open root
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('notificationclose', (_event) => {
  // Notification closed by user
});
