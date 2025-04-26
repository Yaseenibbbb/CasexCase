"use client"

import { Building, Users, Coins, Target, Clock } from "lucide-react"
import type { CaseType } from "@/lib/data"

interface CaseDetailsProps {
  caseType: CaseType | null
}

export function CaseDetails({ caseType }: CaseDetailsProps) {
  if (!caseType) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-500 dark:text-slate-400">Case details not available</p>
      </div>
    )
  }

  const { title, description, icon: Icon, difficulty, duration } = caseType

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${caseType.bgColor} ${caseType.darkBgColor}`}>
          <Icon className={`${caseType.iconColor} ${caseType.darkIconColor}`} size={24} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 dark:text-white">Case Background</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Your client is a mid-sized technology company looking to expand their market presence. They have been
          operating in the B2B space for 5 years and want to explore new growth opportunities.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-300">Tech Industry</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-300">250 Employees</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-300">$50M Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-300">15% Growth</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 dark:text-white">Your Task</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Develop a comprehensive {title.toLowerCase()} that addresses the client's growth objectives while considering
          market conditions, competitive landscape, and internal capabilities.
        </p>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-300">Expected duration: {duration} minutes</span>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {difficulty}
          </span>
        </div>
      </div>
    </div>
  )
}
