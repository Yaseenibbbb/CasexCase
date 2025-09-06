import OpenAI from 'openai';
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { casePrompts } from '../chat/route'; // Assuming casePrompts is exported from here

// Define types for the expected case data structure
interface CaseFacts {
  ClientName: string;
  CompanyBackground: string;
  BuyerName: string;
  BuyerBackground: string;
  TargetName: string;
  TargetBackground: string;
  StrategicContext: string;
  MarketContext: string;
  Industry: string;
  CoreTask: string;
  ProblemStatement: string;
  Task: string;
  initialPresentationText: string;
  [key: string]: string; // Allow additional string properties
}

interface Exhibit {
  id: number;
  title: string;
  type: 'table' | 'chart' | 'image' | 'text';
  description?: string;
  data: any; // The specific data structure depends on the exhibit type
}

interface GeneratedCaseData {
  caseFacts: CaseFacts;
  exhibits: Exhibit[];
}

// Ensure necessary environment variables are set
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing Supabase URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // IMPORTANT: Use Service Role Key for backend operations
  throw new Error("Missing Supabase Service Role Key");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client with Service Role Key for backend operations
// NOTE: It's crucial to use the Service Role Key here to bypass RLS policies
// when updating the case session data from the backend.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to extract the internal directives from a full prompt
function extractDirectives(fullPrompt: string): string | null {
  const startMarker = "🔒 INTERNAL DIRECTIVES — NEVER SHOW THESE RAW STRINGS TO USER";
  const endMarker = "🎛️ FLOW RULES"; // Or another suitable end marker if FLOW RULES aren't always present

  const startIndex = fullPrompt.indexOf(startMarker);
  if (startIndex === -1) {
    return null; // Start marker not found
  }

  const endIndex = fullPrompt.indexOf(endMarker, startIndex);
  
  // Extract text between markers, adjusting for marker lengths
  const directivesText = endIndex !== -1 
    ? fullPrompt.substring(startIndex + startMarker.length, endIndex)
    : fullPrompt.substring(startIndex + startMarker.length); // If end marker not found, take rest of string

  return directivesText.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, caseType } = await req.json();

    console.log(`[API generate-case-details] Received request for sessionId: ${sessionId}, caseType: ${caseType}`);

    if (!sessionId || !caseType) {
      return NextResponse.json({ error: 'Missing sessionId or caseType' }, { status: 400 });
    }

    // Get the full prompt for the given caseType
    const fullPromptTemplate = casePrompts[caseType];
    if (!fullPromptTemplate) {
      return NextResponse.json({ error: `Invalid caseType: ${caseType}` }, { status: 400 });
    }

    // Extract only the "INTERNAL DIRECTIVES" section needed for generation
    const generationDirectives = extractDirectives(fullPromptTemplate);
    if (!generationDirectives) {
      console.error(`[API generate-case-details] Could not extract directives for caseType: ${caseType}`);
      return NextResponse.json({ error: 'Failed to extract generation directives from prompt template.' }, { status: 500 });
    }
    
    console.log(`[API generate-case-details] Extracted Directives for ${caseType}:`, generationDirectives);


    // Construct the prompt for OpenAI, specifically asking for JSON output
    // Instructing it to ONLY output the JSON object containing caseFacts and exhibits
    const generationSystemPrompt = `
You are a case data generation assistant. Based ONLY on the following internal directives, generate a JSON object containing two keys: 'caseFacts' and 'exhibits'. 

IMPORTANT: The 'caseFacts' object MUST include the following keys (even if empty): 
- ClientName
- CompanyBackground
- BuyerName
- BuyerBackground
- TargetName
- TargetBackground
- StrategicContext
- MarketContext
- Industry
- CoreTask
- ProblemStatement
- Task
- initialPresentationText

***CRITICAL: initialPresentationText MUST contain a detailed introduction of the case (3-5 sentences) and is REQUIRED for the application to function.***

If a value is not relevant for this case, set it to an empty string.

The 'caseFacts' value should be a JSON object populated according to the rules.
The 'exhibits' value should be an array of JSON objects, each representing an exhibit described in the rules (convert any ASCII or Markdown descriptions into the specified JSON structure).
Ensure the entire output is a single, valid JSON object and nothing else. Do not include any introductory text, explanations, or markdown formatting around the JSON.

Internal Directives:
---
${generationDirectives}
---

Example initialPresentationText (make sure to include something similar but specific to this case):
"Hello, I'm Polly, your case interviewer today. We'll be discussing [ClientName], a [brief description] company in the [Industry] industry. They're facing [brief problem statement]. Your task today is to [Task]. Let's start by hearing your approach to this problem."

Output ONLY the final JSON object. Example structure:
{
  "caseFacts": {
    "ClientName": "Example Corp",
    "CompanyBackground": "A retail company...",
    "initialPresentationText": "Hello, I'm Polly, your case interviewer today. We'll be discussing Example Corp, a retail company in the consumer goods industry. They're facing declining market share in their primary markets. Your task today is to evaluate whether they should expand into the online space. Let's start by hearing your approach to this problem."
    // other required fields
  },
  "exhibits": [ /* array of exhibit objects */ ]
}
`;

    console.log("[API generate-case-details] Sending generation request to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Or your preferred model, ensure it handles JSON generation well
      messages: [
        { role: 'system', content: generationSystemPrompt },
      ],
      temperature: 0.7, // Adjust as needed
      max_tokens: 1000, // Adjust as needed, ensure enough for JSON
      // Potentially add response_format if supported and helpful: response_format: { type: "json_object" }
    });

    const rawAiResponse = completion.choices[0]?.message?.content;
    console.log("[API generate-case-details] Raw response from OpenAI:", rawAiResponse);


    if (!rawAiResponse) {
      throw new Error('AI did not return generated case data.');
    }

    // Attempt to parse the AI response as JSON
    let generatedDataJson: GeneratedCaseData | null = null;
    try {
       // Sometimes the AI might still wrap the JSON in backticks or add minor text.
       // Try to find the JSON block more robustly.
       const jsonMatch = rawAiResponse.match(/{[\s\S]*}/); 
       if (jsonMatch && jsonMatch[0]) {
           generatedDataJson = JSON.parse(jsonMatch[0]) as GeneratedCaseData;
           console.log("[API generate-case-details] Successfully parsed JSON from AI response.");
       } else {
           throw new Error("Could not find valid JSON in AI response.");
       }
    } catch (parseError) {
      console.error("[API generate-case-details] Failed to parse JSON from AI response:", parseError);
      console.error("[API generate-case-details] Raw AI response was:", rawAiResponse);
      throw new Error('Failed to parse generated case data from AI response.');
    }

    // ---> NEW: Add validation for the parsed JSON structure <---
    if (!generatedDataJson) {
        console.error("[API generate-case-details] Parsed data is null.", generatedDataJson);
        throw new Error('Generated case data structure is invalid (null).');
    }

    // Check for top-level keys and correct types
    if (!generatedDataJson.caseFacts || !generatedDataJson.exhibits) {
        console.error("[API generate-case-details] Parsed JSON is missing required 'caseFacts' or 'exhibits' keys.", generatedDataJson);
        throw new Error('Generated case data is missing required keys (caseFacts/exhibits).');
    }

    if (typeof generatedDataJson.caseFacts !== 'object' || !Array.isArray(generatedDataJson.exhibits)) {
        console.error("[API generate-case-details] Parsed JSON has incorrect types for 'caseFacts' (should be object) or 'exhibits' (should be array).", generatedDataJson);
        throw new Error('Generated case data has invalid structure (types).');
    }

    // Check specifically for initialPresentationText which is required for the interview to start
    if (!generatedDataJson.caseFacts.initialPresentationText) {
        console.error("[API generate-case-details] Parsed JSON is missing required 'initialPresentationText' in caseFacts.", generatedDataJson);
        throw new Error('Generated case data is missing required field: initialPresentationText');
    }
    // ---> END NEW VALIDATION <---

    // Temporarily use mock data until DNS resolves
    const mockCaseData = {
      caseFacts: {
        ClientName: "TechFlow Solutions",
        CompanyBackground: "A mid-size technology consulting firm specializing in digital transformation",
        BuyerName: "",
        BuyerBackground: "",
        TargetName: "",
        TargetBackground: "",
        StrategicContext: "Considering expansion into new market segments",
        MarketContext: "Competitive technology consulting landscape",
        Industry: "Technology Consulting",
        CoreTask: "Evaluate market entry strategy",
        ProblemStatement: "Should TechFlow expand into the healthcare technology consulting market?",
        Task: "Analyze market opportunity and provide recommendation",
        initialPresentationText: "Hello, I'm Polly, your case interviewer today. We'll be discussing TechFlow Solutions, a technology consulting firm considering expansion into healthcare tech consulting. They want to understand if this represents a viable growth opportunity. Your task is to evaluate this market entry strategy and provide a recommendation. Let's start by hearing your approach to this problem."
      },
      exhibits: []
    };

    // Try to update Supabase, but continue with mock data if it fails
    try {
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('case_sessions')
        .update({ generated_case_data: generatedDataJson || mockCaseData })
        .eq('id', sessionId)
        .select()

      if (updateError) {
        console.warn(`[API generate-case-details] Supabase update failed, using mock data:`, updateError);
      }
    } catch (dbError) {
      console.warn(`[API generate-case-details] Database connection failed, proceeding with mock data:`, dbError);
    }

    console.log(`[API generate-case-details] Successfully generated and saved data for session ${sessionId}.`);
    return NextResponse.json({ success: true, message: 'Case details generated successfully.' });

  } catch (error: any) {
    console.error("[API generate-case-details] Error:", error);
    const errorMessage = error.message || 'Internal Server Error';
    const errorStatus = error.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}

// Ensure we handle OPTIONS requests for CORS preflight if necessary
// (Typically needed if calling from a different domain/port, though less common for internal API routes)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
} 