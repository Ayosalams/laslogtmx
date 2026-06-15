import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { SignupFraudContext } from '../fraud/types';
import type { BillingInterval, SubscriptionTier } from '../constants/subscription';

export type { SignupFraudContext };

export interface Profile {
  id: string;
  company_id: string | null;
  full_name: string | null;
  role: 'owner' | 'dispatcher' | 'driver' | 'admin' | 'accountant';
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  dot_number: string | null;
  mc_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  subscription_tier: SubscriptionTier | null;
  billing_interval: BillingInterval | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends SupabaseUser {}

export interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  company: Company | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasCompany: boolean;
}

export type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    fraudContext?: SignupFraudContext
  ) => Promise<{ error: Error | null; needsCompany?: boolean; flagged?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileCompany: (companyId: string) => Promise<{ error: Error | null }>;
  createCompany: (name: string, dotNumber?: string) => Promise<{ error: Error | null; company?: Company }>;
  verifyHighRiskAction: (
    action: 'signup' | 'refund' | 'load_booking'
  ) => Promise<{ verified: boolean; biometricStatus: string; error?: string }>;
};