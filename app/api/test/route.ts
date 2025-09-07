export const runtime = "nodejs";

export async function GET() {
  return new Response(JSON.stringify({ ok: true, message: "Test route working" }), {
    headers: { "content-type": "application/json" }
  });
}
