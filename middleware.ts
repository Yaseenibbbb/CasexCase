import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  console.log(`[Middleware] Running for path: ${req.nextUrl.pathname}`)

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const all = req.cookies.getAll();
          return all.map((cookie: any) => ({ name: cookie.name, value: cookie.value }));
        },
        setAll: (newCookies) => {
          newCookies.forEach(({ name, value, options }: any) => {
            res.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('[Middleware] Error getting session:', sessionError)
  }

  console.log(`[Middleware] Session found: ${!!session}`)

  // If the user is logged in and they are trying to access the root page (login),
  // redirect them to the dashboard. (Optional, adjust as needed)
  // if (session && req.nextUrl.pathname === '/') {
  //   return NextResponse.redirect(new URL('/dashboard', req.url))
  // }


  // OPTIONAL: Redirect handling for auth callbacks to remove hash
  // If the request is for the auth callback and there's a hash, clean it.
  if (req.nextUrl.pathname === '/auth/callback' && req.nextUrl.hash) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.hash = '' // Remove the hash
    return NextResponse.redirect(redirectUrl)
  }


  return res
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
     // Include specific routes if needed, e.g. '/dashboard/:path*'
     '/dashboard/:path*',
     '/', // Apply to root if you have the redirect logic for logged-in users
     '/auth/callback' // Ensure callback is matched for hash removal
  ],
} 