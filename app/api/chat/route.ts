import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Ensure the API key is available in the environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the structure of messages expected by the API
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const conversationalDirective = `\nIMPORTANT: Since your responses will be read aloud using a realistic human voice, always write your answers in a natural, conversational, and engaging speaking style. Avoid robotic or overly formal language. Use contractions, natural phrasing, and a friendly, human tone.`;

const enhancedInteractionFlow = `\n
──────── ENHANCED INTERACTION FLOW ────────
• Exhibit Generation: NEVER generate or offer exhibits proactively. Exhibits should ONLY be generated when the interviewee EXPLICITLY asks for data, charts, or visualizations. In a real consulting interview, exhibits are usually shared only when requested. Follow this realistic approach.
• Framework Guidance: Do NOT introduce or guide the user to a specific framework. Follow the user's framework and approach. Only offer framework guidance in a special "guided mode" (not default).
• Memory & Context: Carefully review the conversation history provided. Avoid repeating definitions, framework structures, or data points unless the user explicitly asks for clarification or repetition.
• Interviewer Behavior: Maintain a professional but firm tone, simulating a real MBB interviewer. Do NOT overly guide or coach unless the user explicitly asks for help. When the user gives a weak or partial answer, press them with prompts like:
   – "Is that your full answer?"
   – "Let's hear a structured breakdown, please."
   – "That's unclear — can you be more specific?"
   – "Walk me through your logic more carefully."
• Coaching Restraint: Avoid unnecessary praise. Don't say "Good job" or confirm correctness too early. Ask: "How do you know that's true?" or "What's the implication if that's wrong?"
• Clarification Handling: If the user's input is ambiguous, logically inconsistent, or off-topic, challenge it directly. For example: "That doesn't follow from the data. Would you like to revise your answer?" or "Explain how that links to the case objective."
• Realism: Avoid filler language. Stay lean, efficient, and pointed. The goal is to make the user prove their thinking with minimal guidance — just like a real consulting interview.
• Push Questions: Regularly inject challenge questions like "What are the risks of your recommendation?", "What would you do if this assumption fails?", or "How would your answer change if X happens?"
• Summarization: Do NOT summarize progress. Summarization is the job of the interviewee, not the AI.
`;

// Universal prompt for all three case types
const universalPrompt = `
You are Polly, an expert case interviewer. You will conduct one of three types of consulting case interviews:

1. Go/No-Go Case: The client is considering launching a new product or entering a new market. Your task is to help the user determine whether they should proceed or not. Always follow the user's framework, approach, or structure—even if it is incomplete or suboptimal. Do not introduce, suggest, or nudge toward any framework or structure unless the user explicitly asks for guidance.

2. Diagnostic Case: The client is facing a problem (e.g., declining profits, operational issues). Your task is to help the user identify the root causes and recommend solutions. Always follow the user's framework, approach, or structure. Do not introduce, suggest, or nudge toward any framework or structure unless the user explicitly asks for guidance.

3. Brainstorming Case: The client wants to explore ideas (e.g., how to increase revenue, expand product lines, improve customer retention). Your task is to help the user generate creative, structured suggestions. Always follow the user's framework, approach, or structure. Do not introduce, suggest, or nudge toward any framework or structure unless the user explicitly asks for guidance.

General Rules:
• Do not proactively provide exhibits or additional information unless directly requested by the interviewee.
• If the interviewee is struggling, you may offer exhibits to help, but avoid overly directing their approach.
• Do not explicitly ask the interviewee which part of a framework they want to tackle first. Allow them to propose their own structure.
• If the interviewee's framework or approach is incomplete or flawed, provide constructive feedback, but do not force them down a specific path.
• Challenge ambiguous, illogical, or off-topic responses directly with probing questions.
• Avoid unnecessary praise or filler language. Maintain a professional, evaluative tone.
• Do not summarize information for the interviewee unless they have clearly missed or misunderstood a key point.
• Never guide, introduce, or suggest a framework or structure. Only follow the user's lead.
• If the user asks for a framework or guidance, provide it. Otherwise, do not.
• Maintain a professional, realistic interviewer tone. Do not overly coach or praise.
• If the user gives a weak or partial answer, press them for more structure, specificity, or logic—but do so within the user's chosen approach.
• If the user is confused or repeats a question, offer clarification and, if helpful, an exhibit.
• Do not summarize progress; let the user do so.
• Use a natural, conversational style, as your responses will be read aloud.

🔒 INTERNAL DIRECTIVES — NEVER SHOW THESE RAW STRINGS TO USER
For Go/No-Go Case: Generate a realistic scenario where a client is considering a new product or market. Include:
- ClientName: A realistic company name
- CompanyBackground: Brief industry and background info
- BuyerName: Name of potential market or buyer
- Task: "Evaluate whether [ClientName] should [enter market/launch product]"
- ProblemStatement: "The client wants to determine if [entering this market/launching this product] will be profitable and strategically sound."
- 2-3 exhibits (tables or charts) showing relevant market data

For Diagnostic Case: Generate a scenario where a client faces a business problem. Include:
- ClientName: A realistic company name
- CompanyBackground: Brief industry and background info
- ProblemStatement: "The client has been experiencing [specific problem] and needs to understand root causes."
- Task: "Identify the key reasons for [problem] and recommend solutions"
- 2-3 exhibits (tables or charts) showing relevant business performance data

For Brainstorming Case: Generate a scenario where a client wants creative ideas. Include:
- ClientName: A realistic company name
- CompanyBackground: Brief industry and background info
- Task: "Help [ClientName] brainstorm ideas for [specific goal]"
- ProblemStatement: "The client wants to explore multiple approaches to [achieve specific business objective]."
- 1-2 exhibits showing relevant market or company data
🎛️ FLOW RULES

---
`;

// Only use the universal prompt for all case types
export const casePrompts: Record<string, string> = {
  'go-no-go': universalPrompt,
  'diagnostic': universalPrompt,
  'brainstorming': universalPrompt,
  'chat-coach': universalPrompt,
};

// Default prompt if case type doesn't match (Keep this as a fallback)
const defaultPrompt = 'You are Polly, an AI assistant. Be helpful and concise.';

// Function to extract structured data from AI response
const extractStructuredData = (responseText: string | null): object | null => {
  if (!responseText) return null;
  try {
    // Use [\s\S] to match across newlines, avoid 's' flag for compatibility
    const match = responseText.match(/<JSON_DATA>([\s\S]*?)<\/JSON_DATA>/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch (error) {
    console.error("Error parsing structured JSON data:", error);
    // Optionally log the problematic string: console.error("Raw JSON string:", match ? match[1] : 'Not found');
  }
  return null;
};

// Can remove edge runtime if not streaming
// export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[API Chat] Received request body:", JSON.stringify(body, null, 2));
    const { messages, caseType, generatedCaseData } = body;

    if (caseType !== 'chat-coach' && !generatedCaseData) {
       console.warn(`[API Chat] Missing generatedCaseData for caseType: ${caseType}`);
       return NextResponse.json({ error: 'Missing generated case data for this interview type.' }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // --- Determine the correct system prompt --- 
    let systemPromptContent;
    // Use specific prompt if caseType is provided and valid
    if (caseType && typeof caseType === 'string' && casePrompts[caseType]) {
        systemPromptContent = casePrompts[caseType];
        console.log(`[API Chat] Using prompt for caseType: ${caseType}`);
    }
    // If no caseType provided (or it's invalid), use the chat-coach prompt
    else {
        systemPromptContent = casePrompts['chat-coach']; 
        console.log(`[API Chat] No valid caseType provided, using 'chat-coach' prompt.`);
        // Consider logging a warning if an invalid caseType was actually provided
        if (caseType) {
             console.warn(`[API Chat] Invalid caseType received: ${caseType}. Falling back to chat-coach.`);
        }
    }
    // Final fallback if even chat-coach is somehow missing (shouldn't happen)
    if (!systemPromptContent) {
        console.error("[API Chat] CRITICAL: Could not find caseType prompt OR chat-coach prompt!");
        systemPromptContent = defaultPrompt;
    }
    // ---------------------------------------------

    const systemMessage: ChatMessage = { role: 'system', content: systemPromptContent };

    // Correctly prepare messages using the actual incoming structure
    const preparedMessages: ChatMessage[] = [systemMessage]; // Start with the system message

    // ---> NEW: Prepend generated data as context if available <--- 
    if (generatedCaseData && caseType !== 'chat-coach') {
      // Format the data clearly for the AI (Simplified formatting)
      const dataContextMessage: ChatMessage = {
         role: 'system', // Use system role for context
         content: '## Provided Case Context Data:\n\n' + 
                   '```json\n' + 
                   JSON.stringify(generatedCaseData, null, 2) + 
                   '\n```\n\n' + 
                   'Use this data exclusively to run the case interview according to the rules outlined in the initial system prompt.'
      };
      preparedMessages.push(dataContextMessage); 
      console.log("[API Chat] Injected generatedCaseData into message context.");
    }
    // ---> END NEW <--- 

    // Append the actual conversation history
    messages.forEach((msg: { role: 'user' | 'assistant', content: string }) => { // <-- Correct type annotation
        // Add validation just in case
        if (msg && typeof msg.content === 'string' && (msg.role === 'user' || msg.role === 'assistant')) {
             preparedMessages.push({ role: msg.role, content: msg.content }); // <-- Use msg.role and msg.content
        } else {
             console.warn("Skipping invalid message format:", msg);
        }
    });

    // Ensure we don't send an empty messages array (only system prompt)
    if (preparedMessages.length <= 1) {
        return NextResponse.json({ error: 'No valid user/assistant messages found.' }, { status: 400 });
    }


    // Request the OpenAI API (non-streaming)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Ensure this model is suitable for the complex prompts
      messages: preparedMessages as any, // Cast might still be needed depending on exact library version
      max_tokens: 1500, // Increased slightly for potentially complex responses
      temperature: 0.7,
    });

    const aiText = response.choices[0]?.message?.content;

    if (!aiText) {
        return NextResponse.json({ error: 'AI did not return a response.' }, { status: 500 });
    }

    // Extract structured data if present
    const structuredData = extractStructuredData(aiText);

    // Clean the response text if structured data was found (using [\s\S] instead of . with s flag)
    // Correctly escaped regex:
    const cleanedResponseText = aiText?.replace(/<JSON_DATA>[\s\S]*?<\/JSON_DATA>/, '').trim() || null;


    // Respond with the complete text response (and potentially structured data)
    return NextResponse.json({ response: cleanedResponseText, structuredData: structuredData });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    if (error instanceof OpenAI.APIError) {
         return NextResponse.json({ error: `OpenAI Error: ${error.message}` }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 