"use client"

import React, { useEffect, useState } from "react"

// Prevent server-side revalidation for this client component
export const revalidate = false
export const dynamic = 'force-dynamic'
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Play,
  Plus,
  Clock,
  Users,
  Target,
  BarChart3,
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  Star,
  Zap,
  Brain,
  Rocket,
  X,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CASE_TYPES, CATEGORIZED_BEHAVIORAL_QUESTIONS } from "@/lib/data"
import { useAuth } from "@/context/auth-context"
import { caseService } from "@/lib/case-service"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

const DIFFICULTY_CONFIG = {
  Beginner: { 
    color: "bg-emerald-500", 
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20", 
    textColor: "text-emerald-700 dark:text-emerald-300",
    icon: Star
  },
  Intermediate: { 
    color: "bg-blue-500", 
    bgColor: "bg-blue-50 dark:bg-blue-950/20", 
    textColor: "text-blue-700 dark:text-blue-300",
    icon: Zap
  },
  Advanced: { 
    color: "bg-purple-500", 
    bgColor: "bg-purple-50 dark:bg-purple-950/20", 
    textColor: "text-purple-700 dark:text-purple-300",
    icon: Brain
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, isLoading } = useAuth()
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const [pausedCase, setPausedCase] = useState<string | null>(null)
  const [isStartingInterview, setIsStartingInterview] = useState(false)
  const [userStats, setUserStats] = useState({
    completedCases: 0,
    totalPracticeHours: 0,
    skillAccuracy: { math: 0, structure: 0, creativity: 0 },
  })
  const [recentCases, setRecentCases] = useState<any[]>([])

  // Fetch user data
  useEffect(() => {
    if (!isLoading && user) {
      const fetchUserData = async () => {
        try {
          // Use Promise.allSettled to not block on individual failures
          const [statsResult, casesResult] = await Promise.allSettled([
            fetch(`/api/user-stats?userId=${user.id}`, { cache: "no-store" }).then(r => r.json()),
            fetch(`/api/user-cases?userId=${user.id}`, { cache: "no-store" }).then(r => r.json())
          ]);

          // Handle stats result
          if (statsResult.status === "fulfilled" && statsResult.value?.data) {
            setUserStats(statsResult.value.data);
          } else {
            console.warn("Stats fetch failed:", statsResult.status === "rejected" ? statsResult.reason : "No data");
          }

          // Handle cases result
          if (casesResult.status === "fulfilled" && casesResult.value?.data) {
            const cases = casesResult.value.data;
            setRecentCases(cases);
            const pausedCase = cases.find((c: any) => !c.completed);
            if (pausedCase) {
              setPausedCase(pausedCase.case_type);
              setShowResumeBanner(true);
            }
          } else {
            console.warn("Cases fetch failed:", casesResult.status === "rejected" ? casesResult.reason : "No data");
          }
        } catch (error) {
          console.error("Error in fetchUserData:", error)
        }
      }
      fetchUserData()
    }
  }, [user, isLoading])

  const handleSelectCase = (type: string) => {
    setSelectedCase(selectedCase === type ? null : type)
  }

  const handleStartInterview = async () => {
    if (isStartingInterview || !selectedCase || !user) return
    
    setIsStartingInterview(true)
    const caseType = CASE_TYPES.find((c) => c.id === selectedCase)
    
    if (!caseType) {
      toast({ title: "Error", description: "Invalid case type selected", variant: "destructive" })
      setIsStartingInterview(false)
      return
    }

    try {
      // Use API route for case creation
      const response = await fetch('/api/create-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          meta: {
            caseType: selectedCase as any, // Cast to match the CaseTypeId type
            company: 'N/A', // Optional company name
            industry: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Energy', 'Telecommunications'][Math.floor(Math.random() * 7)],
            role_focus: ['Strategy', 'Operations', 'Product', 'Marketing', 'Finance', 'Sales'][Math.floor(Math.random() * 6)],
            geography: ['Global', 'North America', 'Europe', 'Asia', 'Middle East', 'Latin America'][Math.floor(Math.random() * 6)],
            difficulty: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)] as any,
            time_limit_minutes: [25, 30, 35, 40][Math.floor(Math.random() * 4)],
            exhibit_preferences: 'auto',
            constraints_notes: 'Standard business assumptions apply'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create case session')
      }

      const { data } = await response.json()
      const id = data.sessionId
      
      // Store case data in sessionStorage for offline sessions
      if (id.startsWith('offline-session-')) {
        sessionStorage.setItem(`case-session-${id}`, JSON.stringify({
          id: id,
          user_id: user.id,
          case_type: data.caseType,
          case_title: data.caseTitle,
          generated_case_data: data.caseData,
          duration_minutes: 0,
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      }

      router.push(`/interview/${id}`)
    } catch (error) {
      console.error("Error starting interview:", error)
      toast({ title: "Error", description: "Failed to start interview", variant: "destructive" })
    } finally {
      setIsStartingInterview(false)
    }
  }

  const resumePausedCase = () => {
    if (pausedCase) {
      setSelectedCase(pausedCase)
      setShowResumeBanner(false)
    }
  }

  const weeklyGoalPercentage = profile?.weekly_goal_hours
    ? Math.min(100, Math.round((userStats.totalPracticeHours / profile.weekly_goal_hours) * 100))
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 dashboard-content">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Resume Banner */}
        {showResumeBanner && pausedCase && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-xl"
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Continue where you left off</h3>
                <p className="text-indigo-100 mt-1">
                  {CASE_TYPES.find((c) => c.id === pausedCase)?.title} • 3 mins remaining
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={resumePausedCase}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  size="sm"
                >
                  <Play size={16} className="mr-2" />
                  Resume
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResumeBanner(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Ready to master your next case interview?
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">Cases Completed</p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{userStats.completedCases}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">Practice Hours</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{userStats.totalPracticeHours.toFixed(1)}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 dark:text-purple-300 text-sm font-medium">Weekly Goal</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{weeklyGoalPercentage}%</p>
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <Progress value={weeklyGoalPercentage} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">Current Streak</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{profile?.streak_count || 0}</p>
                </div>
                <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Practice Cases - Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Practice Cases</h2>
              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800">
                {CASE_TYPES.length} Available
              </Badge>
            </div>

            <div className="grid gap-4">
              {CASE_TYPES.map((caseType) => {
                const isSelected = selectedCase === caseType.id
                const config = DIFFICULTY_CONFIG[caseType.difficulty as keyof typeof DIFFICULTY_CONFIG]
                const DifficultyIcon = config.icon

                return (
                  <motion.div
                    key={caseType.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer case-card",
                      "bg-white dark:bg-slate-900/50 backdrop-blur-sm",
                      isSelected 
                        ? "border-indigo-500 shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/20" 
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg"
                    )}
                    onClick={() => handleSelectCase(caseType.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "h-14 w-14 rounded-xl flex items-center justify-center",
                          config.bgColor
                        )}>
                          <caseType.icon className={cn("h-7 w-7", config.textColor)} />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {caseType.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-xs font-medium", config.bgColor, config.textColor)}>
                                <DifficultyIcon className="h-3 w-3 mr-1" />
                                {caseType.difficulty}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            {caseType.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {caseType.duration} minutes
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none"
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Start Practice Button */}
            {selectedCase && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center pt-4"
              >
                <Button
                  size="lg"
                  onClick={handleStartInterview}
                  disabled={isStartingInterview}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full px-8 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isStartingInterview ? (
                    <>
                      <div className="h-5 w-5 mr-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-3" />
                      Start Practice
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-indigo-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/custom-prep">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between hover:bg-slate-50 dark:hover:bg-slate-800 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center">
                        <Plus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      Custom Prep
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                  </Button>
                </Link>
                
                <Link href="/chat">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between hover:bg-slate-50 dark:hover:bg-slate-800 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center">
                        <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      AI Coach
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {userStats.totalPracticeHours.toFixed(1)} / {profile?.weekly_goal_hours || 5} hours
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {weeklyGoalPercentage}%
                    </span>
                  </div>
                  <Progress value={weeklyGoalPercentage} className="h-3" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{userStats.skillAccuracy.math}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Math</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{userStats.skillAccuracy.structure}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Structure</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{userStats.skillAccuracy.creativity}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Creativity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Behavioral Questions Preview */}
            <Card className="border-0 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50" />
              <div className="absolute inset-0 bg-black/5 dark:bg-white/5" />
              
              <CardHeader className="relative pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  Behavioral Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-3">
                {Object.values(CATEGORIZED_BEHAVIORAL_QUESTIONS).slice(0, 2).map((category) => {
                  const IconComponent = category.icon
                  return (
                    <div key={category.slug} className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                      <div className="h-8 w-8 bg-amber-100 dark:bg-amber-950/30 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{category.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{category.questions.length} questions</p>
                      </div>
                    </div>
                  )
                })}
                
                <div className="text-center pt-2">
                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                    Coming Soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}