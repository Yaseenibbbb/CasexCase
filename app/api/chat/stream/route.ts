// app/api/chat/stream/route.ts
export const runtime = "edge"; // remove this line if you prefer Node runtime

import OpenAI from "openai";

type Msg = { role: "system" | "user" | "assistant"; content: string };
type Body = {
  messages: Msg[];                // include system prompt as first item
  mode?: "chat" | "interview";    // "interview" stops at <END_TURN>
  stopToken?: string;             // optional override
};

export async function POST(req: Request) {
  const { messages, mode = "chat", stopToken = "<END_TURN>" } = (await req.json()) as Body;

  if (!process.env.OPENAI_API_KEY) {
    return new Response("Missing OPENAI_API_KEY", { status: 500 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const resp = await openai.chat.completions.create({
          model,
          temperature: mode === "interview" ? 0.2 : 0.5,
          stream: true,
          messages,
        });

        // safe stop-token detection across chunk boundaries
        let carry = "";
        const windowSize = 32; // longer than "<END_TURN>"
        let stopped = false;

        for await (const part of resp) {
          if (stopped) break;
          const delta = part.choices?.[0]?.delta?.content ?? "";
          if (!delta) continue;

          const combined = carry + delta;

          if (mode === "interview") {
            const ix = combined.indexOf(stopToken);
            if (ix >= 0) {
              const before = combined.slice(0, ix);
              if (before) controller.enqueue(enc.encode(before));
              stopped = true;
              break;
            }
          }

          // emit only the new portion
          const emit = combined.slice(carry.length);
          if (emit) controller.enqueue(enc.encode(emit));

          // keep tail for next iteration
          carry = combined.slice(-windowSize);
        }

        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}