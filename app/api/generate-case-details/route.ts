import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { buildCasePackGeneratorSystem } from '@/prompts/caseGenerator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  let sessionId: string | undefined;
  let caseType: string | undefined;
  
  try {
    const requestBody = await request.json();
    sessionId = requestBody.sessionId;
    caseType = requestBody.caseType;
    const { useCase, company, industry, roleFocus, geography, difficulty, timeLimitMinutes, includeSolutionGuide, exhibitPreferences, constraintsNotes } = requestBody;
    
    console.log(`[API generate-case-details] Received request for sessionId: ${sessionId}, caseType: ${caseType}`);

    // Check if demo mode
    const isDemo = sessionId?.startsWith('demo-session-');
    
    if (isDemo) {
      console.log(`[API generate-case-details] Demo mode - generating real case with OpenAI`);
      // Continue to OpenAI generation below instead of returning mock data
    }

    // Generate case using the new CaseByCase prompt system
    console.log(`[API generate-case-details] Generating case with CaseByCase prompt system...`);
    
    // Add entropy for uniqueness
    const entropy = `${Date.now()}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))}`;
    
    const systemPrompt = buildCasePackGeneratorSystem({
      useCase: useCase || 'A business strategy case requiring analysis and recommendation',
      company: company || 'N/A',
      industry: industry || 'Technology',
      roleFocus: roleFocus || 'Strategy',
      geography: geography || 'Global',
      difficulty: difficulty || 'intermediate',
      timeLimitMinutes: timeLimitMinutes || 30,
      includeSolutionGuide: includeSolutionGuide || false,
      exhibitPreferences: exhibitPreferences || 'auto',
      constraintsNotes: constraintsNotes || 'Standard business assumptions apply'
    });

    const userPromptString = `Generate a complete case study with these inputs:

- use_case: ${useCase || 'A business strategy case requiring analysis and recommendation'}
- company: ${company || 'N/A'}
- industry: ${industry || 'Technology'}
- role_focus: ${roleFocus || 'Strategy'}
- geography: ${geography || 'Global'}
- difficulty: ${difficulty || 'intermediate'}
- time_limit_minutes: ${timeLimitMinutes || 30}
- include_solution_guide: ${includeSolutionGuide || false}
- exhibit_preferences: ${exhibitPreferences || 'auto'}
- constraints_notes: ${constraintsNotes || 'Standard business assumptions apply'}
- entropy_seed: ${entropy}

Create a realistic, engaging case study with 2-5 exhibits and all required sections.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.85,
      top_p: 1,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPromptString
        }
      ],
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    console.log(`[API generate-case-details] Raw response from OpenAI:`, responseText);

    if (!responseText) {
      throw new Error("OpenAI returned no content");
    }

    // Parse the structured response
    const parsedData = parseCaseResponse(responseText);
    console.log(`[API generate-case-details] Successfully parsed case response.`);

    // Update the case session with generated data (only if sessionId is provided)
    if (sessionId) {
      try {
        console.log(`[API generate-case-details] Updating case session in Supabase...`);
        const { error: updateError } = await supabase
          .from('case_sessions')
          .update({ 
            generated_case_data: parsedData,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (updateError) throw updateError;
        console.log(`[API generate-case-details] Successfully updated case session ${sessionId}`);
      } catch (e) {
        console.error(`[API generate-case-details] Supabase update failed:`, e);
        // but still return the generated pack — don't 500 here
      }
    }

    console.log(`[API generate-case-details] Successfully generated and saved data for session ${sessionId}.`);
    console.info("[generate-case-details] success:", { 
      sessionId, 
      caseTitle: (parsedData?.caseMeta as any)?.title || "Unknown",
      company: (parsedData?.caseMeta as any)?.company || "Unknown",
      fallback: false 
    });
    return NextResponse.json(
      { 
        success: true, 
        data: parsedData,
        sessionId: sessionId,
        fallback: false
      },
      { headers: { "Cache-Control": "no-store" } }
    );

  } catch (error) {
    console.error("[API generate-case-details] Error:", error);

    // Only use mock when the session is explicitly a demo
    const isDemo = typeof sessionId === "string" && sessionId.startsWith("demo-session-");
    if (isDemo) {
      console.info("[generate-case-details] fallback:", { reason: "demo session", isDemo, sessionId });
      const mockData = generateMockCaseData(caseType);
      return NextResponse.json(
        { success: true, data: mockData, fallback: true },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Otherwise, surface the error so the UI can show a toast instead of a fake case
    return NextResponse.json(
      { success: false, error: (error as Error).message ?? "Unknown error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

function parseCaseResponse(responseText: string) {
  // Extract exhibits using regex
  const exhibitRegex = /\[\[EXHIBIT:([^|]+)\|([^\]]+)\]\]\s*([\s\S]*?)\s*\[\[\/EXHIBIT\]\]/g;
  const exhibits = [];
  let match;

  while ((match = exhibitRegex.exec(responseText)) !== null) {
    const [, type, attributes, content] = match;
    const attrObj: Record<string, string> = {};
    attributes.split('|').forEach(attr => {
      const [key, value] = attr.split('=');
      if (key && value) {
        attrObj[key] = value.replace(/"/g, '');
      }
    });

    exhibits.push({
      type: type.toLowerCase(),
      ...attrObj,
      content: content.trim()
    });
  }

  // Extract case meta
  const metaMatch = responseText.match(/\[\[CASE_META\]\]\s*([\s\S]*?)\s*\[\[\/CASE_META\]\]/);
  let caseMeta = {};
  if (metaMatch) {
    try {
      caseMeta = JSON.parse(metaMatch[1].trim());
    } catch (e) {
      console.error('Failed to parse case meta:', e);
    }
  }

  // Extract solution guide if present
  const solutionMatch = responseText.match(/\[\[SOLUTION_GUIDE_START\]\]\s*([\s\S]*?)\s*\[\[SOLUTION_GUIDE_END\]\]/);
  const solutionGuide = solutionMatch ? solutionMatch[1].trim() : null;

  // Extract main content sections
  const sections = {
    background: extractSection(responseText, '## Background'),
    objectives: extractSection(responseText, '## Objectives'),
    constraints: extractSection(responseText, '## Constraints & Assumptions'),
    tasks: extractSection(responseText, '## Candidate Tasks'),
    interviewerScript: extractSection(responseText, '## Interviewer Script'),
    evaluationRubric: extractSection(responseText, '## Evaluation Rubric'),
    deliverables: extractSection(responseText, '## Expected Deliverables'),
    notes: extractSection(responseText, '## Notes for the Candidate')
  };

  return {
    caseMeta,
    exhibits,
    sections,
    solutionGuide,
    rawResponse: responseText
  };
}

function extractSection(text: string, sectionTitle: string): string {
  const regex = new RegExp(`${sectionTitle}\\s*([\\s\\S]*?)(?=##|\\[\\[|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function generateMockCaseData(caseType?: string) {
  return {
    caseMeta: {
      title: `${caseType || 'Mock'} Case Study`,
      industry: "Technology",
      company: "TechFlow Solutions",
      geography: "Global",
      difficulty: "intermediate",
      time_limit: 30,
      role_focus: "Strategy",
      exhibits: [
        {"id": "E1", "type": "table", "title": "Market Overview"},
        {"id": "E2", "type": "chart", "title": "Revenue Trends"}
      ]
    },
    exhibits: [
      {
        id: "E1",
        type: "table",
        title: "Market Overview",
        content: "| Metric | Value |\n|--------|-------|\n| Market Size | $2.5B |\n| Growth Rate | 15% |\n| Competition | High |"
      },
      {
        id: "E2", 
        type: "chart",
        title: "Revenue Trends",
        content: '{"data":[{"year":"2021","revenue":100},{"year":"2022","revenue":120},{"year":"2023","revenue":140}], "lines":[{"key":"revenue","name":"Revenue (M$)"}]}'
      }
    ],
    sections: {
      background: "TechFlow Solutions is a mid-size technology consulting firm considering expansion into healthcare tech consulting.",
      objectives: "- Evaluate market opportunity\n- Assess competitive landscape\n- Recommend go/no-go decision",
      constraints: "- 6-month decision timeline\n- $50M budget constraint\n- Regulatory compliance required",
      tasks: "Analyze the healthcare tech consulting market and provide a recommendation on whether to enter this market.",
      interviewerScript: "**Opening Prompt:** Please restate the objective and outline your approach to evaluating this market entry opportunity.",
      evaluationRubric: "Structure (0-5), Quant accuracy (0-5), Business judgment (0-5), Communication (0-5), Data use (0-5)",
      deliverables: "60-second problem framing, 2-3 insights backed by exhibits, clear recommendation with quantified impact",
      notes: "Focus on market sizing, competitive analysis, and strategic fit. Time limit: 30 minutes."
    },
    solutionGuide: null,
    rawResponse: "Mock case data for demo mode"
  };
}