import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricAdapter, BiometricAuthResult, BiometricMethod } from '../../../../packages/shared/src/biometrics/types';

function resolveMethod(types: LocalAuthentication.AuthenticationType[]): BiometricMethod {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face_id';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'touch_id';
  }
  return 'pin';
}

export const mobileBiometricAdapter: BiometricAdapter = {
  async isAvailable() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  async authenticate(reason: string): Promise<BiometricAuthResult> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return { status: 'unavailable', error: 'Biometric hardware not available' };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      return { status: 'unavailable', error: 'No biometrics enrolled on device' };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const method = resolveMethod(types);

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use PIN',
    });

    if (result.success) {
      return { status: 'success', method };
    }

    if (result.error === 'user_cancel' || result.error === 'system_cancel') {
      return { status: 'cancelled', method, error: result.error };
    }

    return { status: 'failure', method, error: result.error ?? 'Authentication failed' };
  },
};