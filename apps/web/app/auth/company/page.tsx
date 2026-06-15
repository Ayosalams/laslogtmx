'use client';

import React, { useState } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function CompanySetupPage() {
  const [name, setName] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Create company
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .insert({ name: name.trim(), dot_number: dotNumber.trim() || null })
      .select()
      .single();

    if (companyErr) {
      setError(companyErr.message);
      setLoading(false);
      return;
    }

    // Update profile
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ company_id: company.id })
      .eq('id', user.id);

    if (profileErr) {
      setError(profileErr.message);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h1 className="text-3xl font-bold mb-2">Set up your company</h1>
      <p className="text-gray-600 mb-6">Create a company to start using laslogTMX features.</p>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            placeholder="ACME Freight LLC"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">DOT Number (recommended)</label>
          <input
            value={dotNumber}
            onChange={(e) => setDotNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            placeholder="1234567"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create Company'}
        </button>
      </form>
    </div>
  );
}