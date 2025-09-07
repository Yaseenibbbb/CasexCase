// app/api/create-case/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase-admin";

type CaseTypeId =
  | "diagnostic"
  | "profitability"
  | "market-entry"
  | "product"
  | "operations"
  | "sizing";

const SYSTEM_PROMPT = `You are CaseByCase’s Case Pack Generator. Produce a complete, interview-ready case pack.
Include Background, Objectives, Constraints, Candidate Tasks.
Add 2–5 exhibits using [[EXHIBIT:...]]...[[/EXHIBIT]].
Provide an Interviewer Script (opening, 6–10 probes, hints, 2–3 calc checks, wrap-up).
Emit [[CASE_META]] JSON (title, industry, company, geography, difficulty, time_limit, role_focus, exhibits).
If you include a solution, wrap in [[SOLUTION_GUIDE_START]]...[[SOLUTION_GUIDE_END]].`;

function buildUserPrompt(meta: Record<string, any>) {
  const seed = `${Date.now()}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))}`;
  return `use_case: ${meta.use_case ?? meta.caseType}
company: ${meta.company ?? "Unknown"}
industry: ${meta.industry ?? "Unknown"}
role_focus: ${meta.role_focus ?? "General"}
geography: ${meta.geography ?? "Global"}
difficulty: ${meta.difficulty ?? "intermediate"}
time_limit_minutes: ${meta.time_limit_minutes ?? 30}
entropy_seed: ${seed}`;
}


export async function POST(req: Request) {
  try {
    const { userId, meta } = (await req.json()) as {
      userId: string;
      meta: { caseType: CaseTypeId; [k: string]: any };
    };

    if (!userId || !meta?.caseType)
      return NextResponse.json({ error: "Missing userId or caseType" }, { status: 400 });

    if (!process.env.OPENAI_API_KEY)
      return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });

    const actualUserId = userId === "demo-user" ? "demo-user" : userId;

    // Ensure demo user exists in user_profiles table
    if (actualUserId === "demo-user") {
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .upsert({
          id: "demo-user",
          full_name: "Demo User",
          avatar_url: null,
          streak_count: 5,
          weekly_goal_hours: 10,
          streak_last_active: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (profileError) {
        console.error("[create-case] Error creating demo user profile:", profileError);
        return NextResponse.json({ error: "Failed to create demo user profile" }, { status: 500 });
      }
    }

    // 1) Generate the case pack - no internal fetch
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.85,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(meta) },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return NextResponse.json({ error: "OpenAI returned empty content" }, { status: 500 });

    // 2) Try to pick a title
    let caseTitle = `${meta.caseType} case`;
    const metaMatch = text.match(/\[\[CASE_META\]\]\s*([\s\S]*?)\s*\[\[\/CASE_META\]\]/i);
    if (metaMatch) {
      try { caseTitle = JSON.parse(metaMatch[1])?.title || caseTitle; } catch {}
    } else {
      const h1 = text.match(/^#\s*(.+)$/m);
      if (h1) caseTitle = h1[1].trim();
    }

    const pack: any = { raw: text, caseMeta: { title: caseTitle } };

    // 3) Insert a NEW session
    const { data, error } = await supabaseAdmin
      .from("case_sessions")
      .insert({
        user_id: actualUserId,
        case_type: meta.caseType,
        case_title: caseTitle,
        duration_minutes: 0,
        completed: false,
        generated_case_data: pack,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[create-case] Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: { sessionId: data.id } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[create-case] Fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
