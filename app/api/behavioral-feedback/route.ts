import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI client (Ensure OPENAI_API_KEY is set in your environment variables)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { questionTitle, questionDescription, userAnswer } = await req.json();

    if (!questionTitle || !questionDescription || !userAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `\nYou are an expert career coach specializing in behavioral interview questions.\nYour task is to evaluate a user's answer to a specific behavioral question and provide constructive feedback.\n\n**Question:** ${questionTitle}\n**Question Description:** ${questionDescription}\n\n**User's Answer:**\n${userAnswer}\n\n**Instructions for Feedback:**\n1.  Analyze the answer based on the STAR method (Situation, Task, Action, Result), relevance, detail, impact, clarity, and conciseness.\n2.  Format your response using Markdown.\n3.  **Crucially, structure your feedback using the following specific headings:**\n    - \`## Strengths\` (Highlight what the user did well)\n    - \`## Areas for Improvement\` (Suggest specific ways to enhance the answer)\n    - \`## STAR Method Breakdown\` (Analyze the answer's structure explicitly against Situation, Task, Action, Result)\n    - \`## Revised Example Answer\` (Provide a concise example incorporating the feedback)\n4.  Be encouraging, professional, and actionable.\n`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Or your preferred model
      messages: [
        { role: 'system', content: prompt },
      ],
      temperature: 0.6, // Adjust for creativity vs. consistency
      max_tokens: 500, // Limit response length
    });

    const feedback = completion.choices[0]?.message?.content;

    if (!feedback) {
      return NextResponse.json({ error: 'Failed to generate feedback from AI.' }, { status: 500 });
    }

    return NextResponse.json({ feedback });

  } catch (error) {
    console.error("Error in /api/behavioral-feedback:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 