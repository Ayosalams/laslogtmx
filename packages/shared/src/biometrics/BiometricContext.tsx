'use client';

import React, { createContext, useContext, useCallback } from 'react';
import {
  BiometricAdapter,
  BiometricAuthResult,
  BiometricStatus,
  HighRiskAction,
} from './types';
import { webAuthnAdapter } from './webauthn';

const noopAdapter: BiometricAdapter = {
  async authenticate() {
    return { status: 'unavailable', error: 'No biometric adapter configured' };
  },
  async isAvailable() {
    return false;
  },
};

interface BiometricContextType {
  authenticate: (reason: string) => Promise<BiometricAuthResult>;
  isAvailable: () => Promise<boolean>;
  requireForAction: (action: HighRiskAction) => Promise<BiometricAuthResult>;
}

const ACTION_PROMPTS: Record<HighRiskAction, string> = {
  signup: 'Verify your identity to create your laslogTMX account',
  refund: 'Confirm your identity to submit this refund request',
  load_booking: 'Confirm your identity to book this load',
};

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

export const BiometricProvider: React.FC<{
  children: React.ReactNode;
  adapter?: BiometricAdapter;
}> = ({ children, adapter }) => {
  const effectiveAdapter = adapter ?? (typeof window !== 'undefined' ? webAuthnAdapter : noopAdapter);

  const authenticate = useCallback(
    (reason: string) => effectiveAdapter.authenticate(reason),
    [effectiveAdapter]
  );

  const isAvailable = useCallback(
    () => effectiveAdapter.isAvailable(),
    [effectiveAdapter]
  );

  const requireForAction = useCallback(
    (action: HighRiskAction) => authenticate(ACTION_PROMPTS[action]),
    [authenticate]
  );

  return (
    <BiometricContext.Provider value={{ authenticate, isAvailable, requireForAction }}>
      {children}
    </BiometricContext.Provider>
  );
};

export const useBiometric = () => {
  const context = useContext(BiometricContext);
  if (!context) {
    throw new Error('useBiometric must be used within a BiometricProvider');
  }
  return context;
};

export function biometricStatusForFraud(result: BiometricAuthResult): BiometricStatus {
  return result.status;
}