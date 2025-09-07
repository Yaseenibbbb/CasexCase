import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getBaseUrl } from "@/lib/base-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type CaseTypeId = "diagnostic" | "profitability" | "market-entry" | "product" | "operations" | "sizing";

export async function POST(req: Request) {
  try {
    const { userId, meta } = await req.json() as {
      userId: string;
      meta: {
        caseType: CaseTypeId;
        company?: string;
        industry?: string;
        role_focus?: string;
        geography?: string;
        difficulty?: "beginner" | "intermediate" | "advanced";
        time_limit_minutes?: number;
        exhibit_preferences?: string;
        constraints_notes?: string;
      };
    };

    if (!userId || !meta?.caseType) {
      return NextResponse.json({ error: "Missing userId or caseType" }, { status: 400 });
    }

    // Handle demo user with a proper UUID
    const actualUserId = userId === 'demo-user' ? '00000000-0000-0000-0000-000000000000' : userId;

    // 1) Generate pack by calling your generator route (which no longer updates DB)
    const entropy = `${Date.now()}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))}`;
    const baseUrl = getBaseUrl();
    console.log(`[create-case] Calling generate-case-details with baseUrl: ${baseUrl}`);
    const genRes = await fetch(`${baseUrl}/api/generate-case-details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ ...meta, entropy_seed: entropy }),
    });
    
    console.log(`[create-case] Generate response status: ${genRes.status}`);
    const genJson = await genRes.json().catch((e) => {
      console.error(`[create-case] Failed to parse generate response:`, e);
      return {};
    });
    
    if (!genRes.ok || !genJson?.data) {
      console.error(`[create-case] Generation failed:`, { status: genRes.status, response: genJson });
      return NextResponse.json({ error: genJson?.error || "Generation failed" }, { status: 500 });
    }
    const pack = genJson.data;
    const caseTitle = pack?.caseMeta?.title || pack?.title || `${meta.caseType} case`;

    // 2) Insert session via admin client
    const { data, error } = await supabaseAdmin
      .from("case_sessions")
      .insert({
        user_id: actualUserId,
        case_type: meta.caseType,
        case_title: caseTitle,
        case_details: {
          type: meta.caseType,
          title: caseTitle,
          description: pack?.sections?.background || pack?.sections?.overview || "Generated case",
        },
        generated_case_data: pack,
        status: "active",
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
  } catch (err: any) {
    console.error("[create-case] Fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
