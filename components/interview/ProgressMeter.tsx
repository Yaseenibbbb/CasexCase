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
            className="glass rounded-full shadow-lg p-1.5 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                  className="dark:stroke-slate-700"
                />
                <motion.circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="150.8"
                  strokeDashoffset={150.8 - (150.8 * progress) / 100}
                  initial={{ strokeDashoffset: 150.8 }}
                  animate={{ strokeDashoffset: 150.8 - (150.8 * progress) / 100 }}
                  transition={{ duration: 0.5 }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" /> {/* purple-500 */}
                    <stop offset="100%" stopColor="#6366f1" /> {/* indigo-500 */}
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-sm font-medium text-slate-700 dark:text-slate-300">
                {Math.round(progress)}%
              </div>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="p-0 rounded-xl">
          <div className="p-4 w-64">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Interview Progress
            </h4>
            <div className="space-y-2.5">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      currentStep === step.id
                        ? "bg-purple-500 text-white"
                        : step.completed
                          ? "bg-green-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {step.completed && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M5 12L10 17L20 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-sm ${
                        currentStep === step.id
                          ? "font-medium text-purple-600 dark:text-purple-400"
                          : step.completed
                            ? "text-green-600 dark:text-green-400"
                            : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {step.name}
                    </div>
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1">
                      <div
                        className={`h-full rounded-full ${
                          currentStep === step.id
                            ? "bg-purple-500 animate-pulse"
                            : step.completed
                              ? "bg-green-500"
                              : "bg-transparent"
                        }`}
                        style={{
                          width: currentStep === step.id ? "50%" : step.completed ? "100%" : "0%",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
