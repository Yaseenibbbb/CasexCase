"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FrameworkCanvasProps {
  value: string
  onChange: (value: string) => void
}

export function FrameworkCanvas({ value, onChange }: FrameworkCanvasProps) {
  const frameworks = [
    {
      id: "profit-tree",
      name: "Profit Tree",
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
  ]

  const insertFramework = (template: string) => {
    onChange(template)
  }

  return (
    <Tabs defaultValue="notes">
      <TabsList className="mb-4">
        <TabsTrigger value="notes">My Notes</TabsTrigger>
        <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
      </TabsList>

      <TabsContent value="notes">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Take notes during your case interview..."
          className="min-h-[calc(40vh-150px)] resize-none dark:bg-slate-800"
        />
      </TabsContent>

      <TabsContent value="frameworks">
        <div className="grid grid-cols-3 gap-3">
          {frameworks.map((framework) => (
            <Button
              key={framework.id}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center justify-center text-center"
              onClick={() => insertFramework(framework.template)}
            >
              <span className="font-medium mb-1">{framework.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Click to insert</span>
            </Button>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
