export const buildLiveInterviewerSystem = (meta: {
  title?: string; industry?: string; company?: string; geography?: string;
}) => `
SYSTEM — CaseByCase • Live Interviewer Mode

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
- End every message with the token: <END_TURN>
- Never answer your own question. React only to the candidate's last message
- Reveal at most one exhibit when needed or requested

CASE CONTEXT:
Industry: ${meta.industry ?? "business"}
Company Type: ${meta.company ?? "a client company"}
Geography: ${meta.geography ?? "various markets"}

BUTTON/STATE HOOKS:
- CLARIFY → ask one clarifying question. <END_TURN>
- CALCULATOR → give exact numbers/formula needed (1–2 sentences). <END_TURN>
- EXHIBITS.SHOW(id?) → emit exactly one exhibit with the app's delimiters, then one pointed question. <END_TURN>
- PAUSE/RESUME → acknowledge and continue with one question. <END_TURN>
- WRAP_UP → ask for final rec + 2 risks + next steps. <END_TURN>
- END → thank and stop. <END_TURN>

EXHIBIT FORMAT (exact):
[[EXHIBIT:TABLE|id=E#|title="..."]]...[[/EXHIBIT]]
[[EXHIBIT:CHART|id=E#|title="..."|type=line|xKey="..."]]{...}[[/EXHIBIT]]
[[EXHIBIT:CHART|id=E#|title="..."|type=bar|xKey="..."]]{...}[[/EXHIBIT]]
[[EXHIBIT:CHART|id=E#|title="..."|type=pie|nameKey="..."|valueKey="..."]]{...}[[/EXHIBIT]]
[[EXHIBIT:IMAGE|id=E#|title="..."|url="https://..."]][[/EXHIBIT]]

FIRST MESSAGE TEMPLATE:
"Hello! Great to meet you today. I'd like you to help our client, ${meta.company || getRealisticCompanyName(meta.industry)}, ${getIndustryDescription(meta.industry)}. ${getCaseSituation(meta.industry)} What are your initial thoughts on how to approach this challenge?" <END_TURN>
`.trim();

// Helper functions for natural case introductions
function getRealisticCompanyName(industry?: string): string {
  const companies = {
    'healthcare': 'MediCare Partners',
    'technology': 'TechVenture Inc.',
    'finance': 'Global Finance Corp',
    'retail': 'RetailMax Solutions',
    'manufacturing': 'Industrial Dynamics',
    'energy': 'Energy Solutions Group',
    'consulting': 'Strategic Partners LLC',
    'default': 'Business Solutions Inc.'
  };
  return companies[industry?.toLowerCase() as keyof typeof companies] || companies.default;
}

function getIndustryDescription(industry?: string): string {
  const descriptions = {
    'healthcare': 'a major healthcare organization',
    'technology': 'a growing technology company',
    'finance': 'a financial services firm',
    'retail': 'a retail chain',
    'manufacturing': 'a manufacturing company',
    'energy': 'an energy company',
    'consulting': 'a consulting firm',
    'default': 'a client company'
  };
  return descriptions[industry?.toLowerCase() as keyof typeof descriptions] || descriptions.default;
}

function getCaseSituation(industry?: string): string {
  const situations = {
    'healthcare': 'They\'re facing significant financial challenges and need strategic recommendations to improve their operations.',
    'technology': 'They\'re considering a major strategic decision and need help evaluating their options.',
    'finance': 'They\'re dealing with market challenges and need to reassess their strategy.',
    'retail': 'They\'re experiencing competitive pressures and need to find new growth opportunities.',
    'manufacturing': 'They\'re facing operational challenges and need to optimize their processes.',
    'energy': 'They\'re dealing with market changes and need strategic guidance.',
    'consulting': 'They\'re facing business challenges and need strategic recommendations.',
    'default': 'They\'re facing some strategic challenges and need your help analyzing the situation.'
  };
  return situations[industry?.toLowerCase() as keyof typeof situations] || situations.default;
}
