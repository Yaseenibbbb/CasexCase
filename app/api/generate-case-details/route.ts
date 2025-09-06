import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, caseType, useCase, company, industry, roleFocus, geography, difficulty, timeLimitMinutes, includeSolutionGuide, exhibitPreferences, constraintsNotes } = await request.json();
    
    console.log(`[API generate-case-details] Received request for sessionId: ${sessionId}, caseType: ${caseType}`);

    // Check if demo mode
    const isDemo = sessionId?.startsWith('demo-session-');
    
    if (isDemo) {
      // Return mock data for demo mode
      const mockData = generateMockCaseData(caseType);
      console.log(`[API generate-case-details] Demo mode - returning mock data`);
      return NextResponse.json({ 
        success: true, 
        data: mockData,
        sessionId: sessionId,
        demo: true
      });
    }

    // Generate case using the new CaseByCase prompt system
    console.log(`[API generate-case-details] Generating case with CaseByCase prompt system...`);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are CaseByCase's Case Pack Generator. When invoked, you will produce a complete, interview-ready case study for the provided use case. Your output must be TTS-friendly for ElevenLabs speech synthesis AND machine-readable for the Exhibit Panel.

CRITICAL TTS REQUIREMENTS:
- NO asterisks, markdown formatting, or special characters that break TTS
- Use plain text only - no bold, italics, or formatting symbols
- Write in conversational, natural speech patterns
- Use short, clear sentences that flow well when spoken
- Avoid complex punctuation that confuses TTS engines
- Use "and" instead of "&", spell out numbers, avoid abbreviations

GOALS
- Generate a realistic case tailored to the input use case and metadata
- Provide clear narrative, tasks, and 2–5 well-scoped exhibits
- Create TTS-friendly content that sounds natural when spoken
- Include structured data for AI context and evaluation

OUTPUT RULES (critical)
- Write ALL text content for TTS - no markdown, no asterisks, no special formatting
- Use the exact delimiters below for machine parsing
- Do NOT wrap EXHIBIT blocks or META/SOLUTION blocks in code fences
- Prefer whole numbers and simple decimals; show units
- Charts must include a compact JSON spec compatible with Recharts
- Images must include a resolvable URL (or omit if none)
- If numbers are fabricated, keep them internally consistent

DELIMITERS (use exactly)
EXHIBIT BLOCKS:
[[EXHIBIT:TABLE|id=E#|title="..."]]
<markdown table here>
[[/EXHIBIT]]

[[EXHIBIT:CHART|id=E#|title="..."|type=line|xKey="<x>" ]]
{"data":[{"<x>":"...","<seriesKey>":<number>, ...}], "lines":[{"key":"<seriesKey>","name":"<Legend Label>"}]}
[[/EXHIBIT]]

[[EXHIBIT:CHART|id=E#|title="..."|type=bar|xKey="<x>" ]]
{"data":[...], "bars":[{"key":"<seriesKey>","name":"<Legend Label>"}]}
[[/EXHIBIT]]

[[EXHIBIT:CHART|id=E#|title="..."|type=pie|nameKey="<name>"|valueKey="<value>"]]
{"data":[{"<name>":"A","<value>":123}, ...]}
[[/EXHIBIT]]

[[EXHIBIT:IMAGE|id=E#|title="..."|url="https://..."]]
[[/EXHIBIT]]

META + SOLUTION:
[[CASE_META]]
{"title":"...", "industry":"...", "company":"...", "geography":"...", "difficulty":"...", "time_limit":<minutes>, "role_focus":"...", "exhibits":[{"id":"E1","type":"table","title":"..."}, ...]}
[[/CASE_META]]

[[SOLUTION_GUIDE_START]]
... your step-by-step solution, key calcs, and model answers ...
[[SOLUTION_GUIDE_END]]

STRUCTURE (produce all sections - ALL TEXT MUST BE TTS-FRIENDLY)
# {company} — {concise_case_title_based_on_use_case}

## Background
One short paragraph setting context. Include geography if relevant. Clarify the core problem and why it matters now. Write in natural, conversational tone suitable for speech.

## Objectives
List three to five concrete goals. For example: size the opportunity, diagnose margin compression, design MVP scope. Write each as a complete sentence, not bullet points.

## Constraints and Assumptions
List the constraints from the input plus sensible interview assumptions. Include data windows, currency, seasonality. Write as flowing text, not bullet points.

## Candidate Tasks
Describe what the candidate must do in terms of analytics, structure, and recommendation. Tie explicitly to the exhibits you will provide. Write as natural speech.

## Data and Exhibits
Provide two to five exhibits honoring the preferences. Use E1 through E5 IDs. Make each exhibit referenced later in the prompts and solution.

## Interviewer Script
Opening Prompt: Write one concise paragraph inviting the candidate to restate the objective and outline their approach. This will be spoken directly to the candidate.

Probing Questions: List six to ten questions touching market size, customer segments, operations bottlenecks, unit economics, risks, and recommendation. Write as natural questions that flow in conversation.

Hints and Framework Nudges: List three to five hints. For example: Consider demand-side versus supply-side constraints, Decompose margin equals price minus variable cost minus acquisition. Write as conversational guidance.

Checkpoint Questions: List two to three quick calculational checks referencing exhibit IDs. Write as natural questions.

Wrap-Up Prompt: Ask for final recommendation, risks, and next steps. Write as a natural conclusion to the interview.

## Evaluation Rubric
Structure and MECE thinking: zero to five points. Quantitative accuracy: zero to five points. Business judgment: zero to five points. Communication and clarity: zero to five points. Data usage: zero to five points. Define what five points looks like for each category.

## Expected Deliverables
A sixty-second problem framing, two to three insights backed by exhibits, and a clear recommendation with quantified impact.

## Notes for the Candidate
What is out of scope, any definitions, and time reminders. Time limit is {time_limit_minutes} minutes.`
        },
        {
          role: "user",
          content: `Generate a complete case study with these inputs:

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

Create a realistic, engaging case study with 2-5 exhibits and all required sections.`
        }
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    console.log(`[API generate-case-details] Raw response from OpenAI:`, responseText);

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the structured response
    const parsedData = parseCaseResponse(responseText);
    console.log(`[API generate-case-details] Successfully parsed case response.`);

    // Update the case session with generated data
    console.log(`[API generate-case-details] Updating case session in Supabase...`);
    const { error: updateError } = await supabase
      .from('case_sessions')
      .update({ 
        generated_case_data: parsedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error(`[API generate-case-details] Supabase update failed:`, updateError);
      // Return the generated data anyway, even if we can't save it
      console.log(`[API generate-case-details] Supabase update failed, using generated data:`, updateError);
    }

    console.log(`[API generate-case-details] Successfully generated and saved data for session ${sessionId}.`);
    return NextResponse.json({ 
      success: true, 
      data: parsedData,
      sessionId: sessionId 
    });

  } catch (error) {
    console.error(`[API generate-case-details] Error:`, error);
    
    // Return mock data as fallback
    const mockData = generateMockCaseData(caseType);

    return NextResponse.json({ 
      success: true, 
      data: mockData,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function parseCaseResponse(responseText: string) {
  // Extract exhibits using regex
  const exhibitRegex = /\[\[EXHIBIT:([^|]+)\|([^\]]+)\]\]\s*([\s\S]*?)\s*\[\[\/EXHIBIT\]\]/g;
  const exhibits = [];
  let match;

  while ((match = exhibitRegex.exec(responseText)) !== null) {
    const [, type, attributes, content] = match;
    const attrObj = {};
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

function generateMockCaseData(caseType: string) {
  return {
    caseMeta: {
      title: `${caseType} Case Study`,
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
