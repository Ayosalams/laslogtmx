self.addEventListener('push', (event) => {
  let payload = { title: 'laslogTMX', body: 'You have a new notification.' };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'laslogTMX', {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: payload.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/settings/notifications';
  event.waitUntil(clients.openWindow(url));
});