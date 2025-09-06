import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildLiveInterviewerSystem } from "@/prompts/liveInterviewer";
import { buildCasePackGeneratorSystem } from "@/prompts/caseGenerator";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function POST(req: Request) {
  try {
    const { mode, caseMeta, userMessage } = await req.json();

    const system =
      mode === "interview"
        ? buildLiveInterviewerSystem(caseMeta ?? {})
        : buildCasePackGeneratorSystem(caseMeta ?? {});

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: mode === "interview" ? 0.2 : 0.5,
      max_tokens: mode === "interview" ? 350 : 1200,
      stop: mode === "interview" ? ["<END_TURN>"] : undefined,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage ?? "" },
      ],
    });

    let text = completion.choices[0]?.message?.content ?? "";

    if (mode === "interview") {
      // safety: hard-stop at the token, strip formatting bloat
      const ix = text.indexOf("<END_TURN>");
      if (ix >= 0) text = text.slice(0, ix);
      text = text.replace(/\n{3,}/g, "\n\n").trim();
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('[AI Chat API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
