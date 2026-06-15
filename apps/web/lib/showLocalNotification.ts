export function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: '/icon-192.png',
    data: data ?? {},
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}