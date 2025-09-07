// lib/case-service.ts
import { createServerClient } from "@/lib/supabase";
import { buildCasePackGeneratorSystem } from "@/prompts/caseGenerator";
import OpenAI from "openai";

export type CaseTypeId =
  | "diagnostic"
  | "profitability"
  | "market-entry"
  | "product"
  | "operations"
  | "sizing";

export interface CreateCaseMeta {
  caseType: CaseTypeId;
  // optional hints from your UI (company, industry, role, etc.)
  company?: string;
  industry?: string;
  role_focus?: string;
  geography?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  time_limit_minutes?: number;
  exhibit_preferences?: string;
  constraints_notes?: string;
}

export const caseService = {
  /** Always create a NEW session + fresh generated pack */
  async createCaseSession(userId: string, meta: CreateCaseMeta) {
    // Add entropy so two calls never look the same even with identical inputs
    const entropy = `${Date.now()}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))}`;

    // Generate case directly instead of calling API route
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    console.log('[CaseService] Environment check:', {
      hasOpenAIKey: !!openaiApiKey,
      keyLength: openaiApiKey?.length || 0,
      keyPrefix: openaiApiKey?.substring(0, 10) || 'none'
    });
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is missing or empty');
    }
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const systemPrompt = buildCasePackGeneratorSystem({
      useCase: `A ${meta.caseType} case study requiring strategic analysis and recommendation`,
      company: meta.company || 'N/A',
      industry: meta.industry || 'Technology',
      roleFocus: meta.role_focus || 'Strategy',
      geography: meta.geography || 'Global',
      difficulty: meta.difficulty || 'intermediate',
      timeLimitMinutes: meta.time_limit_minutes || 30,
      includeSolutionGuide: false,
      exhibitPreferences: meta.exhibit_preferences || 'auto',
      constraintsNotes: meta.constraints_notes || 'Standard business assumptions apply'
    });

    const userPromptString = `Generate a complete case study with these inputs:

- use_case: A ${meta.caseType} case study requiring strategic analysis and recommendation
- company: ${meta.company || 'N/A'}
- industry: ${meta.industry || 'Technology'}
- role_focus: ${meta.role_focus || 'Strategy'}
- geography: ${meta.geography || 'Global'}
- difficulty: ${meta.difficulty || 'intermediate'}
- time_limit_minutes: ${meta.time_limit_minutes || 30}
- include_solution_guide: false
- exhibit_preferences: ${meta.exhibit_preferences || 'auto'}
- constraints_notes: ${meta.constraints_notes || 'Standard business assumptions apply'}
- entropy_seed: ${entropy}

Create a realistic, engaging case study with 2-5 exhibits and all required sections.`;

    console.log('[CaseService] Making OpenAI API call...');
    let completion;
    try {
      completion = await openai.chat.completions.create({
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
      console.log('[CaseService] OpenAI API call successful');
    } catch (openaiError) {
      console.error('[CaseService] OpenAI API call failed:', {
        message: (openaiError as Error).message,
        name: (openaiError as Error).name,
        stack: (openaiError as Error).stack
      });
      throw new Error(`OpenAI API call failed: ${(openaiError as Error).message}`);
    }

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error("OpenAI returned no content");
    }

    // Parse the case response
    const pack = this.parseCaseResponse(responseText);
    const case_title =
      (pack?.caseMeta as any)?.title ??
      `${meta.caseType.replace("-", " ")} case`;

    // Note: This method is now deprecated in favor of the direct API route approach
    // The create-case API route now handles case generation and database insertion directly
    throw new Error('This method is deprecated. Use the /api/create-case endpoint instead.');
  },

  /** Fetch one session by id */
  async getCaseSession(id: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("case_sessions")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  },

  /** Update partial fields on a session */
  async updateCaseSession(
    id: string,
    patch: Partial<{
      duration_minutes: number;
      notes: string;
      completed: boolean;
      performance_rating: string;
      generated_case_data: any;
    }>
  ) {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("case_sessions")
      .update(patch)
      .eq("id", id);

    return { error };
  },

  /** Optional: attach a skill assessment row */
  async addSkillAssessment(payload: {
    user_id: string;
    session_id: string;
    math_score: number;
    structure_score: number;
    creativity_score: number;
  }) {
    const supabase = createServerClient();
    const { error } = await supabase.from("skill_assessment").insert(payload);
    return { error };
  },

  /** Get user statistics */
  async getUserStats(userId: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("case_sessions")
      .select("completed, duration_minutes, performance_rating")
      .eq("user_id", userId);

    if (error) return { data: null, error };

    const stats = {
      completedCases: data.filter(c => c.completed).length,
      totalPracticeHours: data.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / 60,
      skillAccuracy: { math: 0, structure: 0, creativity: 0 } // Placeholder
    };

    return { data: stats, error: null };
  },

  /** Get user's case sessions */
  async getUserCaseSessions(userId: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("case_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    return { data, error };
  },

  /** Parse case response from OpenAI */
  parseCaseResponse(responseText: string) {
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
      background: this.extractSection(responseText, '## Background'),
      objectives: this.extractSection(responseText, '## Objectives'),
      constraints: this.extractSection(responseText, '## Constraints & Assumptions'),
      tasks: this.extractSection(responseText, '## Candidate Tasks'),
      interviewerScript: this.extractSection(responseText, '## Interviewer Script'),
      evaluationRubric: this.extractSection(responseText, '## Evaluation Rubric'),
      deliverables: this.extractSection(responseText, '## Expected Deliverables'),
      notes: this.extractSection(responseText, '## Notes for the Candidate')
    };

    return {
      caseMeta,
      exhibits,
      sections,
      solutionGuide,
      rawResponse: responseText
    };
  },

  /** Extract section from text */
  extractSection(text: string, sectionTitle: string): string {
    const regex = new RegExp(`${sectionTitle}\\s*([\\s\\S]*?)(?=##|\\[\\[|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  },
};