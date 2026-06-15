function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid');
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.publicKey === 'string' ? data.publicKey : null;
  } catch {
    return null;
  }
}

export async function registerWebPush(): Promise<{
  endpoint: string;
  p256dh: string;
  auth_key: string;
} | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return null;
  }

  const publicKey = await getVapidPublicKey();
  if (!publicKey) {
    return null;
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return null;
  }

  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth_key: json.keys.auth,
  };
}