"use client"
import { Card, CardContent } from "@/components/ui/card"
import type { CaseType } from "@/lib/data"

interface CardCaseProps {
  caseType: CaseType
  isSelected: boolean
  onSelect: () => void
}

export default function CardCase({ caseType, isSelected, onSelect }: CardCaseProps) {
  const { id, title, description, icon: Icon } = caseType

  return (
    <Card
      className={`bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:translate-y-[-4px] ${
        isSelected ? "ring-2 ring-purple-500 shadow-purple-500/20" : "hover:ring-1 hover:ring-purple-500/40"
      }`}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect()
          e.preventDefault()
        }
      }}
      role="button"
      aria-pressed={isSelected}
    >
      <CardContent className="flex flex-col items-center p-6">
        <div className="mb-3 p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 shadow-inner">
          <Icon size={28} />
        </div>
        <h3 className="font-semibold text-center mb-2 text-slate-800 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">{description}</p>
      </CardContent>
    </Card>
  )
}
