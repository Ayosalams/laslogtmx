import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware: Proper Auth Gating
 * Redirects unauthenticated users from protected routes to /auth/login.
 *
 * Lightweight for one-man shop:
 * - Detects Supabase session via common cookie names (sb-*) set by auth flows.
 * - Also honors a lightweight 'laslogtmx-auth' marker cookie synced by AuthContext on login.
 * - Real data protection still via RLS + client useAuth checks.
 * - No new heavy deps (no @supabase/ssr in v1).
 *
 * Add to .env if you switch to cookie-based SSR later.
 */

const PROTECTED_PREFIXES = [
  '/load-board',
  '/chat',
  '/admin',
  '/settings',
  '/receipts',
  '/expenses',
  '/motus',
];

const PUBLIC_PREFIXES = [
  '/auth',
  '/pricing',
  '/cble',
  '/logos',
  '/_next',
  '/api', // api routes have own protection where needed
];

function hasAuthCookie(req: NextRequest): boolean {
  const cookies = req.cookies.getAll();
  // Supabase default cookie patterns (even with localStorage primary, some flows set them)
  const hasSb = cookies.some((c) =>
    c.name.startsWith('sb-') || c.name.includes('supabase') || c.name.includes('auth-token')
  );
  const hasMarker = cookies.some((c) => c.name === 'laslogtmx-auth' && c.value === '1');
  return hasSb || hasMarker;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public prefixes early
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected && !hasAuthCookie(request)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots etc.
     * We still handle inside function for precision.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
