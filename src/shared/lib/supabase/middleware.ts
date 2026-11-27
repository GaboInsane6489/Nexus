import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from './client';
import type { AppRole } from '@/shared/types/database.types';

const ROLE_ROUTE_GUARDS: Array<{ prefix: string; allowed: AppRole[] }> = [
  { prefix: '/admin', allowed: ['super_admin'] },
  { prefix: '/coordinator', allowed: ['super_admin', 'coordinator'] },
  { prefix: '/instructor', allowed: ['super_admin', 'coordinator', 'instructor'] },
];

export async function updateSessionAndEnforceRBAC(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    const devRole = (request.cookies.get('nexus_active_role')?.value as AppRole | undefined) ?? 'student';
    const pathname = request.nextUrl.pathname;

    for (const guard of ROLE_ROUTE_GUARDS) {
      if (pathname.startsWith(guard.prefix) && !guard.allowed.includes(devRole)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        redirectUrl.searchParams.set('denied', guard.prefix);
        return NextResponse.redirect(redirectUrl);
      }
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (!user && !isAuthRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const userRole = ((user.app_metadata?.role as AppRole | undefined) ?? 'student');
    for (const guard of ROLE_ROUTE_GUARDS) {
      if (pathname.startsWith(guard.prefix) && !guard.allowed.includes(userRole)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}
