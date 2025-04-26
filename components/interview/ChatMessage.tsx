"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
    <motion.div
      className={`flex gap-3 mb-6 ${isCollapsed ? "opacity-70" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isAI ? (
        <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
          <AvatarImage src="/placeholder.svg?height=40&width=40" />
          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">AI</AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
          <AvatarImage src="/placeholder.svg?height=40&width=40" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">You</AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800 dark:text-white">
              {isAI ? "Sarah (AI Interviewer)" : "You"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{formattedTime}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
        </div>

        <div className={`${isCollapsed ? "line-clamp-1" : ""}`}>
          <div className={`p-4 py-5 ${isAI ? "message-bubble-ai" : "message-bubble-user"} shadow-md rounded-xl border ${isAI ? 'border-purple-500/20' : 'border-blue-500/20'}`}>
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:whitespace-pre-line prose-table:border prose-table:border-slate-200 dark:prose-table:border-slate-700 prose-th:border prose-th:border-slate-200 dark:prose-th:border-slate-700 prose-th:p-2 prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-700 prose-td:p-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>

            {message.hasExhibit && (
              <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
                  onClick={onExhibitClick}
                >
                  <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                  View Exhibit
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
