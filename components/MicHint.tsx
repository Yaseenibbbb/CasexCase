"use client"

import { Mic } from "lucide-react"
import { motion } from "framer-motion"

export default function MicHint() {
  return (
    <motion.div
      className="flex items-center justify-center gap-2 text-xs text-slate-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <Mic size={12} />
      <span>Make sure your microphone is ready</span>
    </motion.div>
  )
}
