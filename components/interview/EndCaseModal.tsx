"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Award, BarChart3, Brain, Calculator } from "lucide-react"

interface EndCaseModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  skillAssessment: {
    math_score: number
    structure_score: number
    creativity_score: number
  }
}

export function EndCaseModal({ isOpen, onOpenChange, sessionId, skillAssessment }: EndCaseModalProps) {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(true)

  // Calculate overall score
  const overallScore = Math.round(
    (skillAssessment.math_score + skillAssessment.structure_score + skillAssessment.creativity_score) / 3,
  )

  // Handle navigation to detailed feedback
  const handleViewFeedback = () => {
    router.push(`/interview/${sessionId}/results`)
  }

  // Handle retry case
  const handleRetryCase = () => {
    // Logic to restart the case would go here
    onOpenChange(false)
  }

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">Case Complete!</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-center mb-6">
            <motion.div
              className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-3xl font-bold text-purple-600 dark:text-purple-400"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {overallScore}%
              </motion.div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Mathematical Accuracy</span>
                </div>
                <span className="text-sm font-semibold">{skillAssessment.math_score}%</span>
              </div>
              <Progress value={skillAssessment.math_score} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Structured Thinking</span>
                </div>
                <span className="text-sm font-semibold">{skillAssessment.structure_score}%</span>
              </div>
              <Progress value={skillAssessment.structure_score} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Creative Solutions</span>
                </div>
                <span className="text-sm font-semibold">{skillAssessment.creativity_score}%</span>
              </div>
              <Progress value={skillAssessment.creativity_score} className="h-2" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={handleViewFeedback}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg"
          >
            <Award className="h-4 w-4 mr-2" />
            View Detailed Feedback
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleRetryCase} className="rounded-lg">
              Retry Case
            </Button>
            <Button variant="outline" onClick={handleBackToDashboard} className="rounded-lg">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
