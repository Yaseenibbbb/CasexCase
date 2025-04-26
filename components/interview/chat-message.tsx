"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ImageIcon } from "lucide-react"

interface ChatMessageProps {
  message: {
    id: number
    role: "user" | "assistant"
    content: string
    timestamp: string
    hasExhibit?: boolean
    exhibitId?: number
  }
  onExhibitClick?: () => void
}

export function ChatMessage({ message, onExhibitClick }: ChatMessageProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isAI = message.role === "assistant"

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={`flex gap-3 mb-6 ${isCollapsed ? "opacity-70" : ""}`}>
      {isAI ? (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">AI</AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            You
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-800 dark:text-white">
              {isAI ? "Sarah (AI Interviewer)" : "You"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{formattedTime}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-500"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
        </div>

        <div className={`${isCollapsed ? "line-clamp-1" : ""}`}>
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{message.content}</div>

          {message.hasExhibit && (
            <div className="mt-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={onExhibitClick}>
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
                View Exhibit
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
