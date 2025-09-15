"use client"

import { useState } from "react"
import { Avatar, Button, Card, CardBody, Spacer } from "@heroui/react"
import { ChevronDown, ChevronUp, ImageIcon, BrainCircuit, User as UserIcon } from "lucide-react"
import type { Exhibit } from "@/lib/parseExhibits"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: {
    id: number
    role: "user" | "assistant"
    content: string
    timestamp: string
    hasExhibit?: boolean
    exhibitId?: number | null | undefined
  }
  exhibitData?: Exhibit | null
  showLabel: boolean
  onExhibitClick?: () => void
}

export function ChatMessage({ message, exhibitData, showLabel, onExhibitClick }: ChatMessageProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isAI = message.role === "assistant"

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  const avatarProps = isAI ? {
    icon: <BrainCircuit size={20} />,
  } : {
    icon: <UserIcon size={20} />,
  };

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 last:mb-0 group",
        isAI ? "max-w-[80%]" : "max-w-[80%] ml-auto flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 mt-1",
        isAI ? "order-1" : "order-2"
      )}>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
          isAI 
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
            : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border border-slate-300"
        )}>
          {isAI ? "AI" : "U"}
        </div>
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 min-w-0",
        isAI ? "order-2" : "order-1"
      )}>
        {/* Sender Label */}
        {showLabel && (
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-xs font-medium",
              isAI ? "text-slate-600" : "text-slate-500"
            )}>
              {isAI ? "Interviewer" : "You"}
            </span>
            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {formattedTime}
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div className={cn(
          "relative rounded-2xl px-4 py-3 shadow-sm border transition-all duration-200",
          isAI 
            ? "bg-white border-slate-200 hover:shadow-md" 
            : "bg-blue-50 border-blue-200 hover:shadow-md",
          isCollapsed && "line-clamp-1 overflow-hidden"
        )}>
          {/* Message Text */}
          <div className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap",
            isAI ? "text-slate-800" : "text-slate-800"
          )}>
            {message.content}
          </div>

          {/* Exhibit Preview */}
          {exhibitData && (
            <div className="mt-3 pt-3 border-t border-slate-200"> 
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-medium text-slate-600 mb-1">📊 Exhibit Preview</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{exhibitData.title}</p>
                <p className="text-xs text-slate-500">Type: {exhibitData.type}</p>
              </div>
              <Button
                size="sm"
                variant="flat"
                className="mt-2 text-xs h-7 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                startContent={<ImageIcon className="h-3 w-3" />}
                onClick={onExhibitClick}
              >
                View Full Exhibit
              </Button>
            </div>
          )}

          {/* Collapse/Expand Button */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full w-6 h-6 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand message" : "Collapse message"}
          >
            {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
