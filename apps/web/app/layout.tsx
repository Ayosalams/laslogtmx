'use client';

import React, { useEffect } from 'react';
import { SettingsProvider } from '../../../packages/shared/src/context/SettingsContext';
import { AuthProvider } from '../../../packages/shared/src/auth/AuthContext';
import { BiometricProvider } from '../../../packages/shared/src/biometrics/BiometricContext';
import { NotificationRegistration } from '../../../packages/shared/src/notifications/NotificationRegistration';
import { PushNotificationBridge } from '../../../packages/shared/src/notifications/PushNotificationBridge';
import { registerWebPush } from '../lib/webPush';
import { showLocalNotification } from '../lib/showLocalNotification';
import { Header } from '../components/Header';
import { AppNav } from '../components/AppNav';
import { AdminNavLink } from '../components/AdminNavLink';
import { initSentry, captureException } from '../../../packages/shared/src/utils/errorLogger';

// Initialize Sentry Error Monitoring (client-side) — DSN from .env only (async safe)
void initSentry(process.env.NEXT_PUBLIC_SENTRY_DSN);

// Basic global unhandled error tracking for production readiness
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    captureException(event.error || new Error(event.message), { feature: 'global', source: 'window.onerror' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason, { feature: 'global', source: 'unhandledrejection' });
  });
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900 font-sans">
        <SettingsProvider>
          <BiometricProvider>
            <AuthProvider>
              <NotificationRegistration
                registerDevice={async () => {
                  const sub = await registerWebPush();
                  if (!sub) return null;
                  return {
                    platform: 'web' as const,
                    token: sub.endpoint,
                    endpoint: sub.endpoint,
                    p256dh: sub.p256dh,
                    auth_key: sub.auth_key,
                    device_label: 'web',
                  };
                }}
              />
              <PushNotificationBridge onLocalNotification={showLocalNotification} />
            <Header />
            <AppNav />
            <div className="max-w-7xl mx-auto px-4 flex gap-4 text-xs text-gray-500 pb-1">
              <AdminNavLink />
            </div>
            <main className="p-4 max-w-7xl mx-auto">{children}</main>
            </AuthProvider>
          </BiometricProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
