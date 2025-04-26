"use client"

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts"

interface SparklineProps {
  data: number[]
  height: number
  width: number
}

export function Sparkline({ data, height, width }: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }))

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            className="dark:stroke-purple-400"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-slate-800 shadow-md rounded-md px-2 py-1 text-xs border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-800 dark:text-white font-medium">{payload[0].value}</p>
                  </div>
                )
              }
              return null
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
