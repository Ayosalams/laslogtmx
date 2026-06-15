import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface PushSubscriptionRow {
  platform: 'expo' | 'web';
  token: string;
  endpoint: string | null;
  p256dh: string | null;
  auth_key: string | null;
}

async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    }),
  });

  return res.ok;
}

async function sendWebPush(
  subscription: PushSubscriptionRow,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey || !subscription.endpoint || !subscription.p256dh || !subscription.auth_key) {
    return false;
  }

  try {
    const webpush = await import('web-push');
    webpush.setVapidDetails('mailto:support@laslogtmx.com', publicKey, privateKey);

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth_key,
        },
      },
      JSON.stringify({ title, body, data })
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Dispatches push notifications to a user's registered devices.
 * Protected by PUSH_WEBHOOK_SECRET — intended for Supabase webhooks or Make.com.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration incomplete' }, { status: 503 });
  }

  const payload = await request.json();
  const userId = payload.user_id as string | undefined;
  const title = (payload.title as string) ?? 'laslogTMX';
  const body = (payload.body as string) ?? '';
  const data = (payload.data as Record<string, unknown>) ?? {};

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: settings } = await admin
    .from('notification_settings')
    .select('push_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (settings?.push_enabled === false) {
    return NextResponse.json({ sent: 0, skipped: 'push_disabled' });
  }

  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('platform, token, endpoint, p256dh, auth_key')
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const sub of (subscriptions ?? []) as PushSubscriptionRow[]) {
    const ok =
      sub.platform === 'expo'
        ? await sendExpoPush(sub.token, title, body, data)
        : await sendWebPush(sub, title, body, data);

    if (ok) sent += 1;
  }

  return NextResponse.json({ sent, total: subscriptions?.length ?? 0 });
}