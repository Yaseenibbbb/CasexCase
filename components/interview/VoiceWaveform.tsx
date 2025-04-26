"use client"
import { motion } from "framer-motion"
import type React from "react"

export function VoiceWaveform() {
  const bars = 12
  const barWidth = 2

  return (
    <div className="flex items-center justify-center h-8 gap-1 px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl">
      <div className="flex items-end h-full gap-[2px]">
        {Array.from({ length: bars }).map((_, i) => (
          <motion.div
            key={i}
            className="waveform-bar rounded-full"
            style={
              {
                width: `${barWidth}px`,
                height: "4px",
                "--index": i,
              } as React.CSSProperties
            }
            animate={{
              height: [4, Math.random() * 16 + 4, 4],
            }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              delay: i * 0.05,
            }}
          />
        ))}
      </div>
      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">Recording...</span>
    </div>
  )
}
