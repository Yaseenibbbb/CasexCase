import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

// Ensure API key is set
if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error('ELEVENLABS_API_KEY environment variable is not set.');
}

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Define voice IDs (example)
const CASSIDY_VOICE_ID = '56AoDkrOh6qfVPDXZ7Pt'; // Replace with your actual Cassidy voice ID if different
const SAFE_DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Default voice like 'Rachel' or another standard one

// REMOVED: Caching and voice fetching logic (getAndCacheVoiceIds)

// --- API Route Handler ---
export async function POST(req: NextRequest) {
  console.log('[API_SPEAK] Request received');
  try {
    // Revert back to using CASSIDY_VOICE_ID as default
    const { text, voiceId = CASSIDY_VOICE_ID } = await req.json();

    // Input validation
    if (!text || typeof text !== 'string') {
      console.error('[API_SPEAK_POST] Invalid input: text is missing or not a string');
      return NextResponse.json({ error: 'Invalid input: text is required and must be a string.' }, { status: 400 });
    }
    if (typeof voiceId !== 'string') {
      console.error('[API_SPEAK_POST] Invalid input: voiceId is not a string');
      return NextResponse.json({ error: 'Invalid input: voiceId must be a string.' }, { status: 400 });
    }

    console.log(`[API_SPEAK] Requesting audio for text: "${text.substring(0, 30)}..." Using Voice: ${voiceId}`);

    const audio = await elevenlabs.generate({
      voice: voiceId,
      model_id: "eleven_turbo_v2", // Specify Turbo model
      text: text,
    });

    if (!(audio instanceof ReadableStream)) {
      console.error('[API_SPEAK_POST] ElevenLabs did not return a readable stream.');
      return NextResponse.json({ error: 'Failed to generate audio stream.' }, { status: 500 });
    }

    // Set headers for audio streaming
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    // headers.set('Transfer-Encoding', 'chunked'); // Not needed with ReadableStream response

    console.log('[API_SPEAK] Successfully generated audio stream. Sending response.');
    return new NextResponse(audio, { status: 200, headers });

  } catch (error: any) {
    // Log the full error object for detailed debugging
    console.error('[API_SPEAK_POST] Full Error Object:', error);

    // Provide a more generic error message to the client
    return NextResponse.json(
      {
        error: 'Failed to process audio request.',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
} 