"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface HistogramProps {
  data: {
    range: string
    count: number
  }[]
  height: number
}

export function Histogram({ data, height }: HistogramProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 25,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="range"
            className="text-xs fill-slate-500 dark:fill-slate-400"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis className="text-xs fill-slate-500 dark:fill-slate-400" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-slate-800 shadow-md rounded-md p-2 text-xs border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-slate-800 dark:text-white font-medium">{payload[0].value} cases</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} className="fill-purple-500 dark:fill-purple-600" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
