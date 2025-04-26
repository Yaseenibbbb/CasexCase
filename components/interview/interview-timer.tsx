"use client"

import { Clock } from "lucide-react"

interface InterviewTimerProps {
  seconds: number
}

export function InterviewTimer({ seconds }: InterviewTimerProps) {
  // Format seconds into HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (num: number) => num.toString().padStart(2, "0")

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }

  // Determine color based on time elapsed
  const getTimerColor = () => {
    if (seconds < 600) {
      // Less than 10 minutes
      return "text-green-500 dark:text-green-400"
    } else if (seconds < 1800) {
      // Less than 30 minutes
      return "text-amber-500 dark:text-amber-400"
    } else {
      return "text-red-500 dark:text-red-400"
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Clock className={`h-4 w-4 ${getTimerColor()}`} />
      <span className={`font-mono font-medium ${getTimerColor()}`}>{formatTime(seconds)}</span>
    </div>
  )
}
