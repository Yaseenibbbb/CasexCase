import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Ensure the OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    console.log(`[API /generate-description] Received topic: "${topic}"`);

    // Construct the prompt for OpenAI
    const prompt = `Given the user's initial case interview topic/question, refine or elaborate on it to create a slightly more detailed and clearer scenario suitable for a case interview practice session. Keep it concise (1-2 sentences).

Initial Topic: "${topic}"

Refined Scenario:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Or choose another suitable model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7, // Adjust creativity
      max_tokens: 100, // Limit response length
      n: 1,
    });

    const generatedDescription = completion.choices[0]?.message?.content?.trim();

    console.log(`[API /generate-description] Generated description: "${generatedDescription}"`);

    if (!generatedDescription) {
      throw new Error('AI failed to generate a description.');
    }

    return NextResponse.json({ description: generatedDescription });

  } catch (error) {
    console.error("[API /generate-description] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to generate description: ${errorMessage}` }, { status: 500 });
  }
} 