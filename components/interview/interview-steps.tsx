"use client"

import { Check } from "lucide-react"

interface InterviewStepsProps {
  currentStep: number
  onStepChange: (step: number) => void
}

export function InterviewSteps({ currentStep, onStepChange }: InterviewStepsProps) {
  const steps = [
    { id: 0, name: "Problem Definition" },
    { id: 1, name: "Framework Development" },
    { id: 2, name: "Analysis" },
    { id: 3, name: "Recommendations" },
    { id: 4, name: "Conclusion" },
  ]

  return (
    <div className="space-y-4">
      {steps.map((step) => {
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id

        return (
          <button
            key={step.id}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isActive
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                : isCompleted
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            onClick={() => onStepChange(step.id)}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full ${
                isActive
                  ? "bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300"
                  : isCompleted
                    ? "bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{step.id + 1}</span>}
            </div>
            <span className="text-sm font-medium">{step.name}</span>
          </button>
        )
      })}
    </div>
  )
}
