"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Clock, Wifi, WifiOff, HelpCircle, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { CaseType } from "@/lib/data"

interface InterviewHeaderProps {
  caseType: CaseType | null
  isRecording: boolean
  isPaused: boolean
  elapsedTime: number
  remainingTime: number
  isConnected: boolean
  isTtsEnabled: boolean
  onExit: () => void
  onTtsToggle: (enabled: boolean) => void
}

export function InterviewHeader({
  caseType,
  isRecording,
  isPaused,
  elapsedTime,
  remainingTime,
  isConnected,
  isTtsEnabled,
  onExit,
  onTtsToggle,
}: InterviewHeaderProps) {
  const router = useRouter()
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [isLowTime, setIsLowTime] = useState(false)
  const [isVeryLowTime, setIsVeryLowTime] = useState(false)

  // Check if time is running low
  useEffect(() => {
    setIsLowTime(remainingTime <= 300) // 5 minutes
    setIsVeryLowTime(remainingTime <= 120) // 2 minutes
  }, [remainingTime])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get timer class based on remaining time
  const getTimerClass = () => {
    if (isVeryLowTime) return "text-timer-danger animate-pulse-danger"
    if (isLowTime) return "text-timer-warning animate-pulse-warning"
    return "text-timer-normal"
  }

  return (
    <header className="sticky top-0 z-10 w-full glass">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowExitDialog(true)}
                    className="rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  >
                    <X size={24} className="text-slate-600 dark:text-slate-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Exit Interview (Ctrl+Q)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div>
              <h1 className="font-heading text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                {caseType?.title || "Case Interview"}
                <span className={`font-mono text-sm ${getTimerClass()}`}>
                  <Clock size={16} className="inline-block mr-1" />
                  {formatTime(remainingTime)}
                </span>
              </h1>

              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-xs bg-slate-100/80 dark:bg-slate-800/80 rounded-full">
                  {caseType?.difficulty || "Intermediate"}
                </Badge>

                {/* Connection status */}
                <div className="flex items-center gap-1.5">
                  {isConnected ? (
                    <Wifi className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isConnected ? "Connected" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        isRecording && !isPaused ? "bg-success animate-pulse" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isRecording && !isPaused ? "Mic Active" : "Mic Muted"}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Press M to toggle microphone</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tts-toggle"
                      checked={isTtsEnabled}
                      onCheckedChange={onTtsToggle}
                      aria-label="Toggle Text-to-Speech"
                      className="data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700"
                    />
                    <Label htmlFor="tts-toggle" className="sr-only">Text-to-Speech</Label>
                    {isTtsEnabled ? <Volume2 size={16} className="text-slate-600 dark:text-slate-400" /> : <VolumeX size={16} className="text-slate-600 dark:text-slate-400" />}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isTtsEnabled ? "Disable" : "Enable"} AI Voice (TTS)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" className="rounded-full">
                    <HelpCircle size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-2 p-1">
                    <p className="font-medium">Keyboard Shortcuts:</p>
                    <ul className="text-xs space-y-1">
                      <li>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">M</kbd> - Toggle
                        microphone
                      </li>
                      <li>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">E</kbd> - Toggle exhibits
                      </li>
                      <li>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">N</kbd> - Toggle notes
                      </li>
                      <li>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+Q</kbd> - Exit
                        interview
                      </li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Exit Interview?</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Your progress will be saved. You can resume this interview later from your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end mt-4">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onExit}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              Save & Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
