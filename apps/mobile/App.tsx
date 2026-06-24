import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the new proper React Navigation setup
import AppNavigator from './src/navigation/AppNavigator';

// Shared providers
import {
  SettingsProvider as SharedSettingsProvider,
} from '../../packages/shared/src/context/SettingsContext';
import { AuthProvider } from '../../packages/shared/src/auth/AuthContext';
import { BiometricProvider } from '../../packages/shared/src/biometrics/BiometricContext';
import { NotificationRegistration } from '../../packages/shared/src/notifications/NotificationRegistration';
import { PushNotificationBridge } from '../../packages/shared/src/notifications/PushNotificationBridge';
import { mobileBiometricAdapter } from './src/lib/mobileBiometrics';
import { registerForExpoPush, showLocalNotification } from './src/lib/mobilePush';
import { initSentry } from '../../packages/shared/src/utils/errorLogger';

// Initialize Sentry for mobile (Expo/React Native) — client tracking
void initSentry(process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

// Adapter so SettingsContext can persist using AsyncStorage on mobile
const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};

export default function App() {
  return (
    <SharedSettingsProvider storage={asyncStorageAdapter}>
      <BiometricProvider adapter={mobileBiometricAdapter}>
        <AuthProvider biometricAdapter={mobileBiometricAdapter}>
          <NotificationRegistration
            registerDevice={async () => {
              const token = await registerForExpoPush();
              if (!token) return null;
              return { platform: 'expo' as const, token, device_label: 'mobile' };
            }}
          />
          <PushNotificationBridge onLocalNotification={showLocalNotification} />
          <AppNavigator />
        </AuthProvider>
      </BiometricProvider>
    </SharedSettingsProvider>
  );
}