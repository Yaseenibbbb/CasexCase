"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Bell,
  Mic,
  Calendar,
  Download,
  Flame,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  Landmark,
  BarChart3,
  Clock,
  Users,
  MessageSquare,
  Filter,
  List,
  GraduationCap,
  Activity,
  Target,
  Play,
  Plus,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CASE_TYPES, RECENT_CASES, CATEGORIZED_BEHAVIORAL_QUESTIONS, BehavioralQuestionCategory, BehavioralQuestion, TIME_PER_CASE } from "@/lib/data"
import { useAuth } from "@/context/auth-context"
import { caseService } from "@/lib/case-service"
import Link from "next/link"
import { CustomPrepForm } from "@/components/CustomPrepForm"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

// Helper for level colors (adjust names if Tailwind config uses different ones)
const levelColor: Record<'Beginner' | 'Intermediate' | 'Advanced', string> = {
  Beginner:     'accentGreen', // Assuming accentGreen is defined in Tailwind
  Intermediate: 'accentAmber', // Assuming accentAmber is defined in Tailwind
  Advanced:     'brand',       // Assuming brand is defined in Tailwind
}

export default function DashboardPage() {
  // Log when the component starts rendering
  console.log("[DashboardPage] Component rendering START");

  const router = useRouter()
  const { user, profile, signOut, isLoading } = useAuth()
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [filters, setFilters] = useState<string[]>([])
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const [pausedCase, setPausedCase] = useState<string | null>(null)
  const [micStatus, setMicStatus] = useState<"granted" | "denied" | "prompt">("prompt")
  const [searchQuery, setSearchQuery] = useState("")
  const [userStats, setUserStats] = useState({
    completedCases: 0,
    totalPracticeHours: 0,
    skillAccuracy: {
      math: 0,
      structure: 0,
      creativity: 0,
    },
  })
  const [recentCases, setRecentCases] = useState<any[]>([])
  const [isStartingInterview, setIsStartingInterview] = useState(false);

  // Fetch user data
  useEffect(() => {
    console.log(`[DashboardPage] fetchUserData effect triggered. isLoading: ${isLoading}, user exists: ${!!user}`);
    // Only run fetchUserData if auth is no longer loading AND user is present
    if (!isLoading && user) {
      const fetchUserData = async () => {
        console.log("[DashboardPage] Auth loaded and user found. Fetching user data...");
        // Keep setIsLoading(true) for the data fetching itself?
        // No, use a separate loading state for dashboard data if needed.
        // setIsLoading(true); // Avoid reusing the auth loading state
        try {
          // Fetch user stats
          const { data: stats } = await caseService.getUserStats(user.id)
          if (stats) {
            setUserStats(stats)
          }

          // Fetch recent case sessions
          const { data: cases } = await caseService.getUserCaseSessions(user.id) // Pass user ID
          if (cases) {
            setRecentCases(cases)

            // Check for paused cases
            const pausedCase = cases.find((c) => !c.completed)
            if (pausedCase) {
              setPausedCase(pausedCase.case_type)
              setShowResumeBanner(true)
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Handle data fetch error (e.g., show toast)
        } finally {
          // setIsLoading(false); // Only if using a separate loading state
          console.log("[DashboardPage] fetchUserData finished.");
        }
      }

      fetchUserData()
    } else if (!isLoading && !user) {
        console.log("[DashboardPage] Auth loaded but no user found.");
        // Handle case where user is definitely logged out (clear stats, etc.)
        setUserStats({ completedCases: 0, totalPracticeHours: 0, skillAccuracy: { math: 0, structure: 0, creativity: 0 } });
        setRecentCases([]);
        setPausedCase(null);
        setShowResumeBanner(false);
    } else {
        console.log("[DashboardPage] Waiting for auth state (isLoading is true).");
    }
  // Depend on both isLoading and user
  }, [user, isLoading]);

  // Simulate a paused case on load if none found in database
  useEffect(() => {
    if (recentCases.length === 0 && !isLoading) {
      const timer = setTimeout(() => {
        setPausedCase("market-entry")
        setShowResumeBanner(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [recentCases, isLoading])

  const handleSelectCase = (type: string) => {
    setSelectedCase(type)
  }

  const handleStartInterview = async () => {
    console.log("[handleStartInterview] Function called.");
    if (isStartingInterview) {
      console.log("[handleStartInterview] Already starting, exiting.");
      return;
    }
    setIsStartingInterview(true);
    console.log(`[handleStartInterview] selectedCase: ${selectedCase}, user exists: ${!!user}`);
    
    if (!selectedCase || !user) {
      console.log("[handleStartInterview] Exiting: selectedCase or user is missing.");
      toast({ title: "Selection Error", description: "Please select a case type first.", variant: "default" });
      setIsStartingInterview(false);
      return;
    }

    const caseType = CASE_TYPES.find((c) => c.id === selectedCase);
    console.log(`[handleStartInterview] Found caseType: ${caseType?.title}`);
    if (!caseType) {
        console.log("[handleStartInterview] Exiting: caseType data not found.");
        toast({ title: "Data Error", description: "Could not find details for the selected case type.", variant: "destructive" });
        setIsStartingInterview(false);
        return;
    }

    try {
      console.log("[handleStartInterview] Calling caseService.createCaseSession...");
      const { data, error: createError } = await caseService.createCaseSession({
        user_id: user.id,
        case_type: selectedCase,
        case_title: caseType.title, 
        duration_minutes: 0,
        completed: false,
        notes: null,
        performance_rating: null
      });

      // --- Refined Response Handling --- 
      console.log("[handleStartInterview] createCaseSession RAW response - data:", data, "error:", createError);

      if (createError) {
          console.error("[handleStartInterview] Error returned from createCaseSession:", createError);
          toast({ title: "Error Starting Session", description: createError.message || "Could not create the interview session.", variant: "destructive" });
          setIsStartingInterview(false);
          return; 
      }
      
      // Explicitly check if data is null/undefined even without an error
      if (!data) {
          console.error("[handleStartInterview] createCaseSession returned successfully BUT data is nullish. Check RLS policies or function return logic.", "Returned data:", data, "Returned error:", createError);
          toast({ title: "Error Starting Session", description: "Failed to retrieve session details after creation. Please try again.", variant: "destructive" });
          setIsStartingInterview(false);
          return;
      }

      // Extract Session ID (handles single object from .single()) 
      let sessionId: string | null = null;
      // Check if data is an object and has an id property
      if (data && typeof data === 'object' && 'id' in data && data.id) {
        sessionId = data.id;
        console.log("[handleStartInterview] Session ID found in single object response:", sessionId);

        // ---> NEW STEP: Generate Case Details BEFORE navigating <--- 
        console.log(`[handleStartInterview] Attempting to generate case details for session: ${sessionId}, type: ${selectedCase}`);
        try {
          // Log the request being sent
          console.log("[handleStartInterview] Sending generation request with payload:", 
            JSON.stringify({ sessionId, caseType: selectedCase })
          );

          const generateResponse = await fetch('/api/generate-case-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sessionId, caseType: selectedCase }),
          });

          // Enhanced error logging
          console.log(`[handleStartInterview] Generation API response status: ${generateResponse.status}`);
          
          // Check if response is OK
          if (!generateResponse.ok) {
            // Get a more detailed error response
            let errorBody = "Unknown error"; 
            let errorJson = null;
            
            try {
              // Try reading response body as JSON
              errorJson = await generateResponse.json();
              console.error("[handleStartInterview] Error response JSON:", errorJson);
              errorBody = errorJson?.error || JSON.stringify(errorJson);
            } catch (e) {
              // If reading JSON failed, try text
              console.error("[handleStartInterview] Failed to parse error as JSON:", e);
              try {
                errorBody = await generateResponse.text();
                console.error("[handleStartInterview] Error response Text:", errorBody);
              } catch (textError) {
                errorBody = `HTTP status ${generateResponse.status}`;
                console.error("[handleStartInterview] Failed to read error response:", textError);
              }
            }
            
            console.error(`[handleStartInterview] Failed to generate case details - Status: ${generateResponse.status}, Body: ${errorBody}`);
            
            // Show a more specific error
            let userErrorMessage = "Failed to generate case details.";
            if (errorBody.includes("extract generation directives")) {
              userErrorMessage = "Failed to prepare case details: Missing case template directives.";
            } else if (errorBody.includes("missing required keys") || errorBody.includes("invalid structure")) {
              userErrorMessage = "Failed to prepare case: Invalid response from case generation service.";
            }
            
            toast({ 
              title: "Error Preparing Case", 
              description: userErrorMessage,
              variant: "destructive" 
            });
            setIsStartingInterview(false);
            return;
          }

          // Now parse the successful response
          let generateResult;
          try {
            generateResult = await generateResponse.json();
            console.log("[handleStartInterview] Generation result:", generateResult);
          } catch (parseError) {
            console.error("[handleStartInterview] Failed to parse successful response:", parseError);
            toast({ 
              title: "Error Preparing Case", 
              description: "Received an invalid response from the case generation service.",
              variant: "destructive" 
            });
            setIsStartingInterview(false);
            return;
          }

          if (!generateResult.success) {
            console.error("[handleStartInterview] Case detail generation API returned success:false:", generateResult.error);
            toast({ 
              title: "Case Generation Failed", 
              description: generateResult.error || "Failed to generate case details. Please try again.",
              variant: "destructive" 
            });
            setIsStartingInterview(false);
            return;
          }
          
          console.log("[handleStartInterview] Case details generated successfully.");
          
          // Proceed to navigation ONLY AFTER generation succeeds
          console.log(`[handleStartInterview] Navigating to /interview/${sessionId}`);
          router.push(`/interview/${sessionId}`);

        } catch (generationError) {
          console.error("[handleStartInterview] CATCH block: Error during case detail generation:", generationError);
          toast({ 
            title: "Error Preparing Session", 
            description: generationError instanceof Error ? generationError.message : "Could not generate case details for the interview.", 
            variant: "destructive" 
          });
          setIsStartingInterview(false);
        }
        // --- END NEW STEP ---

      } else {
         // This case should ideally not happen with .single(), but log if it does
         console.warn("[handleStartInterview] Data received but session ID could not be extracted. Response format might be unexpected.", data);
      }

    } catch (error) {
      console.error("[handleStartInterview] CATCH block: Error during interview start process:", error);
      toast({ title: "Error Starting Session", description: "An unexpected error occurred while starting the interview.", variant: "destructive" });
      setIsStartingInterview(false);
    } finally {
        setIsStartingInterview(false);
    }
  };

  const toggleFilter = (filter: string) => {
    if (filters.includes(filter)) {
      setFilters(filters.filter((f) => f !== filter))
    } else {
      setFilters([...filters, filter])
    }
  }

  const resumePausedCase = () => {
    if (pausedCase) {
      setSelectedCase(pausedCase)
      setShowResumeBanner(false)
    }
  }

  const dismissResumeBanner = () => {
    setShowResumeBanner(false)
  }

  const filteredCases = CASE_TYPES.filter(
    (caseType) => filters.length === 0 || filters.includes(caseType.difficulty),
  ).filter(
    (caseType) =>
      searchQuery === "" ||
      caseType.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseType.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Simulate requesting microphone permission
  const requestMicPermission = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setMicStatus("granted"))
      .catch(() => setMicStatus("denied"))
  }

  // Calculate weekly goal progress
  const weeklyGoalPercentage = profile?.weekly_goal_hours
    ? Math.min(100, Math.round((userStats.totalPracticeHours / profile.weekly_goal_hours) * 100))
    : 0

  // Weekly cases data for sparkline
  const weeklyData =
    recentCases.length > 0
      ? [0, 0, 0, 0, 0, 0, 0].map((_, i) => {
          const daysAgo = 6 - i
          const date = new Date()
          date.setDate(date.getDate() - daysAgo)
          date.setHours(0, 0, 0, 0)

          return recentCases.filter((c) => {
            const caseDate = new Date(c.created_at)
            caseDate.setHours(0, 0, 0, 0)
            return caseDate.getTime() === date.getTime()
          }).length
        })
      : [2, 3, 1, 4, 2, 0, 0] // Fallback data

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#121420] transition-colors duration-300 overflow-x-hidden p-6 md:p-8 main-content">
      {/* Resume Banner */}
      <AnimatePresence>
        {showResumeBanner && pausedCase && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative rounded-xl bg-[#f4f1ff] dark:bg-[#262550]/30 
                       border border-[#e5deff] dark:border-[#35317e]/30 px-5 py-4 mb-8 flex flex-col sm:flex-row gap-4 sm:items-center"
          >
            {/* Banner Text */}
            <div>
              <p className="text-sm font-medium purple-text">
                Continue where you left off
              </p>
              <h4 className="font-semibold mt-1">
                {CASE_TYPES.find((c) => c.id === pausedCase)?.title} 
                <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">(3 mins)</span>
              </h4>
            </div>

            {/* Resume Button */}
            <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
                <Button
                    size="sm"
                    onClick={resumePausedCase}
                    className="bg-[#7857f7] hover:bg-[#6344e5] text-white
                              transition-all duration-200 flex items-center gap-1.5 rounded-full px-5"
                >
                   <Play size={14} /> Resume
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissResumeBanner}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white
                            hover:bg-gray-100 dark:hover:bg-gray-800
                            rounded-full h-8 w-8 transition-all"
                >
                  <X size={16} />
                </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Message */}
      <div className="text-left mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}</h1>
        <p className="mt-1">Continue your case interview preparation journey</p>
      </div>

      {/* Performance Analytics */}
      <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen} className="mb-8">
        <Card className="overflow-hidden bg-white dark:bg-[#1e1d2d] border border-gray-200 dark:border-gray-800 rounded-xl">
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer py-4 px-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="purple-text" size={20} />
                <CardTitle className="text-lg font-semibold">Performance Analytics</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400">
                {analyticsOpen ? "Hide" : "Show"} Analytics
                {analyticsOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
              </Button>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-6 grid gap-6 sm:grid-cols-3">
              <Card className="bg-white dark:bg-[#262550] border border-gray-100 dark:border-gray-800 rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Cases Completed</CardTitle>
                  <Users className="purple-text" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.completedCases}</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-[#262550] border border-gray-100 dark:border-gray-800 rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Practice Hours</CardTitle>
                  <Clock className="purple-text" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalPracticeHours.toFixed(1)}</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-[#262550] border border-gray-100 dark:border-gray-800 rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Weekly Goal</CardTitle>
                  <Target className="purple-text" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {weeklyGoalPercentage}%
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Practice Cases Tabs */}
      <Tabs defaultValue="practice" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 gap-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl">
          <TabsTrigger value="practice" className="data-[state=active]:bg-white data-[state=active]:text-[#121420] dark:data-[state=active]:bg-[#262550] dark:data-[state=active]:text-white rounded-lg py-2">Practice Cases</TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-white data-[state=active]:text-[#121420] dark:data-[state=active]:bg-[#262550] dark:data-[state=active]:text-white rounded-lg py-2">Recent Sessions</TabsTrigger>
          <TabsTrigger value="recommended" className="data-[state=active]:bg-white data-[state=active]:text-[#121420] dark:data-[state=active]:bg-[#262550] dark:data-[state=active]:text-white rounded-lg py-2">Recommended</TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white data-[state=active]:text-[#121420] dark:data-[state=active]:bg-[#262550] dark:data-[state=active]:text-white rounded-lg py-2">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="practice">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl font-semibold text-[#121420] dark:text-white">Practice Cases</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={filters.length === 0 ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters([])}
                className={`text-xs rounded-full px-4 ${filters.length === 0 ? 'bg-[#7857f7] hover:bg-[#6344e5] text-white' : ''}`}
              >
                All
              </Button>
              <Button
                variant={filters.includes("Beginner") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter("Beginner")}
                className={`text-xs rounded-full px-4 ${filters.includes("Beginner") ? 'bg-[#7857f7] hover:bg-[#6344e5] text-white' : ''}`}
              >
                Beginner
              </Button>
              <Button
                variant={filters.includes("Intermediate") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter("Intermediate")}
                className={`text-xs rounded-full px-4 ${filters.includes("Intermediate") ? 'bg-[#7857f7] hover:bg-[#6344e5] text-white' : ''}`}
              >
                Intermediate
              </Button>
              <Button
                variant={filters.includes("Advanced") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter("Advanced")}
                className={`text-xs rounded-full px-4 ${filters.includes("Advanced") ? 'bg-[#7857f7] hover:bg-[#6344e5] text-white' : ''}`}
              >
                Advanced
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map((caseType) => (
              <div
                key={caseType.id}
                onClick={() => handleSelectCase(caseType.id)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border transition-all duration-200",
                  "bg-white dark:bg-[#1e1d2d] border-gray-200 dark:border-gray-800",
                  "hover:border-[#7857f7] dark:hover:border-[#7857f7] hover:shadow-md",
                  selectedCase === caseType.id && "ring-2 ring-[#7857f7] border-transparent"
                )}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 grid place-items-center rounded-lg bg-[#7857f7]/10 text-[#7857f7] flex-shrink-0">
                      <caseType.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#121420] dark:text-white">{caseType.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{caseType.description}</p>
                      <div className="flex items-center gap-3 text-xs mt-3">
                        <span className={`rounded-full px-2 py-0.5 font-medium 
                          ${caseType.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-400' : 
                            caseType.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-400' : 
                            'bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-400'}`}>
                          {caseType.difficulty}
                        </span>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" /> {caseType.duration} min
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-0 right-0 m-3">
                  <span className={`text-xs font-medium ${
                    caseType.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-400' : 
                    caseType.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-400' : 
                    'bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-400'
                  } px-2 py-0.5 rounded-full`}>
                    {caseType.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedCase && (
            <div className="mt-6 text-center">
              <Button 
                size="lg" 
                onClick={handleStartInterview} 
                disabled={isLoading || !selectedCase || isStartingInterview} 
                className="bg-[#7857f7] hover:bg-[#6344e5] text-white rounded-full px-8 py-2
                          transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStartingInterview ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Start Practice</>
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>Your recent practice sessions will appear here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="recommended">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>Personalized case recommendations coming soon</p>
          </div>
        </TabsContent>
        
        <TabsContent value="leaderboard">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>Leaderboard data coming soon</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Prep Card */}
      <Card className="mt-8 bg-[#f4f1ff] dark:bg-[#262550]/30 border-[#e5deff] dark:border-[#35317e]/30 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#121420] dark:text-white">Custom Prep</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Want to practice a specific scenario? Create a custom case prep session.</p>
        </div>
        <Link href="/custom-prep">
          <Button 
            className="bg-[#7857f7] hover:bg-[#6344e5] text-white rounded-full px-5
                      transition-all duration-200 flex items-center gap-1.5 w-full sm:w-auto"
          >
            <Plus size={16} /> Start Custom Prep
          </Button>
        </Link>
      </Card>

      {/* Behavioral & FIT Questions */}
      <Card className="relative overflow-hidden mt-8 bg-white dark:bg-[#1e1d2d] border border-gray-200 dark:border-gray-800 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#121420] dark:text-white">Behavioral & FIT Questions</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Prepare for common behavioral interview questions.</CardDescription>
        </CardHeader>
        
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-none opacity-40">
          {Object.values(CATEGORIZED_BEHAVIORAL_QUESTIONS).map((category: BehavioralQuestionCategory) => {
            const IconComponent = category.icon; 
            return (
              <div key={category.slug} className="cursor-not-allowed">
                <Card className="h-full transition-all duration-300 rounded-lg 
                        bg-white dark:bg-[#262550]/30 
                        border border-gray-200 dark:border-gray-700/30">
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                    <div className="p-2 rounded-lg bg-[#7857f7]/10 text-[#7857f7]">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-medium text-[#121420] dark:text-white">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.questions.length} question{category.questions.length !== 1 ? 's' : ''} in this category.
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </CardContent>
        
        {/* Add the Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-[#1e1d2d]/60 backdrop-blur-sm rounded-xl">
          <span className="bg-[#7857f7] px-4 py-2 rounded-md text-white font-semibold shadow-md">
            Coming Soon
          </span>
        </div>
      </Card>
    </div>
  )
}
