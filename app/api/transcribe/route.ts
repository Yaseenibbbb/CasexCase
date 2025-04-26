import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs'; // Import fs for potential temporary file handling if needed
import os from 'os';
import path from 'path';

// Ensure the API key is available
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    console.log(`[API_TRANSCRIBE] Received audio file: ${audioFile.name}, Size: ${audioFile.size}, Type: ${audioFile.type}`);

    // Convert ArrayBuffer to Buffer if necessary for OpenAI client, or use directly if supported
    // OpenAI Node SDK v4+ generally supports File objects directly

    console.log("[API_TRANSCRIBE] Sending audio to OpenAI Whisper...");

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile, // Pass the File object directly
      model: 'whisper-1',
      // language: 'en', // Optional: Specify language if known
      // response_format: 'json', // Default is json
    });

    console.log("[API_TRANSCRIBE] Transcription received:", transcription);

    const transcribedText = transcription.text;

    if (typeof transcribedText !== 'string') {
      return NextResponse.json({ error: 'Failed to get transcription text' }, { status: 500 });
    }

    return NextResponse.json({ transcription: transcribedText });

  } catch (error) {
    console.error('[API_TRANSCRIBE_POST]', error);
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json({ error: `OpenAI Error: ${error.message}` }, { status: error.status || 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 