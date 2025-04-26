"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LayoutTemplate, GitBranch, BarChart2, PieChart, DollarSign } from "lucide-react"
import { FrameworkModal } from "./FrameworkModal"

interface FrameworkCanvasProps {
  value: string
}

export function FrameworkCanvas({ value }: FrameworkCanvasProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [modalFramework, setModalFramework] = useState<any | null>(null)

  const frameworks = [
    {
      id: "profit-tree",
      name: "Profit Tree",
      icon: DollarSign,
      template: `# Profit Tree Analysis

## Revenue
- Market Size
- Market Share
- Price
- Volume

## Costs
- Fixed Costs
  - Overhead
  - Facilities
- Variable Costs
  - COGS
  - Labor
  - Materials

## Profitability Levers
- Increase Revenue
- Decrease Costs
- Optimize Pricing
`,
    },
    {
      id: "market-entry",
      name: "Market Entry",
      icon: GitBranch,
      template: `# Market Entry Framework

## Market Attractiveness
- Market Size & Growth
- Competition
- Barriers to Entry
- Regulatory Environment

## Company Capabilities
- Core Competencies
- Resources
- Brand Strength
- Distribution Channels

## Entry Strategy
- Build vs. Buy vs. Partner
- Geographic Approach
- Customer Segment Targeting
- Pricing Strategy
`,
    },
    {
      id: "4ps",
      name: "4Ps Marketing",
      icon: BarChart2,
      template: `# 4Ps Marketing Framework

## Product
- Features & Benefits
- Quality
- Branding
- Packaging

## Price
- List Price
- Discounts
- Payment Terms
- Value Perception

## Place (Distribution)
- Channels
- Coverage
- Logistics
- Inventory

## Promotion
- Advertising
- PR
- Direct Marketing
- Sales Promotion
`,
    },
    {
      id: "swot",
      name: "SWOT Analysis",
      icon: PieChart,
      template: `# SWOT Analysis

## Strengths
- 
- 
- 

## Weaknesses
- 
- 
- 

## Opportunities
- 
- 
- 

## Threats
- 
- 
- 
`,
    },
  ]

  // Simple markdown to HTML conversion for preview
  const markdownToHtml = (markdown: string) => {
    const html = markdown
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mb-2 mt-4">$1</h1>')
      .replace(
        /^## (.*$)/gm,
        '<h2 class="text-lg font-semibold mb-2 mt-3 text-purple-600 dark:text-purple-400">$1</h2>',
      )
      .replace(/^### (.*$)/gm, '<h3 class="text-md font-semibold mb-1 mt-2">$1</h3>')
      .replace(/\*\*(.*)\*\*/gm, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gm, "<em>$1</em>")
      .replace(/- (.*)/gm, '<li class="ml-4">$1</li>')

    return html
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="notes" className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-xl">
            <TabsTrigger
              value="notes"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900/90 rounded-lg data-[state=active]:shadow-sm"
              onClick={() => setShowPreview(false)}
            >
              <LayoutTemplate className="h-4 w-4 mr-2" />
              My Notes
            </TabsTrigger>
            <TabsTrigger
              value="frameworks"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900/90 rounded-lg data-[state=active]:shadow-sm"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Frameworks
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>

        <TabsContent value="notes" className="flex-1 mt-0">
          {showPreview ? (
            <div
              className="min-h-[calc(40vh-150px)] bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
            />
          ) : (
            <textarea
              value={value}
              readOnly
              placeholder="Select a framework to view its visualization..."
              className="min-h-[calc(40vh-150px)] w-full resize-none p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
            />
          )}
        </TabsContent>

        <TabsContent value="frameworks" className="mt-0">
          <div className="grid grid-cols-2 gap-3">
            {frameworks.map((framework) => (
              <Button
                key={framework.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-lg transition-all duration-200 hover:bg-purple-50 dark:hover:bg-slate-800/60"
                onClick={() => setModalFramework(framework)}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                  <framework.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-medium mb-1">{framework.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Click to view</span>
              </Button>
            ))}
          </div>

          <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <h3 className="font-medium text-sm mb-2">Markdown Tips:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div># Heading 1</div>
              <div>## Heading 2</div>
              <div>- Bullet point</div>
              <div>**Bold text**</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {modalFramework && (
        <FrameworkModal
          isOpen={!!modalFramework}
          onClose={() => setModalFramework(null)}
          framework={modalFramework}
        />
      )}
    </div>
  )
}
