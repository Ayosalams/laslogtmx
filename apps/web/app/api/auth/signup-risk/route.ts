import { NextRequest, NextResponse } from 'next/server';

function getClientIp(request: NextRequest): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

/** Returns the caller IP for web signup fraud checks (Cloudflare / Vercel compatible). */
export async function GET(request: NextRequest) {
  return NextResponse.json({ ip: getClientIp(request) });
}