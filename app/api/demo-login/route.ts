import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const REQUIRED_PASSCODE = 'Testup1929';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();
    if (passcode !== REQUIRED_PASSCODE) {
      return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const demoEmail = 'demo+user@casebycase.app';

    // Ensure demo user exists with password equal to passcode
    const { data: usersList } = await admin.auth.admin.listUsers();
    let demoUser = usersList.users.find(u => u.email === demoEmail);

    if (!demoUser) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: demoEmail,
        password: passcode,
        email_confirm: true,
      });
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
      demoUser = created.user;
    }

    return NextResponse.json({ email: demoEmail });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}


