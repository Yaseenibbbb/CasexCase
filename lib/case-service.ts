import { getSupabaseBrowserClient } from "./supabase"
import type { CaseSession, SkillAssessment } from "./database.types"

export const caseService = {
  // Get all case sessions for the current user
  async getUserCaseSessions() {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("case_sessions").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching case sessions:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Get a specific case session
  async getCaseSession(sessionId: string) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("case_sessions")
      .select(`
        *,
        skill_assessment(*)
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
