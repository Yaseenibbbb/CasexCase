import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("case_sessions")
      .select("completed, duration_minutes, performance_rating")
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stats = {
      completedCases: data.filter(c => c.completed).length,
      totalPracticeHours: data.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / 60,
      skillAccuracy: { math: 0, structure: 0, creativity: 0 } // Placeholder
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
