# CaseByCase

CaseByCase is a modern web application designed to help users practice and master case interviews with AI assistance. The platform provides a realistic interview environment, real-time feedback, comprehensive analytics, and personalized learning paths to improve your case interview skills.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features (Implemented)](#key-features-implemented)
- [Planned Features (Roadmap)](#planned-features-roadmap)
- [Project Structure](#project-structure)
- [Component Architecture](#component-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Customization](#customization)


## Overview

CaseByCase simulates real-world case interviews and provides tools for behavioral question preparation with an AI coach. Users can practice different types of case scenarios, interact with an AI chat coach, and (soon) tackle behavioral questions with AI feedback. The application tracks progress, offers analytics (planned), and aims to provide a comprehensive prep experience. It features a modern, responsive UI with both light and dark mode support, persistent navigation, and layouts optimized for dashboard use.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React Hooks (useState, useContext, etc.)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **AI Integration**: OpenAI API (or other LLMs) for Chat and Behavioral Feedback
- **Animation**: Framer Motion
- **Icons**: Lucide React


## Key Features (Implemented)

- **Interactive Case Scenarios (UI)**: Dashboard displays different case types.
- **Behavioral Question Section (UI)**: Displays categories; currently marked "Coming Soon" with glassmorphism effect.
- **AI Chat Coach (UI & Basic Backend)**: Functional chat interface (`/chat`) connected to a basic AI backend (`/api/chat`) capable of conversation.
- **Dashboard**: Displays overview, navigation links.
- **Persistent Navigation**: Features a fixed sidebar (expandable/collapsible) and a fixed top navbar with breadcrumbs and back button for sub-pages.
- **Light/Dark Mode**: Seamless theme switching.
- **User Authentication**: Secure sign-up and login via Supabase.

## Planned Features (Roadmap)

- **Activate Behavioral Questions**: Implement full question navigation, AI feedback generation (`/api/behavioral-feedback`), and UI rendering for the behavioral section.
- **Enhanced AI Chat Coach**: Improve backend logic, potentially add conversation history, streaming responses, and more sophisticated coaching capabilities.
- **Framework Library**: A dedicated section explaining common case interview frameworks.
- **Expanded Case & Question Types**: Add more quantitative/estimation problems, industry-specific cases, and diverse behavioral questions.
- **Implement Case Interview Flow**: Connect case selection on dashboard to the actual interview page (`/interview/[sessionId]`), including AI interaction, exhibit handling, timer, etc.
- **Deeper AI Feedback (Behavioral & Case)**: Enhance AI analysis to score answers, identify keywords, analyze structure, check calculations, provide specific suggestions.
- **AI Mock Interview Mode**: Simulate a full interview flow.
- **Detailed User Analytics Dashboard**: Advanced visualizations and insights.
- **Personalized Study Plans**: AI-driven recommendations.
- **Goal Setting & Tracking**: Enhanced goal features.
- **Bookmark/Save Features**: Save questions, cases, or feedback.
- **Live Leaderboard**: Functional leaderboards.
- **Enhanced Voice Features**: Transcription, potential analysis.
- **Full Accessibility Audit**: WCAG compliance.

## Project Structure

```plaintext
casebycase/ # Renamed for clarity
├── app/
│   ├── (auth)/                # Auth routes (e.g., /)
│   ├── (dashboard)/           # Routes requiring auth + dashboard layout
│   │   ├── dashboard/         # page.tsx
│   │   ├── chat/              # page.tsx
│   │   ├── behavioral/        # 
│   │   │   └── [categorySlug]/[questionSlug]/page.tsx
│   │   ├── interview/         # (Planned) Case interview session, e.g., /[sessionId]/page.tsx
│   │   └── layout.tsx         # Dashboard layout (Sidebar, Navbar)
│   ├── api/
│   │   ├── chat/              # route.ts (Handles AI chat requests)
│   │   └── behavioral-feedback/ # route.ts (Handles behavioral feedback requests)
│   ├── globals.css
│   └── layout.tsx             # Root layout
├── components/
│   ├── navigation/            # SidebarTrigger, DashboardNavbar
│   ├── interview/             # Case-specific components (Calculator, ExhibitPanel etc.)
│   ├── ui/                    # shadcn/ui components + custom Sidebar
│   ├── auth/                  # Auth forms/components
│   └── ... (Other shared components like theme-toggle, charts)
├── context/
│   └── auth-context.tsx
├── hooks/                     # Custom hooks (e.g., use-mobile)
├── lib/
│   ├── data.ts                # Static data (CATEGORIZED_BEHAVIORAL_QUESTIONS, CASE_TYPES)
│   ├── supabase.ts            # Supabase client setup
│   ├── utils.ts               # General utilities (e.g., cn, slugify)
│   └── ... (Other libs like case-service, database types)
└── public/
```

## Component Architecture

### Core Components

#### Dashboard Components

- **Dashboard Page**: Main dashboard with overview stats, quick actions, and navigation.
- **Progress Donut/Sparkline/HeatMap/Histogram**: Visualizations for different performance metrics.
- **(Planned) Advanced Analytics Widgets**: Components for displaying detailed performance trends and insights.

#### Interview Components (Case & Behavioral)

- **InterviewHeader**: Navigation bar with title, timer, and controls.
- **ChatMessage**: Message bubbles for AI and user interaction (used in Chat and potentially Interviews).
- **FeedbackDisplay**: Components to render structured AI feedback (used in Behavioral).
- **VoiceWaveform**: Visual feedback during voice recording.
- **CalculatorWidget**: In-app calculator.
- **FrameworkCanvas/Scratchpad**: Note-taking area.
- **ExhibitPanel**: Panel for viewing case exhibits.
- **ProgressMeter**: Indicator of interview/case progress.
- **EndCaseModal**: Summary dialog.

#### Other Key Components
- **Framework Library Page**: (Planned) Displays information about different frameworks.
- **Chat Interface**: Standalone chat page UI.

### State Management

- **AuthContext**: Manages user authentication.
- **React Hooks (useState, useEffect, useContext, useRef)**: Handle local and shared component state.

## Installation

```bash
npm install
# Set up your .env.local file with Supabase & OpenAI keys
npm run dev
```

## Usage

1.  **Sign Up / Log In**: Create an account or log in.
2.  **Dashboard**: View stats, select a case type, or choose a behavioral category.
3.  **Practice**: Engage in case interviews or answer behavioral questions.
4.  **Get Feedback**: Receive AI feedback on behavioral answers or review case performance.
5.  **Chat**: Use the AI chat coach for specific questions or practice.

## Customization

- **Theming**: Modify CSS variables in `globals.css`.
- **Adding Content**: Add case types, behavioral questions, or frameworks to `lib/data.ts`.
- **Extending Components**: Modify existing React components.

## Development Notes

- Core layout with Sidebar and Top Navbar implemented.
- AI Chat UI and basic backend functional.
- Behavioral Question section UI exists but marked "Coming Soon".
- Focus next on activating Behavioral Questions or implementing Case Interview flow.

## Database Schema

- `public.case_sessions`: Stores case interview session data.
- `public.behavioral_sessions`: (Planned) Stores behavioral question practice attempts.
- `public.skill_assessment`: Stores assessment scores related to sessions.
- `public.user_stats`: Stores aggregated user statistics.
- `public.profiles`: Stores user profile information.

(Refer to database setup documentation for details and RLS policies).

## Functionality Status (High Level)

- **[DONE]** Authentication & User Profiles.
- **[DONE]** Dashboard Layout (Sidebar, Top Navbar, Basic Content Display).
- **[DONE]** Behavioral Question Data Structure & Page Routing.
- **[DONE]** AI Chat UI & Basic API Connection.
- **[IN PROGRESS]** Full Behavioral Question Flow (AI Feedback, Navigation).
- **[TODO]** Case Interview Session Implementation.
- **[TODO]** Advanced AI Features (Mock Interviews, Deeper Feedback).
- **[TODO]** Analytics, Framework Library, etc. 