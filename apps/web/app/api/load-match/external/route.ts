import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ExternalLoadPayload {
  origin?: string;
  destination?: string;
  rate_cents?: number;
  rate_dollars?: number;
  load_ref?: string;
  equipment?: string;
  source?: string;
}

/**
 * Make.com webhook endpoint for external load match notifications.
 * Protected by LOAD_MATCH_WEBHOOK_SECRET — configure in Make.com scenario.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.LOAD_MATCH_WEBHOOK_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration incomplete' }, { status: 503 });
  }

  let payload: ExternalLoadPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const origin = payload.origin?.trim();
  const destination = payload.destination?.trim();

  if (!origin || !destination) {
    return NextResponse.json({ error: 'origin and destination required' }, { status: 400 });
  }

  let rateCents = payload.rate_cents;
  if (rateCents == null && payload.rate_dollars != null) {
    rateCents = Math.round(payload.rate_dollars * 100);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data, error } = await admin.rpc('process_external_load_match', {
    p_origin: origin,
    p_destination: destination,
    p_rate_cents: rateCents ?? null,
    p_load_ref: payload.load_ref ?? null,
    p_equipment: payload.equipment ?? null,
    p_source: payload.source ?? 'make_com',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    notified: data ?? 0,
    origin,
    destination,
    rate_cents: rateCents ?? null,
  });
}