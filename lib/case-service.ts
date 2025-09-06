import { getSupabaseBrowserClient } from "./supabase"
import type { CaseSession, SkillAssessment } from "./database.types"

export const caseService = {
  // Get all case sessions for the current user
  async getUserCaseSessions(userId: string) {
    // Check if demo mode
    const isDemo = sessionStorage.getItem('demoMode') === 'true';
    if (isDemo) {
      const mockSessions = [
        {
          id: 'demo-session-1',
          user_id: userId,
          case_type: 'go-no-go',
          case_title: 'Go/No-Go Case',
          duration_minutes: 25,
          completed: true,
          performance_rating: 'Good',
          notes: 'Structured approach, good analysis',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      return { data: mockSessions, error: null };
    }

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("case_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching case sessions:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Get a specific case session
  async getCaseSession(sessionId: string) {
    // Check if demo mode
    const isDemo = sessionStorage.getItem('demoMode') === 'true';
    if (isDemo && sessionId.startsWith('demo-session-')) {
      // Return mock session for demo mode
      const mockSession = {
        id: sessionId,
        user_id: 'demo-user',
        case_type: 'diagnostic',
        case_title: 'Diagnostic Case',
        duration_minutes: 0,
        completed: false,
        performance_rating: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        generated_case_data: {
          caseMeta: {
            title: "Diagnostic Case Study",
            industry: "Technology",
            company: "TechFlow Solutions",
            geography: "Global",
            difficulty: "intermediate",
            time_limit: 30,
            role_focus: "Strategy"
          },
          exhibits: [
            {
              id: "E1",
              type: "table",
              title: "Market Overview",
              content: "| Metric | Value |\n|--------|-------|\n| Market Size | $2.5B |\n| Growth Rate | 15% |\n| Competition | High |"
            }
          ],
          sections: {
            background: "TechFlow Solutions is a mid-size technology consulting firm considering expansion into healthcare tech consulting.",
            objectives: "- Evaluate market opportunity\n- Assess competitive landscape\n- Recommend go/no-go decision",
            tasks: "Analyze the healthcare tech consulting market and provide a recommendation on whether to enter this market.",
            interviewerScript: "**Opening Prompt:** Please restate the objective and outline your approach to evaluating this market entry opportunity."
          }
        }
      };
      return { data: mockSession, error: null };
    }

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("case_sessions")
      .select(`
        *,
        skill_assessment(*),
        generated_case_data 
      `)
      .eq("id", sessionId)
      .single()

    if (error) {
      console.error("Error fetching case session:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Create a new case session
  async createCaseSession(caseSession: Omit<CaseSession, "id" | "created_at" | "updated_at">) {
    console.log("[caseService] createCaseSession called with:", caseSession);
    
    // Check if demo mode
    const isDemo = sessionStorage.getItem('demoMode') === 'true';
    if (isDemo) {
      // Create demo session and generate case using the new API
      const demoSessionId = `demo-session-${Date.now()}`;
      const demoSession = {
        id: demoSessionId,
        ...caseSession,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Call the case generation API to get a real generated case
      try {
        const generateResponse = await fetch('/api/generate-case-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sessionId: demoSessionId, 
            caseType: caseSession.case_type,
            useCase: `A ${caseSession.case_type} case study requiring strategic analysis and recommendation`,
            company: 'N/A',
            industry: 'Technology',
            roleFocus: 'Strategy',
            geography: 'Global',
            difficulty: 'intermediate',
            timeLimitMinutes: 30,
            includeSolutionGuide: false,
            exhibitPreferences: 'auto',
            constraintsNotes: 'Standard business assumptions apply'
          }),
        });

        if (generateResponse.ok) {
          const generateData = await generateResponse.json();
          demoSession.generated_case_data = generateData.data;
          console.log("[caseService] Demo mode - generated real case:", generateData.data);
        } else {
          console.error("[caseService] Demo mode - case generation failed, using fallback");
          // Use fallback mock data if generation fails
          demoSession.generated_case_data = {
            caseMeta: {
              title: `${caseSession.case_type} Case Study`,
              industry: "Technology",
              company: "TechFlow Solutions",
              geography: "Global",
              difficulty: "intermediate",
              time_limit: 30,
              role_focus: "Strategy"
            },
            sections: {
              background: "TechFlow Solutions is a mid-size technology consulting firm considering expansion into healthcare tech consulting.",
              objectives: "Your main goals here are to evaluate the market opportunity, assess the competitive landscape, and recommend whether to proceed with the market entry.",
              tasks: "So your job is to analyze the healthcare tech consulting market and provide a recommendation on whether to enter this market.",
              interviewerScript: "Please restate the objective and outline your approach to evaluating this market entry opportunity."
            }
          };
          console.log("[caseService] Demo mode - using fallback mock data");
        }
      } catch (error) {
        console.error("[caseService] Demo mode - case generation failed:", error);
        // Use fallback mock data
        demoSession.generated_case_data = {
          caseMeta: {
            title: `${caseSession.case_type} Case Study`,
            industry: "Technology",
            company: "TechFlow Solutions",
            geography: "Global",
            difficulty: "intermediate",
            time_limit: 30,
            role_focus: "Strategy"
          },
          sections: {
            background: "TechFlow Solutions is a mid-size technology consulting firm considering expansion into healthcare tech consulting.",
            objectives: "- Evaluate market opportunity\n- Assess competitive landscape\n- Recommend go/no-go decision",
            tasks: "Analyze the healthcare tech consulting market and provide a recommendation on whether to enter this market.",
            interviewerScript: "**Opening Prompt:** Please restate the objective and outline your approach to evaluating this market entry opportunity."
          }
        };
      }

      console.log("[caseService] Demo mode - returning session with generated case:", demoSession);
      return { data: demoSession, error: null };
    }

    const supabase = getSupabaseBrowserClient();
    try {
      // Restore .select().single() to get the created row ID
      const { data, error } = await supabase.from("case_sessions").insert(caseSession).select().single();
      console.log("[caseService] Insert & Select result - data:", data, "error:", error); // Log result

    if (error) {
        console.error("[caseService] Error during insert/select case session:", error);
        return { data: null, error };
    }

      console.log("[caseService] Insert & Select successful.");
      return { data, error: null }; // Return the selected data (including ID)

    } catch (catchError) {
       console.error("[caseService] CATCH block: Error during createCaseSession process:", catchError);
       return { data: null, error: catchError instanceof Error ? catchError : new Error(String(catchError)) }; 
    } 
  },

  // Update a case session
  async updateCaseSession(sessionId: string, updates: Partial<CaseSession>) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("case_sessions").update(updates).eq("id", sessionId).select().single()

    if (error) {
      console.error("Error updating case session:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Add skill assessment to a case session
  async addSkillAssessment(assessment: Omit<SkillAssessment, "id" | "created_at">) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("skill_assessment").insert(assessment).select().single()

    if (error) {
      console.error("Error adding skill assessment:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Get user stats
  async getUserStats(userId: string) {
    // Check if demo mode
    const isDemo = sessionStorage.getItem('demoMode') === 'true';
    if (isDemo) {
      const mockStats = {
        completedCases: 3,
        totalPracticeHours: 4.5,
        skillAccuracy: { math: 85, structure: 78, creativity: 92 }
      };
      return { data: mockStats, error: null };
    }

    const supabase = getSupabaseBrowserClient()

    // Get total completed cases
    const { data: completedCases, error: completedError } = await supabase
      .from("case_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("completed", true)

    // Get total practice time
    const { data: practiceTime, error: timeError } = await supabase
      .from("case_sessions")
      .select("duration_minutes")
      .eq("user_id", userId)

    // Get average skill scores
    const { data: skillScores, error: skillError } = await supabase
      .from("skill_assessment")
      .select("math_score, structure_score, creativity_score")
      .eq("user_id", userId)

    if (completedError || timeError || skillError) {
      console.error("Error fetching user stats")
      return { data: null, error: completedError || timeError || skillError }
    }

    // Calculate average scores
    const mathScores = skillScores?.filter((s) => s.math_score !== null).map((s) => s.math_score as number) || []
    const structureScores =
      skillScores?.filter((s) => s.structure_score !== null).map((s) => s.structure_score as number) || []
    const creativityScores =
      skillScores?.filter((s) => s.creativity_score !== null).map((s) => s.creativity_score as number) || []

    const avgMath = mathScores.length ? mathScores.reduce((a, b) => a + b, 0) / mathScores.length : 0
    const avgStructure = structureScores.length
      ? structureScores.reduce((a, b) => a + b, 0) / structureScores.length
      : 0
    const avgCreativity = creativityScores.length
      ? creativityScores.reduce((a, b) => a + b, 0) / creativityScores.length
      : 0

    const totalTime = practiceTime?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0

    return {
      data: {
        completedCases: completedCases?.length || 0,
        totalPracticeHours: Math.round((totalTime / 60) * 10) / 10, // Convert to hours with 1 decimal
        skillAccuracy: {
          math: Math.round(avgMath),
          structure: Math.round(avgStructure),
          creativity: Math.round(avgCreativity),
        },
      },
      error: null,
    }
  },
}
