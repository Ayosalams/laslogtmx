export type BiometricStatus =
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'unavailable'
  | 'skipped';

export type BiometricMethod = 'face_id' | 'touch_id' | 'pin' | 'webauthn';

export interface BiometricAuthResult {
  status: BiometricStatus;
  method?: BiometricMethod;
  error?: string;
}

export type HighRiskAction = 'signup' | 'refund' | 'load_booking';

export interface BiometricAdapter {
  authenticate: (reason: string) => Promise<BiometricAuthResult>;
  isAvailable: () => Promise<boolean>;
}