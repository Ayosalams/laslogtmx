import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

interface BookLoadParams {
  loadId: string;
  driverProfileId?: string;
}

export function useLoadBooking() {
  const [booking, setBooking] = useState(false);

  const bookLoad = useCallback(async ({ loadId, driverProfileId }: BookLoadParams) => {
    setBooking(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid || userError) {
        throw new Error('Please sign in to book loads.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id, id')
        .eq('id', uid)
        .single();

      if (profileError || !profile?.company_id) {
        throw new Error('Your account must be linked to a company to book loads.');
      }

      const { data: load, error: loadError } = await supabase
        .from('loads')
        .select('id, company_id, status, load_number')
        .eq('id', loadId)
        .eq('company_id', profile.company_id)
        .single();

      if (loadError || !load) {
        throw new Error('Load not found or not accessible for your company.');
      }

      if (load.status !== 'pending') {
        throw new Error(`Load ${load.load_number} is no longer available for booking.`);
      }

      const { data: updated, error: updateError } = await supabase
        .from('loads')
        .update({
          status: 'assigned',
          driver_profile_id: driverProfileId ?? profile.id,
        })
        .eq('id', loadId)
        .eq('company_id', profile.company_id)
        .select('*')
        .single();

      if (updateError || !updated) {
        throw new Error(updateError?.message || 'Could not book load.');
      }

      return { load: updated, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed';
      return { load: null, error: new Error(message) };
    } finally {
      setBooking(false);
    }
  }, []);

  return { booking, bookLoad };
}