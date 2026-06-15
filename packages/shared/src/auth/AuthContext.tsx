'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { AuthState, AuthContextType, Profile, Company, SignupFraudContext } from './types';
import { signUpWithFraudCheck } from '../fraud/signupWithFraudCheck';
import { BiometricAdapter, HighRiskAction } from '../biometrics/types';
import { webAuthnAdapter } from '../biometrics/webauthn';

const ACTION_PROMPTS: Record<HighRiskAction, string> = {
  signup: 'Verify your identity to create your laslogTMX account',
  refund: 'Confirm your identity to submit this refund request',
  load_booking: 'Confirm your identity to book this load',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  biometricAdapter?: BiometricAdapter;
}> = ({ children, biometricAdapter }) => {
  const adapter =
    biometricAdapter ?? (typeof window !== 'undefined' ? webAuthnAdapter : undefined);
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    company: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    hasCompany: false,
  });

  const fetchProfileAndCompany = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      let profile: Profile | null = profileData || null;
      let company: Company | null = null;

      if (profile?.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();
        company = companyData || null;
      }

      return { profile, company };
    } catch (error) {
      console.error('fetchProfileAndCompany error:', error);
      return { profile: null, company: null };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;

    const { profile, company } = await fetchProfileAndCompany(state.user.id);
    setState((prev) => ({
      ...prev,
      profile,
      company,
      hasCompany: !!profile?.company_id,
    }));
  }, [state.user, fetchProfileAndCompany]);

  // Initialize auth listener
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        const user = session?.user ?? null;

        if (user) {
          const { profile, company } = await fetchProfileAndCompany(user.id);

          setState({
            user,
            profile,
            company,
            session,
            loading: false,
            isAuthenticated: true,
            hasCompany: !!profile?.company_id,
          });
        } else {
          setState({
            user: null,
            profile: null,
            company: null,
            session: null,
            loading: false,
            isAuthenticated: false,
            hasCompany: false,
          });
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      const user = session?.user ?? null;

      if (user) {
        const { profile, company } = await fetchProfileAndCompany(user.id);
        setState({
          user,
          profile,
          company,
          session,
          loading: false,
          isAuthenticated: true,
          hasCompany: !!profile?.company_id,
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndCompany]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    fraudContext?: SignupFraudContext
  ) => {
    const result = await signUpWithFraudCheck(email, password, fullName, fraudContext);

    if (result.error) {
      return { error: result.error };
    }

    // Profile is auto-created by DB trigger (handle_new_user)
    return {
      error: null,
      needsCompany: result.needsCompany,
      flagged: result.flagged,
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // State will update via listener
  };

  const updateProfileCompany = async (companyId: string) => {
    if (!state.user) {
      return { error: new Error('Not authenticated') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ company_id: companyId })
      .eq('id', state.user.id);

    if (!error) {
      await refreshProfile();
    }

    return { error };
  };

  const createCompany = async (name: string, dotNumber?: string) => {
    if (!state.user) {
      return { error: new Error('Not authenticated') };
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name,
        dot_number: dotNumber || null,
      })
      .select()
      .single();

    if (companyError) {
      return { error: companyError };
    }

    // Update profile with new company
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ company_id: company.id })
      .eq('id', state.user.id);

    if (profileError) {
      // Company created but profile link failed - still return company
      return { error: profileError, company };
    }

    await refreshProfile();
    return { error: null, company };
  };

  const verifyHighRiskAction = async (action: HighRiskAction) => {
    if (!adapter) {
      return { verified: true, biometricStatus: 'skipped' };
    }

    const available = await adapter.isAvailable();
    if (!available) {
      return { verified: true, biometricStatus: 'unavailable' };
    }

    const result = await adapter.authenticate(ACTION_PROMPTS[action]);
    const verified = result.status === 'success' || result.status === 'unavailable';

    return {
      verified,
      biometricStatus: result.status,
      error: result.error,
    };
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfileCompany,
    createCompany,
    verifyHighRiskAction,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};