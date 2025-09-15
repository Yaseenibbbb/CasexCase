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
        "flex gap-4 mb-6 last:mb-0 group",
        isAI ? "max-w-[85%]" : "max-w-[85%] ml-auto flex-row-reverse",
        isCollapsed ? "opacity-80" : ""
      )}
    >
      <Avatar 
         {...avatarProps} 
         size="md" 
         className={cn(
           "mt-1 flex-shrink-0",
           isAI ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-600"
         )}
      />

      <div className="flex-1 min-w-0">
        <div className={cn(
           "flex items-center justify-between mb-2 h-6",
           !showLabel && "mb-0"
           )}>
          {showLabel ? (
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-semibold text-sm",
                isAI ? "text-slate-700" : "text-blue-700"
              )}>
                {isAI ? "Interviewer" : "You"}
              </span>
              <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {formattedTime}
              </span>
            </div>
          ) : (
            <Spacer />
          )}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="text-slate-400 ml-auto data-[hover=true]:bg-slate-100 rounded-full w-6 h-6 min-w-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand message" : "Collapse message"}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
        </div>

        <div 
            className={cn(
               "w-full rounded-xl shadow-sm border transition-all duration-200",
               isAI 
                 ? "bg-slate-50 border-slate-200 hover:shadow-md" 
                 : "bg-white border-slate-200 hover:shadow-md",
               isCollapsed && "line-clamp-1 overflow-hidden"
            )}
         >
            <div className={cn(
               "p-4",
               isCollapsed && "line-clamp-1 overflow-hidden"
               )}>
                <div className={cn(
                  "text-sm leading-relaxed whitespace-pre-wrap",
                  isAI ? "text-slate-800" : "text-slate-700"
                )}>
                  {message.content}
                </div>

                {exhibitData && (
                  <div className="mt-4 pt-4 border-t border-slate-200"> 
                      <div className="mb-3 p-3 bg-white/80 rounded-lg border border-dashed border-slate-300">
                          <p className="text-xs font-medium text-slate-600 mb-1">Exhibit Preview:</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">{exhibitData.title}</p>
                          <p className="text-xs text-slate-500">Type: {exhibitData.type}</p>
                      </div>
                      <Button
                         size="sm"
                         variant="flat"
                         color="default"
                         startContent={<ImageIcon className="h-3.5 w-3.5" />}
                         className="text-xs h-8 bg-slate-100 hover:bg-slate-200 text-slate-700"
                         onClick={onExhibitClick}
                      >
                         View Full Exhibit
                      </Button>
                  </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
