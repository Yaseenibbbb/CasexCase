"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"

interface CalculatorWidgetProps {
  onInsertResult: (result: string) => void
}

export function CalculatorWidget({ onInsertResult }: CalculatorWidgetProps) {
  const [expression, setExpression] = useState("")
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const calculate = () => {
    try {
      // Replace × with *, ÷ with /
      const sanitizedExpression = expression.replace(/×/g, "*").replace(/÷/g, "/")

      // eslint-disable-next-line no-eval
      const calculatedResult = eval(sanitizedExpression)

      if (isNaN(calculatedResult) || !isFinite(calculatedResult)) {
        throw new Error("Invalid calculation")
      }

      setResult(calculatedResult)
      setError(null)
    } catch (err) {
      setError("Invalid expression")
      setResult(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      calculate()
    }
  }

  const handleInsertResult = () => {
    if (result !== null) {
      onInsertResult(result.toString())
    }
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
      <div className="flex gap-2 mb-2">
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter calculation (e.g., 125 * 0.15)"
          className="text-sm bg-white dark:bg-slate-700"
        />
        <Button onClick={calculate} size="sm">
          =
        </Button>
      </div>

      {error ? (
        <div className="text-sm text-red-500 dark:text-red-400">{error}</div>
      ) : result !== null ? (
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            Result: <span className="text-purple-600 dark:text-purple-400">{result}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleInsertResult} className="text-xs h-7">
            Insert <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-1 mt-2">
        {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+"].map((key) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              if (key === "=") {
                calculate()
              } else {
                setExpression((prev) => prev + key)
              }
            }}
          >
            {key}
          </Button>
        ))}
      </div>
    </div>
  )
}
