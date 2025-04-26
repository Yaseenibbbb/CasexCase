"use client"
import { motion } from "framer-motion"

export function VoiceWaveform() {
  const bars = 12

  return (
    <div className="flex items-center justify-center h-6 gap-0.5">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-purple-500 dark:bg-purple-400 rounded-full"
          animate={{
            height: [3, Math.random() * 15 + 5, 3],
          }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.1,
          }}
        />
      ))}
      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">Recording...</span>
    </div>
  )
}
