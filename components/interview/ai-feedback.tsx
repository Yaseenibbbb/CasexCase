"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CaseType } from "@/lib/data"

interface AIFeedbackProps {
  caseType: CaseType | null
  currentStep: number
}

export function AIFeedback({ caseType, currentStep }: AIFeedbackProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [input, setInput] = useState("")

  // Initial greeting message
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there! I'm Sarah, your AI case coach. I'm here to help you with your ${caseType?.title || "case interview"}. What questions do you have?`,
      },
    ])
  }, [caseType])

  // Step-specific guidance - removed typewriter effect
  useEffect(() => {
    const stepGuidance = {
      0: "I notice you're at the Problem Definition stage. Make sure to clarify the objectives and key metrics for success.",
      1: "Now that you're developing your framework, consider breaking down the problem into key components.",
      2: "During analysis, remember to examine the data critically and identify patterns.",
      3: "For your recommendations, focus on actionable insights that address the client's specific needs.",
      4: "As you conclude, summarize your key findings and next steps clearly.",
    }

    if (stepGuidance[currentStep as keyof typeof stepGuidance]) {
      // Add message immediately without typing simulation
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: stepGuidance[currentStep as keyof typeof stepGuidance] },
      ])
    }
  }, [currentStep])

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: input }])
    setInput("")

    // Simulate AI response
    setIsTyping(true)

    setTimeout(() => {
      // Generate a contextual response based on the user's input
      let response = ""
      const userInput = input.toLowerCase()

      if (userInput.includes("framework") || userInput.includes("structure")) {
        response =
          "For this case, I recommend using a structured approach that addresses market analysis, competitive positioning, and growth opportunities. Start by defining the problem clearly, then break it down into these key components."
      } else if (userInput.includes("math") || userInput.includes("calculation")) {
        response =
          "When doing calculations, remember to state your assumptions clearly. For market sizing, use a top-down or bottom-up approach and explain your logic step by step."
      } else if (userInput.includes("recommendation") || userInput.includes("solution")) {
        response =
          "Your recommendations should be specific, actionable, and directly address the client's needs. Prioritize them based on impact and feasibility, and be prepared to explain your rationale."
      } else {
        response =
          "That's a good question. When approaching this aspect of the case, focus on being structured and data-driven in your analysis. Would you like me to provide more specific guidance on this topic?"
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-sm">
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">AI</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Sarah (AI Coach)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Here to help with your case</p>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 h-[300px] overflow-y-auto flex flex-col gap-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-purple-500 text-white ml-auto"
                  : "bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}

      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Ask your AI coach a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage()
            }
          }}
          className="dark:bg-slate-800"
        />
        <Button onClick={handleSendMessage} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
