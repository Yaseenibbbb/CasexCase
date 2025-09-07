export const runtime = "nodejs";
export function GET() {
  return new Response(JSON.stringify({
    supabaseUrl: !!process.env.SUPABASE_URL,
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    vercelUrl: process.env.VERCEL_URL || null,
  }), { headers: { "content-type": "application/json" }});
}
