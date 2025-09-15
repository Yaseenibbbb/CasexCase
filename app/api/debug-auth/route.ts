export const runtime = "nodejs";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    return new Response(JSON.stringify({
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
        urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
        anonKeyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing'
      },
      timestamp: new Date().toISOString()
    }), { 
      headers: { "content-type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
