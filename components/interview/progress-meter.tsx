"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProgressMeterProps {
  currentStep: number
}

export function ProgressMeter({ currentStep }: ProgressMeterProps) {
  const [isHovered, setIsHovered] = useState(false)

  const steps = [
    { id: 0, name: "Problem Definition", completed: currentStep > 0 },
    { id: 1, name: "Framework Development", completed: currentStep > 1 },
    { id: 2, name: "Analysis", completed: currentStep > 2 },
    { id: 3, name: "Recommendations", completed: currentStep > 3 },
    { id: 4, name: "Conclusion", completed: currentStep > 4 },
  ]

  const progress = Math.min(100, (currentStep / 4) * 100)

  return (
    <TooltipProvider>
      <Tooltip open={isHovered}>
        <TooltipTrigger asChild>
          <motion.div
            className="bg-white dark:bg-slate-800 rounded-full shadow-md p-1 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                  className="dark:stroke-slate-600"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * progress) / 100}
                  className="dark:stroke-purple-500"
                  initial={{ strokeDashoffset: 125.6 }}
                  animate={{ strokeDashoffset: 125.6 - (125.6 * progress) / 100 }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute text-xs font-medium text-slate-700 dark:text-slate-300">
                {Math.round(progress)}%
              </div>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="p-0">
          <div className="p-3 w-48">
            <h4 className="text-sm font-medium mb-2">Interview Progress</h4>
            <div className="space-y-1.5">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      currentStep === step.id
                        ? "bg-purple-500"
                        : step.completed
                          ? "bg-green-500"
                          : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      currentStep === step.id
                        ? "font-medium text-purple-600 dark:text-purple-400"
                        : step.completed
                          ? "text-green-600 dark:text-green-400"
                          : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {step.name} {currentStep === step.id && "⬅️"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
