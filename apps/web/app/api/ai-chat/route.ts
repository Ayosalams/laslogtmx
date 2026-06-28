import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkDomainAccess, evaluateAiChatAccess } from '../../../../../features/ai-chat/access/aiChatAccess';
import { routeQuery } from '../../../../../features/ai-chat/router/routeQuery';
import { loadAllOkfChunks } from '../../../../../features/ai-chat/rag/loadOkfBundles';
import { retrieveFromChunks } from '../../../../../features/ai-chat/rag/retrieve';
import { synthesizeAnswer } from '../../../../../features/ai-chat/rag/synthesize';
import type { AiChatCompanyContext } from '../../../../../features/ai-chat/access/aiChatAccess';

interface AiChatRequestBody {
  message?: string;
}

let chunkCache: Awaited<ReturnType<typeof loadAllOkfChunks>> | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getChunks() {
  const now = Date.now();
  if (chunkCache && now - cacheAt < CACHE_TTL_MS) return chunkCache;
  chunkCache = await loadAllOkfChunks();
  cacheAt = now;
  return chunkCache;
}

async function resolveCompanyContext(request: NextRequest): Promise<AiChatCompanyContext | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) return null;

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile?.company_id) return { subscription_tier: 'starter' };

  const { data: company } = await supabase
    .from('companies')
    .select('subscription_tier, is_laslog_verified, is_active, company_type')
    .eq('id', profile.company_id)
    .maybeSingle();

  if (!company) return { subscription_tier: 'starter' };

  return {
    subscription_tier: company.subscription_tier,
    is_laslog_verified: company.is_laslog_verified,
    is_active: company.is_active,
    company_type: company.company_type,
  };
}

export async function POST(request: NextRequest) {
  let body: AiChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'message too long (max 2000 chars)' }, { status: 400 });
  }

  const companyCtx = await resolveCompanyContext(request);
  if (!companyCtx) {
    return NextResponse.json(
      { error: 'Sign in required to use the AI Assistant.' },
      { status: 401 }
    );
  }

  const access = evaluateAiChatAccess(companyCtx);
  if (access.isLocked) {
    return NextResponse.json({ error: access.upgradeMessage }, { status: 403 });
  }

  const route = routeQuery(message);
  const domainCheck = checkDomainAccess(route.domain, companyCtx);
  if (!domainCheck.allowed) {
    return NextResponse.json({ error: domainCheck.message }, { status: 403 });
  }

  try {
    const chunks = await getChunks();
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'OKF knowledge bundles not found on server' },
        { status: 503 }
      );
    }

    const { chunks: retrieved, domain, route: resolvedRoute } = retrieveFromChunks({
      query: message,
      chunks,
      limit: 3,
    });

    const response = await synthesizeAnswer(
      message,
      domain,
      resolvedRoute.confidence,
      retrieved,
      { allowLlm: access.canUseLlm }
    );

    return NextResponse.json({
      ...response,
      matchedKeywords: resolvedRoute.matchedKeywords,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}