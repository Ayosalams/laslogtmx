// packages/shared/src/index.ts
// Central export point for all shared code

export * from './constants';
export * from './context/SettingsContext';
export * from './auth/AuthContext';
export * from './auth/types';
export * from './hooks/useCurrentTime';
export * from './utils/formatTime';
export * from './fraud/constants';
export * from './fraud/types';
export * from './fraud/fingerprint';
export * from './fraud/signupWithFraudCheck';
export * from './biometrics/types';
export * from './biometrics/webauthn';
export * from './biometrics/BiometricContext';
export * from './notifications/types';
export * from './notifications/constants';
export * from './notifications/useNotificationSettings';
export * from './notifications/useNotifications';
export * from './notifications/usePushRegistration';
export * from './notifications/NotificationRegistration';
export * from './notifications/PushNotificationBridge';
export * from './notifications/usePushNotificationListener';
export * from '../components/MilitaryTimeDisplay';

// Note: Feature-specific types should be imported directly from features/ dirs, not re-exported here to avoid circular deps.