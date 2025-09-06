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
- **Styling**: Tailwind CSS, NextUI, shadcn/ui components
- **State Management**: React Hooks (useState, useContext, etc.)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **AI Integration**: OpenAI API (or other LLMs) for Chat, Case Interview, Behavioral Feedback, and Description Generation
- **Animation**: Framer Motion
- **Icons**: Lucide React


## Key Features (Implemented)

- **User Authentication**: Secure sign-up and login via Supabase (Email/Password, Google, LinkedIn).
- **Dashboard**: 
    - Displays overview and available case types.
    - Interactive case card selection with visual highlighting (ring effect).
    - Filter buttons for case types with icons.
    - Enhanced button styling (shadows, icons, hover effects) for better UX.
    - UI refresh applied with updated color palettes, shadows, and typography.
    - "Resume Paused Case" banner.
    - Performance Analytics section (collapsible, shows basic stats).
- **Custom Prep Form**: Multi-step form for defining custom case scenarios, including:
    - Async Company Combobox with logo display (requires backend API).
    - AI-powered Description Generation (`/api/generate-description`).
- **Behavioral Question Section (UI)**: Displays categories; currently marked "Coming Soon" with glassmorphism effect.
- **Case Interview Interface (`/interview/[id]`)**:
    - **Turn-Based Interaction Flow**: Ensures smooth interaction between user input (voice/text) and AI response (text/speech).
    - **Chat Display**: Renders conversation between user and AI assistant, displaying AI messages sentence-by-sentence synchronized with TTS playback.
    - **Sticky Header**: The top header bar with case details, timer, and controls remains visible during scrolling.
    - **AI Processing/Speaking Indicators**: Visual cues when the AI is thinking or generating audio.
    - **Text Input & Voice Recording**: Allows user responses via text or microphone.
    - **Interview Controls**: Buttons for Need Clarification, Scratchpad, Calculator, Exhibits, Pause/Resume Timer, End Interview, integrated with turn-based state.
    - **Timer**: Functional elapsed/remaining time tracking.
    - **Exhibit Display**: Interactive side panel for viewing case exhibits parsed from AI responses, including rendering for tables, images, and charts (Pie, Bar, Line) using `recharts`. Exhibits can be browsed, pinned, and zoomed.
    - **Scratchpad/Notes**: Panel for user notes (integrated with Framework Canvas).
    - **Calculator**: In-interview calculator widget.
    - **TTS (Text-to-Speech)**: AI responses can be read aloud (`/api/speak`) sentence-by-sentence, toggleable by user. Uses a consistent voice (Cassidy from ElevenLabs) for the entire session.
    - **Enhanced AI Interaction**: AI prompts updated to guide the model towards more proactive behavior, structured framework suggestions, better memory retention, a coaching tone, summarization, and clearer handling of clarification requests.
- **AI Chat Coach (UI & Basic Backend)**: Functional chat interface (`/chat`) connected to a basic AI backend (`/api/chat`).
- **Persistent Navigation**: Features a fixed sidebar (expandable/collapsible) and a fixed top navbar.
- **Light/Dark Mode**: Seamless theme switching, including dynamic logo swapping in the sidebar (requires dark mode logo file in `/public`).


## Planned Features (Roadmap)

- **Activate Behavioral Questions**: Implement full question navigation, AI feedback generation (`/api/behavioral-feedback`), and UI rendering.
- **Audio Transcription**: Implement backend service to transcribe user voice recordings in the interview.
- **Enhance AI Capabilities**: Improve backend logic for chat, case interview (e.g., exhibit generation, ending detection), and feedback generation.
- **Deeper AI Feedback (Behavioral & Case)**: Enhance AI analysis to score answers, identify keywords, analyze structure, check calculations, provide specific suggestions.
- **Framework Library**: A dedicated section explaining common case interview frameworks.
- **Expanded Case & Question Types**: Add more quantitative/estimation problems, industry-specific cases, etc.
- **Detailed User Analytics Dashboard**: Implement advanced visualizations and insights using fetched user stats.
- **Personalized Study Plans**: AI-driven recommendations.
- **Goal Setting & Tracking**: Enhanced goal features.
- **Bookmark/Save Features**: Save questions, cases, or feedback.
- **Live Leaderboard**: Functional leaderboards.
- **Full Accessibility Audit**: WCAG compliance.
- **Error Handling & Edge Cases**: Robust handling of API errors, network issues, etc.


## Project Structure

```plaintext
casebycase/
├── app/
│   ├── (auth)/                # Auth routes (e.g., /)
│   ├── (dashboard)/           # Routes requiring auth + dashboard layout
│   │   ├── dashboard/         # page.tsx
│   │   ├── chat/              # page.tsx
│   │   ├── interview/         
│   │   │   └── [id]/          # Main interview page (page.tsx)
│   │   │       └── results/     # (Planned) Results page (page.tsx)
│   │   └── layout.tsx         # Dashboard layout (Sidebar, Navbar)
│   ├── api/
│   │   ├── chat/              # route.ts (Handles AI chat requests)
│   │   ├── speak/             # route.ts (Handles TTS requests)
│   │   ├── generate-description/ # route.ts (For Custom Prep AI)
│   │   └── companies/         # route.ts (For Company Combobox - Needs Implementation)
│   ├── globals.css
│   └── layout.tsx             # Root layout
├── components/
│   ├── navigation/            # SidebarTrigger, DashboardNavbar
│   ├── interview/             # Case-specific components (InterviewHeader, ChatMessage, CalculatorWidget, ExhibitPanel, FrameworkCanvas, ProgressMeter etc.)
│   ├── ui/                    # shadcn/ui components + custom Sidebar
│   ├── auth/                  # Auth forms/components
│   └── CustomPrepForm.tsx     # Multi-step custom prep form
│   └── ... (Other shared components like theme-toggle)
├── context/
│   └── auth-context.tsx
├── hooks/                     # Custom hooks (e.g., useDebounce)
├── lib/
│   ├── data.ts                # Static data (CATEGORIZED_BEHAVIORAL_QUESTIONS, CASE_TYPES)
│   ├── supabase.ts            # Supabase client setup
│   ├── utils.ts               # General utilities (e.g., cn)
│   ├── case-service.ts        # Functions for interacting with Supabase case tables
│   ├── database.types.ts      # Auto-generated Supabase types
│   └── parseExhibits.ts       # Utility for parsing AI responses with exhibits
└── public/
    ├── Logo.png               # Light mode logo
    └── ... (Needs logo-dark.png)
└── tailwind.config.ts
└── postcss.config.mjs 
└── ... (Other config files: tsconfig.json, next.config.mjs, .env.example)
```

## Component Architecture

### Core Components

#### Dashboard Components

- **Dashboard Page**: Main dashboard with overview stats, case selection, custom prep access.
- **CustomPrepForm**: Multi-step modal for defining custom cases.
- **Performance Analytics Card**: Collapsible section showing basic stats.

#### Interview Components

- **Interview Page**: Main page coordinating the interview flow.
- **InterviewHeader**: Navigation bar with title, timer, TTS toggle, and exit control.
- **ChatMessage**: Message bubbles for AI and user interaction.
- **VoiceWaveform**: (Currently unused directly, animation via CSS) Visual feedback during voice recording.
- **CalculatorWidget**: In-app calculator.
- **FrameworkCanvas**: Note-taking area (integrated into Notes Panel).
- **ExhibitPanel**: Side panel for viewing case exhibits.
- **Notes Panel**: Slide-up panel containing the FrameworkCanvas/Scratchpad.
- **ProgressMeter**: Indicator of interview/case progress (if applicable).

#### Other Key Components
- **Chat Interface**: Standalone chat page UI.

### State Management

- **AuthContext**: Manages user authentication.
- **React Hooks (useState, useEffect, useContext, useRef)**: Handle local and shared component state, including `interactionState` in the interview.

## Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables:
    *   Create a `.env` file in the root directory.
    *   Copy the contents of `.env.example` into it (or ensure the necessary variables are present).
    *   Fill in your Supabase Project URL, Anon Key, and Service Role Key.
    *   Fill in your OpenAI API Key.
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1.  **Sign Up / Log In**: Create an account or log in.
2.  **Dashboard**: View stats, select a case type, start a custom prep, or access other sections.
3.  **Practice Case**: Select a case and click "Start Practice" to enter the interview screen.
4.  **Interview**: Interact with the AI interviewer using voice or text, use helper tools (Scratchpad, Calculator, Exhibits).
5.  **Chat**: Use the AI chat coach for specific questions or practice.

## Customization

- **Theming**: Modify CSS variables in `globals.css` and color definitions in `tailwind.config.ts`.
- **Adding Content**: Add case types, behavioral questions, or frameworks to `lib/data.ts`.
- **Extending Components**: Modify existing React components.

## Development Notes

- Core layout with Sidebar and Top Navbar implemented.
- Dashboard UI refreshed and made more interactive.
- Case Interview page implements core features: turn-based flow, chat, timer, basic controls.
- Custom Prep form includes AI description generation and async company lookup UI.
- **Exhibit Panel**: Implemented interactive side panel (`components/interview/ExhibitPanel.tsx`) to display parsed exhibits (images, tables, charts) with navigation, zoom, and pin controls. Includes fixes for chart rendering.
- **Voice Selection API**: Created `/api/voices` route to handle dynamic and session-consistent voice selection for TTS, securing the ElevenLabs API key server-side. Updated interview page to use this route.
- **Enhanced AI Prompts**: Updated `/api/chat/route.ts` with detailed instructions in `casePrompts` to improve AI's conversational intelligence during interviews (proactivity, structure, memory, coaching).
- **Fixes**: Addressed issues with Supabase calls (`caseService.createCaseSession`) potentially hanging due to RLS policies by adding more robust checks and logging. Resolved client-side environment variable errors for API keys. Resolved TTS playback issues and state management.
- Focus next on activating Behavioral Questions, implementing audio transcription, and further enhancing AI responses.

## V0.2 Changes and Issues

The following issues have been identified in v0.2 and are being tracked for fixes:

| Feature | Issue | Status |
|---------|-------|--------|
| Custom Prep Menu | When opening and playing with the menu, no button on the top left in the sidebar to go back to dashboard | ✅ FIXED |
| Strategic Go/No-Go Description | "Help a client decide whether to launch a new product, enter a new market, or acquire a company" - Text needs review | ✅ FIXED |  
| Brainstorming Case Description | "Generate creative ideas for a client, such as how to increase revenue or solve a unique problem" - Text needs review | ✅ FIXED |
| Case Interview Voice Recording | Does not work even after tinkering with it | ❌ BROKEN |
| Case Interview Text-to-Speech | Does not work when the first prompt is given. Only after typing something like "Hi" does Polly start working. Update: eventually worked after 4th or 5th case. It did say "Uh" once between the chat bubbles | ⚠️ INCONSISTENT |
| Case Interview Chat Bubble(s) | Should be a single chat bubble. It seems to split up every time, causing breaks in speech | ✅ FIXED |
| Case Interview Case Description in Right Toolbar | Consider removing entirely. The candidate should be able to grasp this info from the prompt or ask the AI if needed | 💡 SUGGESTION |
| Case Interview Progress Bullet points | Progress meter looks good but shouldn't be transparent and it ends after Recommendation (no Conclusion) | ✅ FIXED |
| Case Interview Topics | TechInnovate cloud-based management software tools case appears consistently for strategic go/no-go | ⚠️ REPETITIVE |
| Case Interview Exhibits | Exhibits did not display even when relevant during the case | ❌ BROKEN |
| Case Interview Go/No-Go AI notes | AI analysis is very qualitative. The AI should proactively include revenue/cost calculations and initial investment cost calculations rather than requiring user prompting | 💡 ENHANCEMENT |

### V0.2 Update Summary

The v0.2 update addresses several key usability issues identified in the initial version of the application:

1. **Navigation Improvements**: 
   - Added back button to Custom Prep Menu for better navigation flow
   
2. **UI/UX Enhancements**:
   - Fixed chat bubbles to prevent splitting messages, providing a smoother conversation experience
   - Improved Progress Meter styling with higher opacity and better visibility
   - Ensured Conclusion step is clearly visible in the interview progress

3. **Content Updates**:
   - Refined case descriptions for Strategic Go/No-Go and Brainstorming cases to be more comprehensive
   
4. **Remaining Challenges**:
   - Voice Recording functionality still needs repair
   - Text-to-Speech behavior requires stabilization
   - Exhibit display issues need to be addressed
   - AI analysis should be enhanced to include quantitative elements automatically

The update has successfully addressed 4 out of 11 identified issues, with focus on improving the core user experience flow and clarity of case descriptions.

### Fixes Implemented
- **[DONE]** Custom Prep Menu navigation: Added back button to navigate to dashboard
- **[NOT STARTED]** Fix Voice Recording functionality
- **[NOT STARTED]** Fix Text-to-Speech inconsistencies
- **[DONE]** Merge chat bubbles to provide smoother conversation flow
- **[DONE]** Improve Progress Meter styling and add Conclusion step
- **[NOT STARTED]** Fix exhibit display issues
- **[DONE]** Update Strategic Go/No-Go and Brainstorming case descriptions
- **[NOT STARTED]** Improve AI analysis to include quantitative elements

## Database Schema

- `public.case_sessions`: Stores case interview session data.
- `public.skill_assessment`: Stores assessment scores related to sessions.
- `public.user_stats`: Stores aggregated user statistics.
- `public.profiles`: Stores user profile information.

(Refer to database setup documentation for details and RLS policies).

## Functionality Status (High Level)

- **[DONE]** Authentication & User Profiles.
- **[DONE]** Dashboard Layout & UI Refresh.
- **[DONE]** Interactive Dashboard Elements (Card Selection, Buttons).
- **[DONE]** Custom Prep Form UI & AI Description Generation.
- **[DONE]** Case Interview UI Shell & Core Components (Chat, Timer, Controls).
- **[DONE]** Turn-Based Interview Interaction Logic.
- **[DONE]** AI Chat UI & Basic API Connection.
- **[DONE]** Behavioral Question Data Structure & Page Routing (UI only).
- **[DONE]** Interactive Exhibit Display Panel with Chart Rendering.
- **[DONE]** Dynamic & Secure Voice Selection for TTS.
- **[DONE]** Enhanced AI Interaction Flow Prompts.
- **[IN PROGRESS]** Full Case Interview Flow (Audio Transcription, AI Logic Enhancements - e.g., detecting interview end).
- **[IN PROGRESS]** Full Behavioral Question Flow (AI Feedback, Navigation).
- **[TODO]** Advanced AI Features (Mock Interviews, Deeper Feedback).
- **[DONE]** Analytics Implementation, Framework Library, Leaderboard, etc.
- **[DONE]** Add Dark Mode Logo file to `/public`. 