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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProgressDonut } from "@/components/progress-donut"
import { Sparkline } from "@/components/sparkline"
import { HeatMap } from "@/components/heat-map"
import { Histogram } from "@/components/histogram"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CASE_TYPES, RECENT_CASES, CATEGORIZED_BEHAVIORAL_QUESTIONS, BehavioralQuestionCategory, BehavioralQuestion, TIME_PER_CASE } from "@/lib/data"
import { useAuth } from "@/context/auth-context"
import { caseService } from "@/lib/case-service"
import { slugify } from "@/lib/utils"
import Link from "next/link"

export default function DashboardPage() {
  // Log when the component starts rendering
  console.log("[DashboardPage] Component rendering START");

  const router = useRouter()
  const { user, profile, signOut } = useAuth()
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
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setIsLoading(true)
        try {
          // Fetch user stats
          const { data: stats } = await caseService.getUserStats(user.id)
          if (stats) {
            setUserStats(stats)
          }

          // Fetch recent case sessions
          const { data: cases } = await caseService.getUserCaseSessions()
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
          console.error("Error fetching user data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchUserData()
  }, [user])

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
    console.log("[handleStartInterview] Function called."); // Log start
    console.log(`[handleStartInterview] selectedCase: ${selectedCase}, user exists: ${!!user}`);
    
    if (!selectedCase || !user) {
      console.log("[handleStartInterview] Exiting: selectedCase or user is missing.");
      return;
    }

    // Find the selected case type
    const caseType = CASE_TYPES.find((c) => c.id === selectedCase);
    console.log(`[handleStartInterview] Found caseType: ${caseType?.title}`);
    if (!caseType) {
        console.log("[handleStartInterview] Exiting: caseType not found in CASE_TYPES.");
        return;
    }

    // Create a new case session
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

      if (createError) {
          console.error("[handleStartInterview] Error from createCaseSession:", createError);
          return; // Stop execution if session creation fails
      }

      console.log("[handleStartInterview] createCaseSession response data:", data);
      if (data && data.id) {
        console.log(`[handleStartInterview] Session created (ID: ${data.id}). Navigating to /interview/${data.id}`);
        router.push(`/interview/${data.id}`);
      } else {
        console.error("[handleStartInterview] Error starting interview: Session ID not returned from service.");
      }
    } catch (error) {
      console.error("[handleStartInterview] CATCH block: Error during interview start process:", error);
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
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-10 transition-colors duration-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-md">
              <span className="font-bold">CB</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-white text-lg">CaseByCase</span>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search cases or topics..."
                className="pl-10 bg-slate-100/80 dark:bg-slate-800/50 border-0 focus-visible:ring-purple-500 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
              <span className="text-amber-500 mr-1.5">
                <Flame size={18} />
              </span>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {profile?.streak_count || 0}
              </span>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400 relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="relative group">
              <Avatar className="h-9 w-9 cursor-pointer border-2 border-purple-100 dark:border-purple-900/50">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg?height=36&width=36"} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                  {profile?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") ||
                    user?.email?.substring(0, 2).toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg py-1 border border-slate-200 dark:border-slate-800 hidden group-hover:block">
                <div className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  {profile?.full_name || user?.email}
                </div>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => signOut()}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Resume Banner */}
        <AnimatePresence>
          {showResumeBanner && (
            <motion.div
              className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-full mr-4 shadow-inner">
                  <Landmark className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-white">Pick up where you left off</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Market Entry Strategy (15 minutes in)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 dark:bg-slate-800/80 rounded-lg shadow-sm"
                  onClick={resumePausedCase}
                >
                  Resume
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-lg"
                  onClick={dismissResumeBanner}
                >
                  <X size={16} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Section - Consistent margin */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Continue your case interview preparation</p>
        </motion.div>

        {/* Analytics Section - Consistent margin */}
        <Collapsible
          open={analyticsOpen}
          onOpenChange={setAnalyticsOpen}
          className="mb-8 bg-slate-100/80 dark:bg-slate-800/30 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-500" />
              Performance Analytics
            </h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-lg hover:bg-white/80 dark:hover:bg-slate-800/80">
                {analyticsOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                {analyticsOpen ? "Hide" : "Show"} Analytics
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-5">
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-purple-500" />
                Time per Case (minutes)
              </h4>
              <Histogram data={TIME_PER_CASE} height={180} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* --- Temporarily Comment Out AI Assistant Card --- */}
        {/*
        <motion.div
          className="mb-8 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl p-5 border border-blue-100/80 dark:border-indigo-900/50 shadow-sm flex items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
            <Avatar className="h-11 w-11 border-2 border-white dark:border-slate-800 shadow-md flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-lg">
                    AI
                </AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-0.5">
                   AI Case Coach
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Practice interviews, get feedback, and improve your approach.
                </p>
            </div>
            <Link href="/chat" passHref>
                 <Button
                    variant="outline"
                    className="bg-white/90 hover:bg-slate-50 border-slate-200 dark:bg-slate-800/90 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700 rounded-lg shadow-sm ml-auto flex-shrink-0"
                >
                    <MessageSquare size={16} className="mr-2 text-blue-500" />
                    Chat Now
                </Button>
            </Link>
        </motion.div>
        */}
         {/* --- End Comment Out AI Assistant Card --- */}

        {/* Main Content Tabs - Consistent margin */}
        <Tabs defaultValue="practice" className="mb-8">
          <TabsList className="mb-6 bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-xl">
            <TabsTrigger
              value="practice"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900/90 rounded-lg data-[state=active]:shadow-sm"
            >
              Practice Cases
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900/90 rounded-lg data-[state=active]:shadow-sm"
            >
              Recent Sessions
            </TabsTrigger>
            <TabsTrigger
              value="recommended"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900/90 rounded-lg data-[state=active]:shadow-sm"
            >
              Recommended
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900/90 rounded-lg data-[state=active]:shadow-sm"
            >
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="practice">
            <div className="flex gap-2 mb-5 flex-wrap">
              <Badge
                variant={filters.includes("Beginner") ? "default" : "outline"}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors px-3 py-1 rounded-full"
                onClick={() => toggleFilter("Beginner")}
              >
                Beginner
              </Badge>
              <Badge
                variant={filters.includes("Intermediate") ? "default" : "outline"}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors px-3 py-1 rounded-full"
                onClick={() => toggleFilter("Intermediate")}
              >
                Intermediate
              </Badge>
              <Badge
                variant={filters.includes("Advanced") ? "default" : "outline"}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors px-3 py-1 rounded-full"
                onClick={() => toggleFilter("Advanced")}
              >
                Advanced
              </Badge>
            </div>

            <Card className="mb-8 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 size={20} className="text-purple-500" />
                  Case Interview Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCases.map((caseType, index) => (
                    <motion.div
                      key={caseType.id}
                      className="h-full"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{
                        rotate: 1,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <Card 
                        className={`h-full flex flex-col cursor-pointer transition-all hover:shadow-lg dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden card-hover ${
                          selectedCase === caseType.id ? "ring-2 ring-purple-500 shadow-purple-500/20" : ""
                        }`}
                        onClick={() => handleSelectCase(caseType.id)}
                      >
                        <CardContent className="p-5 flex-grow">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${caseType.bgColor} ${caseType.darkBgColor} shadow-sm`}>
                              <caseType.icon className={`${caseType.iconColor} ${caseType.darkIconColor}`} size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-slate-800 dark:text-white">{caseType.title}</h3>
                                {caseType.premium && (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 rounded-full"
                                  >
                                    <Lock size={10} className="mr-1" /> Premium
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{caseType.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-full"
                                  >
                                    {caseType.difficulty}
                                  </Badge>
                                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    {caseType.duration} min
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    console.log("Download exhibits for", caseType.title)
                                  }}
                                >
                                  <Download size={14} className="text-slate-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                
                {selectedCase && (
                  <motion.div
                    className="flex justify-center pt-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-purple-500/20 px-8"
                      onClick={handleStartInterview}
                    >
                      <div className="relative mr-2">
                        <Mic className="h-4 w-4" />
                        <div
                          className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${
                            micStatus === "granted"
                              ? "bg-green-500"
                              : micStatus === "denied"
                                ? "bg-red-500"
                                : "bg-amber-500"
                          }`}
                        />
                      </div>
                      Start Interview
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Behavioral Questions Card - Apply Glassmorphism and Overlay */}
            <Card className="relative mb-8 dark:bg-slate-900/30 bg-white/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden backdrop-blur-md">
               {/* Overlay */}
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-white/50 to-white/20 dark:from-slate-900/50 dark:to-slate-900/20">
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 px-4 py-2 rounded-lg shadow">Coming Soon</h3>
                </div>
                
               {/* Existing Content (will be visually under the overlay) */}
               <CardHeader className="opacity-50">
                 <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users size={20} className="text-purple-500" />
                  Behavioral & FIT Questions
                 </CardTitle>
               </CardHeader>
              <CardContent className="opacity-50">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Object.values(CATEGORIZED_BEHAVIORAL_QUESTIONS).map((category: BehavioralQuestionCategory) => (
                      category.questions.length > 0 && (
                        // Link is still here but overlay prevents click
                        <Link
                            key={category.slug}
                            href={`/behavioral/${category.slug}/${category.questions[0].slug}`}
                            passHref
                            aria-disabled="true"
                            tabIndex={-1}
                            className="pointer-events-none"
                        >
                            <Card
                                className="dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:shadow-lg transition-all cursor-not-allowed rounded-lg overflow-hidden card-hover h-full"
                            >
                                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                                        <category.icon className="text-purple-600 dark:text-purple-400" size={18} />
                                    </div>
                                    <CardTitle className="text-sm font-medium">{category.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 pl-14">
                                    <CardDescription className="text-xs">
                                        {category.questions.length} {category.questions.length === 1 ? 'question' : 'questions'} in this category.
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                      )
                  ))}
                 </div>
               </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            {recentCases.length > 0 ? (
              <div className="space-y-4">
                {recentCases.map((session, index) => {
                  const caseType = CASE_TYPES.find((c) => c.id === session.case_type)
                  const icon = caseType?.icon || Landmark
                  const bgColor = caseType?.bgColor || "bg-slate-100"
                  const iconColor = caseType?.iconColor || "text-slate-600"
                  const darkBgColor = caseType?.darkBgColor || "dark:bg-slate-800"
                  const darkIconColor = caseType?.darkIconColor || "dark:text-slate-400"

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="dark:bg-slate-900 dark:border-slate-800">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${bgColor} ${darkBgColor}`}>
                                {React.createElement(icon, {
                                  className: `${iconColor} ${darkIconColor}`,
                                  size: 20,
                                })}
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-800 dark:text-white">{session.case_title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(session.created_at).toLocaleDateString()} at{" "}
                                  {new Date(session.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.performance_rating && (
                                <Badge
                                  variant={
                                    session.performance_rating === "Good"
                                      ? "success"
                                      : session.performance_rating === "Average"
                                        ? "warning"
                                        : "default"
                                  }
                                  className={
                                    session.performance_rating === "Good"
                                      ? "dark:bg-green-900/30 dark:text-green-300"
                                      : session.performance_rating === "Average"
                                        ? "dark:bg-amber-900/30 dark:text-amber-300"
                                        : "dark:bg-slate-800 dark:text-slate-300"
                                  }
                                >
                                  {session.performance_rating}
                                </Badge>
                              )}
                              <Button variant="ghost" size="sm" className="dark:text-slate-300 dark:hover:bg-slate-800">
                                {session.completed ? "Review" : "Continue"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't completed any case sessions yet</p>
                <Button
                  variant="outline"
                  onClick={() => (document.querySelector('[data-state="inactive"][value="practice"]') as HTMLElement)?.click()}
                >
                  Start practicing
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommended">
            <div className="flex items-center justify-center h-40 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">
                Recommendations based on your progress will appear here
              </p>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 dark:text-white">Weekly Leaderboard</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">
                    Friends
                  </Badge>
                  <Badge>Global</Badge>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { name: "Alex K.", cases: 24, hours: 12.5, rank: 1 },
                  { name: "Sarah M.", cases: 18, hours: 9.2, rank: 2 },
                  {
                    name: `${profile?.full_name || "You"}`,
                    cases: userStats.completedCases,
                    hours: userStats.totalPracticeHours,
                    rank: 3,
                    isUser: true,
                  },
                  { name: "Michael T.", cases: 10, hours: 7.1, rank: 4 },
                  { name: "Emma L.", cases: 8, hours: 5.3, rank: 5 },
                ].map((user, index) => (
                  <div
                    key={index}
                    className={`p-4 flex items-center justify-between ${
                      user.isUser ? "bg-purple-50 dark:bg-purple-900/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full ${
                          user.rank === 1
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : user.rank === 2
                              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              : user.rank === 3
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <span className="text-xs font-medium">{user.rank}</span>
                      </div>
                      <span
                        className={`font-medium ${user.isUser ? "text-purple-700 dark:text-purple-400" : "text-slate-800 dark:text-white"}`}
                      >
                        {user.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{user.cases}</p>
                        <p className="text-xs text-slate-500">cases</p>
                      </div>
                      <div className="text-right w-16">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{user.hours}</p>
                        <p className="text-xs text-slate-500">hours</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
