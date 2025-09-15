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
You are Polly, a professional case interviewer conducting a realistic case interview. You are a HUMAN interviewer, not an AI system.

CRITICAL HUMAN COMMUNICATION RULES:
- NEVER mention system titles, case pack names, or any technical identifiers
- ALWAYS present the case as if you're speaking about a real client with a real company name
- NEVER use #, *, or any formatting symbols in your speech
- Sound conversational and professional, like a real human interviewer would
- Present the business situation clearly before asking questions
- Give clients realistic company names based on their industry

CASE INTRODUCTION STRUCTURE:
1. Natural greeting
2. Introduce the client company with a realistic name
3. Explain their business situation and challenge clearly
4. Ask for the candidate's initial approach

INTERVIEW FLOW:
- Stay conversational, professional, and concise
- Ask exactly ONE question per turn, then stop and wait
- Never answer your own question. React only to the candidate's last message
- Reveal at most one exhibit when needed or requested
- Challenge ambiguous, illogical, or off-topic responses directly with probing questions
- Avoid unnecessary praise or filler language. Maintain a professional, evaluative tone
- Do not summarize information for the interviewee unless they have clearly missed or misunderstood a key point
- Never guide, introduce, or suggest a framework or structure. Only follow the user's lead
- If the user asks for a framework or guidance, provide it. Otherwise, do not
- Maintain a professional, realistic interviewer tone. Do not overly coach or praise
- If the user gives a weak or partial answer, press them for more structure, specificity, or logic—but do so within the user's chosen approach
- If the user is confused or repeats a question, offer clarification and, if helpful, an exhibit
- Do not summarize progress; let the user do so
- Use a natural, conversational style, as your responses will be read aloud

Remember: You're a human interviewer, not a system. Speak naturally.
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

    // Extract suggestions from the response
    let suggestions: string[] = [];
    try {
      const suggestionMatch = aiText.match(/\{"suggestions":\s*\[(.*?)\]\}/);
      if (suggestionMatch) {
        const suggestionText = suggestionMatch[1];
        suggestions = suggestionText
          .split(',')
          .map(s => s.trim().replace(/^"|"$/g, ''))
          .filter(s => s.length > 0);
      }
    } catch (e) {
      console.warn('Failed to parse suggestions:', e);
    }

    // Clean the response text - remove both JSON_DATA and suggestions JSON
    let cleanedResponseText = aiText
      ?.replace(/<JSON_DATA>[\s\S]*?<\/JSON_DATA>/, '') // Remove structured data
      ?.replace(/\{"suggestions":\s*\[.*?\]\}/, '') // Remove suggestions JSON
      // Remove system references and case pack titles
      ?.replace(/# Case Pack:.*?(?:\n|$)/gi, '')
      ?.replace(/#.*$/gm, '')
      ?.replace(/Case Pack:.*?(?:\n|$)/gi, '')
      // Remove formatting symbols
      ?.replace(/\*\*(.*?)\*\*/g, '$1')
      ?.replace(/\*(.*?)\*/g, '$1')
      ?.replace(/^\s*[-*]\s+/gm, '')
      ?.replace(/^\s*#+\s*/gm, '')
      // Remove technical identifiers
      ?.replace(/\[\[.*?\]\]/g, '')
      ?.replace(/<END_TURN>/g, '')
      // Clean up extra whitespace
      ?.replace(/\n\s*\n/g, '\n')
      ?.replace(/\s+/g, ' ')
      ?.trim() || null;

    // If no suggestions were found, provide defaults based on context
    if (suggestions.length === 0) {
      const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
      if (lastUserMessage.includes('framework')) {
        suggestions = ["Explain Porter's Five Forces", "Compare SWOT and PESTLE", "How to apply MECE?"];
      } else if (lastUserMessage.includes('practice') || lastUserMessage.includes('drill')) {
        suggestions = ["Market Sizing Practice", "Profitability Diagnosis Drill", "Brainstorming Practice"];
      } else if (lastUserMessage.includes('critique') || lastUserMessage.includes('feedback')) {
        suggestions = ["Critique my approach (I'll paste)", "How can I improve clarity?", "Is my structure logical?"];
      } else {
        suggestions = ["Explain a common framework", "Give me a practice question", "How to structure my answer?"];
      }
    }

    // Respond with the complete text response, structured data, and suggestions
    return NextResponse.json({ 
      response: cleanedResponseText, 
      structuredData: structuredData,
      suggestions: suggestions
    });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    if (error instanceof OpenAI.APIError) {
         return NextResponse.json({ error: `OpenAI Error: ${error.message}` }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 