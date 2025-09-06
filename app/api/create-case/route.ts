import { NextResponse } from 'next/server';
import { caseService } from '@/lib/case-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, meta } = body;
    
    if (!userId || !meta) {
      return NextResponse.json({ error: 'User ID and meta are required' }, { status: 400 });
    }

    const result = await caseService.createCaseSession(userId, meta);
    
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error creating case session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
