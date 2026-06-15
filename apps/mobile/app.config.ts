import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'laslogTMX',
  slug: 'laslogtmx',
  plugins: [
    'expo-local-authentication',
    [
      'expo-notifications',
      {
        color: '#1E40AF',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'laslogTMX needs camera access to scan expense receipts.',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'laslogTMX needs photo library access to upload receipt images.',
      },
    ],
  ],
  ios: {
    infoPlist: {
      NSFaceIDUsageDescription:
        'laslogTMX uses Face ID to verify your identity for signup and high-risk actions.',
    },
  },
  android: {
    permissions: ['USE_BIOMETRIC', 'USE_FINGERPRINT', 'CAMERA'],
  },
});
