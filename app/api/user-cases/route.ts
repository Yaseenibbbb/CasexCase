import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Handle demo user with a proper UUID
    const actualUserId = userId === 'demo-user' ? '00000000-0000-0000-0000-000000000000' : userId;

    const { data, error } = await supabaseAdmin
      .from("case_sessions")
      .select("*")
      .eq("user_id", actualUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching user cases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
