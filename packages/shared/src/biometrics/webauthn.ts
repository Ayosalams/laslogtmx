import { BiometricAuthResult } from './types';

function randomChallenge(): BufferSource {
  const buf = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  }
  return buf as unknown as BufferSource;
}

function toCredentialId(storedId: string): BufferSource {
  const decoded = Uint8Array.from(
    atob(storedId.replace(/-/g, '+').replace(/_/g, '/')),
    (c: string) => c.charCodeAt(0)
  );
  return decoded as unknown as BufferSource;
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function isWebAuthnAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * WebAuthn fallback for high-risk actions on web.
 * Uses platform authenticator when available; gracefully skips otherwise.
 */
export async function authenticateWithWebAuthn(reason: string): Promise<BiometricAuthResult> {
  if (typeof window === 'undefined') {
    return { status: 'unavailable', error: 'Not in browser context' };
  }

  if (!window.PublicKeyCredential) {
    return { status: 'unavailable', error: 'WebAuthn not supported' };
  }

  const platformAvailable = await isWebAuthnAvailable();
  if (!platformAvailable) {
    return { status: 'unavailable', error: 'No platform authenticator' };
  }

  const storageKey = 'laslogtmx_webauthn_credential';
  const storedId = localStorage.getItem(storageKey);

  try {
    if (storedId) {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          timeout: 60000,
          rpId: window.location.hostname,
          allowCredentials: [
            {
              id: toCredentialId(storedId),
              type: 'public-key',
            },
          ],
          userVerification: 'required',
        },
      });

      if (assertion) {
        return { status: 'success', method: 'webauthn' };
      }
      return { status: 'failure', error: 'No credential returned' };
    }

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: 'laslogTMX', id: window.location.hostname },
        user: {
          id: randomChallenge(),
          name: 'laslogtmx-user',
          displayName: reason,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    });

    if (credential && 'rawId' in credential) {
      localStorage.setItem(storageKey, toBase64Url(credential.rawId as ArrayBuffer));
      return { status: 'success', method: 'webauthn' };
    }

    return { status: 'failure', error: 'Credential creation failed' };
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'NotAllowedError') {
      return { status: 'cancelled', method: 'webauthn', error: 'User cancelled' };
    }
    return {
      status: 'failure',
      method: 'webauthn',
      error: err instanceof Error ? err.message : 'WebAuthn error',
    };
  }
}

export const webAuthnAdapter = {
  authenticate: authenticateWithWebAuthn,
  isAvailable: isWebAuthnAvailable,
};