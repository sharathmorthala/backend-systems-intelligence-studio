# AI-Assisted Backend Engineering Toolkit

## Overview

This is a production-minded web application showcasing senior backend and platform engineering expertise. The toolkit contains 5 specialized tools for backend engineering tasks, all powered by AI assistance via the Hugging Face Inference API (Mixtral-8x7B-Instruct model) with deterministic fallback behavior ensuring reliability.

The application demonstrates:
- Backend architecture and API design
- Observability and reliability engineering
- Responsible LLM integration with fallback patterns

## Tools

### 1. Log & Incident Analyzer
- **Input**: Raw application logs, stack traces
- **Analysis**: Normalizes logs, groups similar errors, identifies root causes
- **Output**: Structured JSON with error groups, probable causes, suggested actions

### 2. API Contract Reviewer
- **Input**: REST request/response JSON, OpenAPI specs
- **Analysis**: Identifies missing fields, inconsistent error models, breaking changes
- **Output**: Contract issues, inconsistencies, best practice recommendations

### 3. Resilience Strategy Advisor
- **Input**: Failure scenario descriptions
- **Analysis**: Recommends resilience patterns
- **Output**: Retry strategies, idempotency guidance, circuit breaker config, what NOT to retry

### 4. Backend Code Risk Scanner
- **Input**: Java or Kotlin backend code
- **Analysis**: Detects blocking calls, thread-safety risks, error handling gaps
- **Output**: Risk categorization by severity and line number

### 5. System Design Reviewer
- **Input**: System design descriptions
- **Analysis**: Identifies architectural concerns
- **Output**: Bottlenecks, single points of failure, scalability concerns, observability gaps

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled with Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Layout**: Sidebar navigation with main content area

### UI Structure
- **Sidebar** (`client/src/components/app-sidebar.tsx`): Navigation with dashboard, tool list, and footer
- **Dashboard** (`client/src/pages/home.tsx`): Main page with 5 clickable tool tiles
- **Tool Pages** (`client/src/pages/tools/*.tsx`): Each tool has consistent three-column layout:
  - Left: Input panel
  - Center: Structured analysis
  - Right: LLM insights
- **Settings** (`client/src/pages/settings.tsx`): API key status and system configuration
- **About** (`client/src/pages/about.tsx`): Engineer profile with skill map and tooltips

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript running on Node.js
- **API Design**: RESTful endpoints per tool with clear boundaries
- **Request Handling**: Custom async handler wrapper for consistent error handling
- **Validation**: Zod schemas for request/response validation

### Core Services
- **Log Parser** (`server/log-parser.ts`): Parses multiple log formats, extracts levels/sources/messages, groups errors
- **LLM Service** (`server/llm-service.ts`): Hugging Face API integration for log analysis
- **Tool Services** (`server/tool-services.ts`): LLM integration for all 5 tools with deterministic fallbacks
- **Storage** (`server/storage.ts`): In-memory storage for analysis results

### API Endpoints
- `POST /api/analyze` - Log & Incident Analyzer
- `POST /api/tools/api-review` - API Contract Reviewer
- `POST /api/tools/resilience-advice` - Resilience Strategy Advisor
- `POST /api/tools/code-scan` - Backend Code Risk Scanner
- `POST /api/tools/system-review` - System Design Reviewer
- `GET /api/health` - Health check with API key status

### Data Flow
1. User submits input via tool frontend
2. Backend validates request
3. Tool-specific parser extracts structured data
4. LLM service analyzes with Mixtral-8x7B (fallback if unavailable)
5. Results returned as structured JSON

## External Dependencies

### AI/LLM Integration
- **Hugging Face Inference API**: Primary LLM provider using Mixtral-8x7B-Instruct-v0.1 model
- Requires `HUGGINGFACE_API_KEY` environment variable
- Deterministic fallback analysis implemented for all tools when LLM is unavailable

### Database
- **PostgreSQL**: Configured via Drizzle ORM (schema ready in `shared/schema.ts`)
- Currently using in-memory storage; database schema ready for persistence

### Key NPM Packages
- **Server**: express, drizzle-orm, zod, zod-validation-error
- **Client**: React, TanStack Query, Radix UI primitives, Tailwind CSS
- **Build**: Vite, esbuild, tsx

## Design Principles

### LLM Integration Philosophy
- LLMs are strictly assistants, not the system of record
- All outputs are structured and validated with Zod schemas
- Deterministic fallback behavior ensures tools always work
- Footer disclaimer on all pages: "LLMs are used as assistants. Deterministic backend logic remains the source of truth."

### UI/UX Guidelines
- Clean, professional engineering UI (no flashy animations)
- Consistent three-column layout across all tools
- Dark mode support with theme toggle
- Responsive sidebar navigation

## Recent Changes

### AI Backend Engineering Toolkit (Latest)
- Created main dashboard with 5 clickable tool tiles
- Built 5 specialized tool pages with consistent three-column layout
- Implemented backend API endpoints for all tools
- Added shared LLM client with tool-specific prompts in tool-services.ts
- Implemented deterministic fallback analysis for all tools
- Updated sidebar navigation with tool list
- Added footer disclaimer on all pages
