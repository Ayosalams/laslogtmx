'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authenticateWithWebAuthn } from '../../../../../packages/shared/src/biometrics/webauthn';
import { getDeviceFingerprint } from '../../../../../packages/shared/src/fraud/fingerprint';
import { signUpWithFraudCheck } from '../../../../../packages/shared/src/fraud/signupWithFraudCheck';
import type { BiometricStatus } from '../../../../../packages/shared/src/biometrics/types';

async function getClientIp(): Promise<string | undefined> {
  try {
    const res = await fetch('/api/auth/signup-risk');
    if (!res.ok) return undefined;
    const data = await res.json();
    return typeof data.ip === 'string' ? data.ip : undefined;
  } catch {
    return undefined;
  }
}

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const [ip, fingerprint, biometric] = await Promise.all([
      getClientIp(),
      getDeviceFingerprint(),
      authenticateWithWebAuthn('Verify your identity to create your laslogTMX account'),
    ]);

    if (biometric.status === 'failure' || biometric.status === 'cancelled') {
      setError(
        biometric.error ??
          'Identity verification is required. Please use your device passkey or biometrics.'
      );
      setLoading(false);
      return;
    }

    const { error: signupError } = await signUpWithFraudCheck(
      email,
      password,
      fullName,
      { ip, fingerprint, biometricStatus: biometric.status as BiometricStatus }
    );

    if (signupError) {
      setError(signupError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-2xl font-semibold mb-2">Check your email</h2>
        <p className="text-gray-600 mb-6">
          We&apos;ve sent a confirmation link. After confirming, you&apos;ll be prompted to set up your company.
        </p>
        <Link href="/auth/login" className="text-indigo-600 hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
        <div className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
          Military Time
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="John Smith"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-indigo-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}