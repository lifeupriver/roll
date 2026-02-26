import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Preview mode: skip all auth checks so the app can run without Supabase
  if (process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true') {
    // Allow the landing page to show — it has a "See a Demo" button
    if (pathname === '/') {
      return NextResponse.next({ request });
    }
    // Redirect auth pages to feed in preview mode (user is always "logged in")
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/callback')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/feed';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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

  // Auth pages — redirect to feed if already authenticated
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/callback')
  ) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/feed';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Admin pages — require auth, admin role checked at page/API level
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // App pages — redirect to login if not authenticated
  const protectedRoutes = [
    '/feed',
    '/library',
    '/circle',
    '/account',
    '/upload',
    '/onboarding',
    '/roll',
    '/year-in-review',
    '/collections',
    '/memories',
    '/search',
    '/map',
    '/projects',
    '/seed',
  ];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|textures|icons|manifest.json|sw.js|api).*)'],
};
