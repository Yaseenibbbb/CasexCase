"use client"

import { useState } from "react"

interface HeatMapProps {
  data: {
    category: string
    value: number
  }[]
  height: number
}

export function HeatMap({ data, height }: HeatMapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const getColor = (value: number) => {
    if (value >= 80) return "bg-green-500 dark:bg-green-600"
    if (value >= 60) return "bg-green-300 dark:bg-green-500"
    if (value >= 40) return "bg-amber-300 dark:bg-amber-500"
    if (value >= 20) return "bg-orange-300 dark:bg-orange-500"
    return "bg-red-300 dark:bg-red-500"
  }

  return (
    <div className="flex items-center justify-between h-full" style={{ height }}>
      {data.map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-center"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="relative w-full">
            <div className={`w-12 h-8 rounded-md ${getColor(item.value)}`} />
            {hoveredIndex === index && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 shadow-md rounded-md px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 whitespace-nowrap z-10">
                <p className="text-slate-800 dark:text-white font-medium">{item.value}%</p>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.category}</p>
        </div>
      ))}
    </div>
  )
}
