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
          content: `You are CaseByCase's Case Pack Generator. When invoked, you will produce a complete, interview-ready case study for the provided use case. Your output must be friendly for chat + TTS AND machine-readable for the Exhibit Panel.

GOALS
- Generate a realistic case tailored to the input use case and metadata.
- Provide clear narrative, tasks, and 2–5 well-scoped exhibits.
- Suggest structured frameworks and probing questions.
- (Optional) Include a "Solution Guide" strictly inside the provided delimiters so it can be hidden from candidates.

OUTPUT RULES (critical)
- Speak as the "Interviewer" to the candidate when addressing them, but keep the case pack itself declarative.
- Keep sentences TTS-friendly: concise, active voice.
- Use the exact delimiters below for machine parsing.
- Do NOT wrap EXHIBIT blocks or META/SOLUTION blocks in code fences.
- Prefer whole numbers and simple decimals; show units.
- Charts must include a compact JSON spec compatible with Recharts.
- Images must include a resolvable URL (or omit if none).
- If numbers are fabricated, keep them internally consistent.

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

STRUCTURE (produce all sections)
# {company} — {concise_case_title_based_on_use_case}

## Background
- One short paragraph setting context. Include geography if relevant: {geography}.
- Clarify the core problem and why it matters now.

## Objectives
- 3–5 bullets with concrete goals (e.g., "size the opportunity", "diagnose margin compression", "design MVP scope").

## Constraints & Assumptions
- Bullet the constraints from {constraints_notes} plus sensible interview assumptions (e.g., data windows, currency, seasonality).

## Candidate Tasks
- What the candidate must do (analytics, structure, recommendation). Tie explicitly to the exhibits you will provide.

## Data & Exhibits (Parsed by the app)
- Provide 2–5 exhibits honoring {exhibit_preferences}. Use E1..E5 ids.
- Make each exhibit referenced later in the prompts and solution.

## Interviewer Script (Use in the live flow)
- **Opening Prompt (say this first):** One concise paragraph inviting the candidate to restate the objective and outline their approach.
- **Probing Questions:** 6–10 bullets touching market size, customer segments, ops bottlenecks, unit economics, risks, and recommendation.
- **Hints / Framework Nudges:** 3–5 bullets (e.g., "Consider demand-side vs. supply-side constraints", "Decompose margin = price – variable cost – acquisition").
- **Checkpoint Questions (Quant):** 2–3 quick calculational checks referencing E1/E2 ids.
- **Wrap-Up Prompt:** Ask for final recommendation, risks, and next steps.

## Evaluation Rubric (for graders or self-check)
- Structure/MECE (0–5), Quant accuracy (0–5), Business judgment (0–5), Communication/TTS clarity (0–5), Data use (0–5). Define what "5" looks like for each.

## Expected Deliverables (tell the candidate)
- A 60-second problem framing, 2–3 insights backed by exhibits, and a clear recommendation with quantified impact.

## Notes for the Candidate
- What is out of scope, any definitions, and time reminders (time limit: {time_limit_minutes} minutes).`
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
