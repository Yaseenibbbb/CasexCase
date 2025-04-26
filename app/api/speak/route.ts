import { NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

// Validate environment variables
if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error("Missing ElevenLabs API key");
}

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Use a default voice ID (e.g., Rachel - find IDs on ElevenLabs website)
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text: string = body.text;
    const voiceId: string = body.voiceId || DEFAULT_VOICE_ID;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log(`[API_SPEAK] Requesting audio for text: "${text.substring(0, 50)}..." Voice: ${voiceId}`);

    const audioStream = await elevenlabs.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_multilingual_v2", // Or your preferred model
      stream: true,
      // Optional parameters for voice settings can be added here
      // voice_settings: {
      //   stability: 0.5,
      //   similarity_boost: 0.75,
      // },
    });

    console.log("[API_SPEAK] Received audio stream from ElevenLabs.");

    // Return the audio stream directly
    // Set appropriate headers for audio streaming
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg'); // Adjust mime type if necessary
    headers.set('Transfer-Encoding', 'chunked');

    return new NextResponse(audioStream as any, { status: 200, headers });

  } catch (error: any) {
    console.error('[API_SPEAK_POST]', error);
    // Attempt to parse ElevenLabs specific errors if possible
    const errorMessage = error.message || 'Internal Server Error';
    const errorStatus = error.status || 500;
    return NextResponse.json({ error: `ElevenLabs Error: ${errorMessage}` }, { status: errorStatus });
  }
} 