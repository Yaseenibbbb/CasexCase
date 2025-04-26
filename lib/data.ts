import {
  BarChart3,
  Handshake,
  Coins,
  Landmark,
  Rocket,
  Settings2,
  TrendingUp,
  ShoppingCart,
  Building,
  PieChart,
  Users,
  Star,
  Award,
  BrainCircuit,
  Target,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Define Exhibit structure
interface Exhibit {
  id: number
  type: 'image' | 'table' | 'chart'
  title: string
  url?: string // For images
  data?: any // For tables or charts
  chartType?: 'line' | 'bar' | 'pie' // For charts
}

export interface CaseType {
  id: string
  title: string
  description: string
  icon: LucideIcon
  difficulty: string
  duration: number
  bgColor: string
  iconColor: string
  darkBgColor: string
  darkIconColor: string
  premium?: boolean
  exhibits: Exhibit[] // Add exhibits array
}

// Mock Exhibits Data (moved from interview page for association)
const marketSizingExhibits: Exhibit[] = [
  {
    id: 2,
    type: "table",
    title: "Financial Data",
    data: {
      headers: ["Year", "Revenue", "Profit"],
      rows: [
        ["2021", "$1.2M", "$300K"],
        ["2022", "$1.5M", "$450K"],
        ["2023", "$1.8M", "$600K"],
      ],
    },
  },
  {
    id: 3,
    type: "chart",
    title: "Growth Trend",
    chartType: "line",
    data: { labels: ["Q1", "Q2", "Q3", "Q4"], datasets: [{ label: "Growth", data: [10, 25, 15, 30] }] },
  },
];

export const CASE_TYPES: CaseType[] = [
  {
    id: "market-sizing",
    title: "Market Sizing",
    description: "Practice estimating market size and potential",
    icon: BarChart3,
    difficulty: "Beginner",
    duration: 25,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    darkBgColor: "dark:bg-blue-900/30",
    darkIconColor: "dark:text-blue-400",
    exhibits: marketSizingExhibits, // Assign exhibits
  },
  {
    id: "m-and-a",
    title: "Mergers & Acquisitions",
    description: "Evaluate potential acquisition targets",
    icon: Handshake,
    difficulty: "Advanced",
    duration: 40,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
    darkBgColor: "dark:bg-purple-900/30",
    darkIconColor: "dark:text-purple-400",
    premium: true,
    exhibits: [], // Add empty array for now
  },
  {
    id: "profitability",
    title: "Profitability Analysis",
    description: "Identify ways to improve business profitability",
    icon: Coins,
    difficulty: "Intermediate",
    duration: 30,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    darkBgColor: "dark:bg-green-900/30",
    darkIconColor: "dark:text-green-400",
    exhibits: [], // Add empty array for now
  },
  {
    id: "market-entry",
    title: "Market Entry Strategy",
    description: "Develop strategies for entering new markets",
    icon: Landmark,
    difficulty: "Intermediate",
    duration: 35,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    darkBgColor: "dark:bg-amber-900/30",
    darkIconColor: "dark:text-amber-400",
    exhibits: [], // Add empty array for now
  },
  {
    id: "growth-strategy",
    title: "Growth Strategy",
    description: "Create plans to scale and expand business",
    icon: Rocket,
    difficulty: "Advanced",
    duration: 45,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
    darkBgColor: "dark:bg-red-900/30",
    darkIconColor: "dark:text-red-400",
    premium: true,
    exhibits: [], // Add empty array for now
  },
  {
    id: "operations",
    title: "Operations Optimization",
    description: "Streamline and improve business operations",
    icon: Settings2,
    difficulty: "Intermediate",
    duration: 30,
    bgColor: "bg-slate-100",
    iconColor: "text-slate-600",
    darkBgColor: "dark:bg-slate-800",
    darkIconColor: "dark:text-slate-400",
    exhibits: [], // Add empty array for now
  },
]

interface RecentCase {
  title: string
  date: string
  performance: "Good" | "Average" | "Needs Improvement"
  icon: LucideIcon
  bgColor: string
  iconColor: string
  darkBgColor: string
  darkIconColor: string
}

export const RECENT_CASES: RecentCase[] = [
  {
    title: "Retail Chain Expansion Strategy",
    date: "Yesterday at 3:45 PM",
    performance: "Good",
    icon: ShoppingCart,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    darkBgColor: "dark:bg-green-900/30",
    darkIconColor: "dark:text-green-400",
  },
  {
    title: "Tech Startup Valuation",
    date: "Apr 22, 2025",
    performance: "Average",
    icon: TrendingUp,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    darkBgColor: "dark:bg-amber-900/30",
    darkIconColor: "dark:text-amber-400",
  },
  {
    title: "Manufacturing Cost Reduction",
    date: "Apr 20, 2025",
    performance: "Needs Improvement",
    icon: PieChart,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
    darkBgColor: "dark:bg-red-900/30",
    darkIconColor: "dark:text-red-400",
  },
  {
    title: "Healthcare Market Analysis",
    date: "Apr 18, 2025",
    performance: "Good",
    icon: Building,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    darkBgColor: "dark:bg-blue-900/30",
    darkIconColor: "dark:text-blue-400",
  },
]

// --- Refactored Behavioral Questions --- 

// Interface for a single Behavioral Question
export interface BehavioralQuestion {
    slug: string; // Unique slug for routing (e.g., leadership-experience)
    title: string;
    description: string;
    icon: LucideIcon;
}

// Interface for a Category of Behavioral Questions
export interface BehavioralQuestionCategory {
    slug: string; // e.g., leadership-teamwork
    title: string; // e.g., "Leadership & Teamwork"
    icon: LucideIcon; // Icon for the category itself
    questions: BehavioralQuestion[];
}

// Define the categorized structure
export const CATEGORIZED_BEHAVIORAL_QUESTIONS: Record<string, BehavioralQuestionCategory> = {
    "leadership-teamwork": {
        slug: "leadership-teamwork",
        title: "Leadership & Teamwork",
        icon: Users, // Example category icon
        questions: [
            {
                slug: "leadership-experience",
                title: "Leadership Experience",
                description: "Tell me about a time when you led a team through a difficult situation",
                icon: Users,
            },
            // Add more questions to this category here
            // Example:
            // {
            //   slug: "team-conflict-resolution",
            //   title: "Team Conflict Resolution",
            //   description: "Describe a time you had to deal with conflict within a team.",
            //   icon: Handshake,
            // },
        ]
    },
    "resilience-learning": {
        slug: "resilience-learning",
        title: "Resilience & Learning",
        icon: Award, // Example category icon
        questions: [
            {
                slug: "overcoming-failure",
                title: "Overcoming Failure",
                description: "Describe a situation where you failed and what you learned from it",
                icon: Award,
            },
            // Add more questions here
        ]
    },
    "problem-solving-analysis": {
        slug: "problem-solving-analysis",
        title: "Problem Solving & Analysis",
        icon: BrainCircuit, // Example category icon
        questions: [
            {
                slug: "complex-problem-solving", // Changed slug slightly for uniqueness example
                title: "Problem Solving",
                description: "Share an example of a complex problem you solved with limited information",
                icon: BrainCircuit,
            },
            // Add more questions here
        ]
    },
    "fit-motivation": {
        slug: "fit-motivation",
        title: "Fit & Motivation",
        icon: Star, // Example category icon
        questions: [
            {
                slug: "career-motivation",
                title: "Career Motivation",
                description: "Why are you interested in consulting and this specific firm?",
                icon: Star,
            },
            // Add more questions here
            // Example:
            // {
            //   slug: "why-this-firm",
            //   title: "Why This Firm?",
            //   description: "What specifically about our firm attracts you?",
            //   icon: Target, 
            // },
        ]
    },
};

// --- Deprecated old structure (keep temporarily for reference or remove) ---
// export const BEHAVIORAL_QUESTIONS = [
//   {
//     title: "Leadership Experience",
//     description: "Tell me about a time when you led a team through a difficult situation",
//     icon: Users,
//   },
//   {
//     title: "Overcoming Failure",
//     description: "Describe a situation where you failed and what you learned from it",
//     icon: Award,
//   },
//   {
//     title: "Problem Solving",
//     description: "Share an example of a complex problem you solved with limited information",
//     icon: BrainCircuit,
//   },
//   {
//     title: "Career Motivation",
//     description: "Why are you interested in consulting and this specific firm?",
//     icon: Star,
//   },
// ]

export const WEEKLY_CASES = [2, 3, 1, 4, 2, 0, 0]

export const SKILL_ACCURACY = [
  { category: "Math", value: 85 },
  { category: "Structure", value: 70 },
  { category: "Creativity", value: 45 },
]

export const TIME_PER_CASE = [
  { range: "15-20 min", count: 2 },
  { range: "20-25 min", count: 5 },
  { range: "25-30 min", count: 8 },
  { range: "30-35 min", count: 4 },
  { range: "35-40 min", count: 3 },
  { range: "40+ min", count: 1 },
]
