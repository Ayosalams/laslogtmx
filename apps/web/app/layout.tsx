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
import { AdminNavLink } from '../components/AdminNavLink';
import Link from 'next/link';

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
            <nav className="max-w-7xl mx-auto px-4 pt-2 flex gap-4 text-sm">
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 hover:underline">Pricing</Link>
              <Link href="/auth/login" className="text-indigo-600 hover:underline">Login</Link>
              <Link href="/auth/signup" className="text-indigo-600 hover:underline">Signup</Link>
              <Link href="/auth/company" className="text-indigo-600 hover:underline">Company Setup</Link>
              <Link href="/settings" className="text-gray-600 hover:text-gray-900 hover:underline">Settings</Link>
              <AdminNavLink />
            </nav>
            <main className="p-4 max-w-7xl mx-auto">{children}</main>
            </AuthProvider>
          </BiometricProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
