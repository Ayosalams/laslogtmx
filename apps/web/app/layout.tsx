'use client';

import React from 'react';
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
