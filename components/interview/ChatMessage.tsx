"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
    <motion.div
      className={cn(
        "flex gap-3 mb-4 last:mb-0 group",
        isAI ? "max-w-[80%]" : "max-w-[80%] ml-auto",
        isCollapsed ? "opacity-80" : ""
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Avatar 
         {...avatarProps} 
         size="md" 
         className="mt-1 flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className={cn(
           "flex items-center justify-between mb-1 h-5",
           !showLabel && "mb-0"
           )}>
          {showLabel ? (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-small text-foreground">
                {isAI ? "Interviewer" : "You"}
              </span>
              <span className="text-tiny text-foreground-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
            className="text-foreground-400 ml-auto data-[hover=true]:bg-content2 rounded-full w-6 h-6 min-w-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand message" : "Collapse message"}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
        </div>

        <Card 
            shadow="sm" 
            className={cn(
               "w-full",
               isAI ? "bg-content2" : "bg-primary text-primary-foreground",
            )}
         >
            <CardBody className={cn(
               "p-3 text-small",
               isCollapsed && "line-clamp-1 overflow-hidden"
               )}>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:whitespace-pre-wrap prose-p:my-1 prose-ul:my-1 prose-ol:my-1"> 
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>

                {exhibitData && (
                  <Card shadow="none" className="mt-3 pt-3 border-t border-divider bg-transparent"> 
                      <CardBody className="p-0">
                           <div className="mb-2 p-2 bg-background/50 rounded-md border border-dashed border-divider">
                              <p className="text-tiny font-medium text-foreground-600 mb-0.5">Exhibit Preview:</p>
                              <p className="text-small font-semibold text-foreground truncate">{exhibitData.title}</p>
                              <p className="text-tiny text-foreground-500">Type: {exhibitData.type}</p>
                           </div>
                           <Button
                              size="sm"
                              variant="flat"
                              color="default"
                              startContent={<ImageIcon className="h-3.5 w-3.5" />}
                              className="text-tiny h-7"
                              onClick={onExhibitClick}
                           >
                              View Full Exhibit
                           </Button>
                      </CardBody>
                  </Card>
                )}
            </CardBody>
        </Card>
      </div>
    </motion.div>
  )
}
