"use client"

// Force dynamic rendering for this client component
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Download, Share2, Award, BarChart3, Brain, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { caseService } from "@/lib/case-service"
import { CASE_TYPES } from "@/lib/data"
import { toast } from "@/components/ui/use-toast"
import confetti from "canvas-confetti"

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [caseSession, setCaseSession] = useState<any>(null)
  const [skillAssessment, setSkillAssessment] = useState<any>(null)

  // Fetch case session data
  useEffect(() => {
    const fetchCaseSession = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const { data, error } = await caseService.getCaseSession(id)

        if (error || !data) {
          console.error("Error fetching case session:", error)
          toast({
            title: "Error",
            description: "Could not load the case results. Please try again.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        setCaseSession(data)

        if (data.skill_assessments && data.skill_assessments.length > 0) {
          setSkillAssessment(data.skill_assessments[0])
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCaseSession()
  }, [id, user, router])

  // Trigger confetti on load
  useEffect(() => {
    if (!isLoading && caseSession) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Since particles fall down, start a bit higher than random
        confetti({
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 0,
          particleCount: Math.floor(randomInRange(10, 30)),
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isLoading, caseSession])

  // Find case type details
  const caseType = caseSession ? CASE_TYPES.find((c) => c.id === caseSession.case_type) : null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!caseSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Case results not found</p>
          <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="text-slate-600 dark:text-slate-400"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="font-semibold text-slate-800 dark:text-white">Case Results</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {caseType?.title || "Case Interview"} - {new Date(caseSession.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Performance Summary */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2" />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Award className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    {caseSession.performance_rating || "Good"} Performance!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    You completed the {caseType?.title || "case interview"} in {caseSession.duration_minutes} minutes.
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                      Structured Approach
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                      Clear Communication
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
                      Insightful Analysis
                    </Badge>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-center gap-2 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {skillAssessment
                      ? Math.round(
                          (skillAssessment.math_score +
                            skillAssessment.structure_score +
                            skillAssessment.creativity_score) /
                            3,
                        )
                      : 75}
                    %
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Overall Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skill Assessment */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Skill Assessment</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Mathematical Accuracy</CardTitle>
                  <Calculator className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Score</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {skillAssessment?.math_score ?? 0}%
                    </span>
                  </div>
                  <Progress value={skillAssessment?.math_score ?? 0} className="h-2 bg-slate-200 dark:bg-slate-700">
                    <div className="h-full bg-blue-500 dark:bg-blue-600 rounded-full" />
                  </Progress>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your calculations were mostly accurate, with minor errors in market sizing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Structured Thinking</CardTitle>
                  <BarChart3 className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Score</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {skillAssessment?.structure_score ?? 0}%
                    </span>
                  </div>
                  <Progress value={skillAssessment?.structure_score ?? 0} className="h-2 bg-slate-200 dark:bg-slate-700">
                    <div className="h-full bg-purple-500 dark:bg-purple-600 rounded-full" />
                  </Progress>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    You demonstrated strong framework development and logical problem breakdown.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Creative Solutions</CardTitle>
                  <Brain className="h-5 w-5 text-green-500 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Score</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {skillAssessment?.creativity_score ?? 0}%
                    </span>
                  </div>
                  <Progress value={skillAssessment?.creativity_score ?? 0} className="h-2 bg-slate-200 dark:bg-slate-700">
                    <div className="h-full bg-green-500 dark:bg-green-600 rounded-full" />
                  </Progress>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your recommendations were practical, with room for more innovative approaches.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Detailed Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Detailed Feedback</h2>

          <Tabs defaultValue="feedback">
            <TabsList className="mb-4">
              <TabsTrigger value="feedback">AI Coach Feedback</TabsTrigger>
              <TabsTrigger value="transcript">Interview Transcript</TabsTrigger>
              <TabsTrigger value="notes">Your Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="feedback">
              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">Sarah's Feedback</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">AI Case Coach</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white mb-2">Strengths</h4>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                            <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                          </div>
                          <p>Clear problem definition and understanding of the client's objectives</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                            <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                          </div>
                          <p>Logical framework development with comprehensive coverage of key areas</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                            <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                          </div>
                          <p>Strong data analysis and ability to draw insights from limited information</p>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white mb-2">Areas for Improvement</h4>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mt-0.5">
                            <span className="text-amber-600 dark:text-amber-400 text-xs">!</span>
                          </div>
                          <p>Consider more innovative approaches in your recommendations</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mt-0.5">
                            <span className="text-amber-600 dark:text-amber-400 text-xs">!</span>
                          </div>
                          <p>Double-check your market sizing calculations for accuracy</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mt-0.5">
                            <span className="text-amber-600 dark:text-amber-400 text-xs">!</span>
                          </div>
                          <p>Provide more specific implementation details in your action plan</p>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white mb-2">Overall Assessment</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        You demonstrated strong analytical skills and a structured approach to problem-solving. Your
                        framework was comprehensive and your communication was clear. To further improve, focus on
                        developing more innovative solutions and ensuring mathematical accuracy in your calculations.
                        With practice, you'll continue to refine these skills and excel in case interviews.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcript">
              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center">
                      Interview transcript will appear here after processing is complete.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    {caseSession.notes ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        {caseSession.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center">
                        No notes were taken during this interview.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="outline" size="lg" onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            onClick={() => router.push("/dashboard")}
          >
            Practice Another Case
          </Button>
        </div>
      </div>
    </div>
  )
}
