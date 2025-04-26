"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Calculator } from "lucide-react"

interface CalculatorWidgetProps {
  onInsertResult: (result: string) => void
}

export function CalculatorWidget({ onInsertResult }: CalculatorWidgetProps) {
  const [expression, setExpression] = useState("")
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<{ expression: string; result: number }[]>([])

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

      // Add to history
      setHistory((prev) => [...prev.slice(-4), { expression, result: calculatedResult }])
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

  const handleClear = () => {
    setExpression("")
    setResult(null)
    setError(null)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-5 w-5 text-purple-500" />
        <h3 className="font-medium text-slate-800 dark:text-white">Calculator</h3>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter calculation (e.g., 125 * 0.15)"
          className="text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg"
        />
        <Button onClick={calculate} size="sm" className="rounded-lg">
          =
        </Button>
      </div>

      {error ? (
        <div className="text-sm text-red-500 dark:text-red-400 mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      ) : result !== null ? (
        <div className="flex items-center justify-between mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-sm font-medium">
            Result: <span className="text-purple-600 dark:text-purple-400 font-mono">{result}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleInsertResult} className="text-xs h-7 rounded-lg">
            Insert <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-1 mb-3">
        {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+"].map((key) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            className={`h-10 text-sm font-medium rounded-lg ${
              ["=", "+", "-", "×", "÷"].includes(key)
                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                : "bg-white dark:bg-slate-800"
            }`}
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

      <div className="flex justify-between">
        <Button variant="outline" size="sm" className="text-xs rounded-lg" onClick={handleClear}>
          Clear
        </Button>

        {history.length > 0 && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">History:</span>
            {history.map((item, index) => (
              <button
                key={index}
                className="ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                onClick={() => setExpression(item.expression)}
              >
                {item.result}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
