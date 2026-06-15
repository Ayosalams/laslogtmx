// packages/shared/src/types/index.ts
export interface Profile {
    id: string;
    company_id: string;
    full_name?: string;
    role: 'owner' | 'admin' | 'dispatcher' | 'driver';
    created_at: string;
}

export interface Company {
    id: string;
    name: string;
    dot_number?: string;
    mc_number?: string;
    address?: string;
}

export interface Load {
    id: string;
    company_id: string;
    load_number: string;
    status: 'pending' | 'booked' | 'in_transit' | 'delivered' | 'cancelled';
    origin: string;
    destination: string;
    pickup_date?: string;
    delivery_date?: string;
}

export type AuthState = {
    user: any | null;
    profile: Profile | null;
    company: Company | null;
    isAuthenticated: boolean;
    hasCompany: boolean;
    loading: boolean;
};