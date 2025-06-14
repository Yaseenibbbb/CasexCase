import { createServerClient } from '@supabase/ssr'
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  console.log("[AuthCallback] Received request"); // Log entry
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  console.log(`[AuthCallback] Code received: ${!!code}`); // Log if code exists

  if (code) {
    try {
      const cookieStore = cookies();
      // Provide getAll/setAll for SSR cookie handling
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => {
              const all = cookieStore.getAll();
              return all.map((cookie: any) => ({ name: cookie.name, value: cookie.value }));
            },
          },
        }
      );
      console.log("[AuthCallback] Exchanging code for session...")
      await supabase.auth.exchangeCodeForSession(code)
      console.log("[AuthCallback] Code exchange successful.")
    } catch (error) {
      console.error("[AuthCallback] Error exchanging code:", error)
    }
  }

  // URL to redirect to after sign in process completes
  const redirectUrl = requestUrl.origin + '/dashboard'
  console.log(`[AuthCallback] Redirecting to: ${redirectUrl}`)
  return NextResponse.redirect(redirectUrl)
}
