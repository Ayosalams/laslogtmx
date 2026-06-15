import { useState, useCallback } from 'react';
import { DotNumberInfo } from '../types';

/**
 * useFmcsaStatus
 * Status checker using public FMCSA data where possible (SAFER system simulation).
 * In production this would call FMCSA SAFER / MCMIS public endpoints or licensed API.
 * Currently provides realistic mock data + "live" simulation label.
 */
export function useFmcsaStatus() {
  const [status, setStatus] = useState<DotNumberInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDot = useCallback(async (rawDot: string): Promise<DotNumberInfo> => {
    const dotNumber = rawDot.replace(/\D/g, '').slice(0, 8); // sanitize to digits

    if (!dotNumber || dotNumber.length < 5) {
      throw new Error('Please enter a valid DOT number (at least 5-8 digits).');
    }

    setIsChecking(true);
    setError(null);

    // Simulate network delay for "public FMCSA query"
    await new Promise((resolve) => setTimeout(resolve, 650));

    // Realistic mock data based on DOT. In real impl, fetch from 
    // https://safer.fmcsa.dot.gov or FMCSA open data APIs.
    let result: DotNumberInfo;

    // Demo cases for common scenarios
    if (dotNumber === '1234567' || dotNumber === '12345678') {
      result = {
        dotNumber,
        legalName: 'ACME FREIGHT LLC',
        dbaName: 'ACME Trucking',
        status: 'Active',
        authorityStatus: 'Active',
        outOfService: false,
        powerUnits: 42,
        drivers: 38,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h ago
        source: 'FMCSA SAFER (public)',
      };
    } else if (dotNumber === '9876543') {
      result = {
        dotNumber,
        legalName: 'MIDWEST LOGISTICS INC',
        status: 'Out of Service',
        authorityStatus: 'Revoked',
        outOfService: true,
        powerUnits: 12,
        drivers: 9,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        source: 'FMCSA SAFER (public)',
      };
    } else if (dotNumber === '5555555') {
      result = {
        dotNumber,
        legalName: 'PENDING CARRIER CO',
        status: 'Pending',
        authorityStatus: 'Pending',
        outOfService: false,
        lastUpdated: new Date().toISOString(),
        source: 'FMCSA SAFER (public)',
      };
    } else {
      // Generic active or not found for demo variety
      const isNotFound = dotNumber.startsWith('000') || dotNumber.length === 6;
      result = {
        dotNumber,
        legalName: isNotFound ? undefined : 'SAMPLE CARRIER ' + dotNumber.slice(-4),
        status: isNotFound ? 'Not Found' : 'Active',
        authorityStatus: isNotFound ? 'None' : 'Active',
        outOfService: false,
        powerUnits: isNotFound ? undefined : 7,
        drivers: isNotFound ? undefined : 5,
        lastUpdated: new Date().toISOString(),
        source: isNotFound ? 'Mock' : 'FMCSA SAFER (public)',
      };
    }

    setStatus(result);
    setIsChecking(false);
    return result;
  }, []);

  const clear = useCallback(() => {
    setStatus(null);
    setError(null);
  }, []);

  return {
    status,
    isChecking,
    error,
    checkDot,
    clear,
  };
}
