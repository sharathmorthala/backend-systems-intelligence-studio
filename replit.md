# AI-Assisted Log & Incident Analyzer

## Overview

This is a production-minded web application that analyzes application logs and stack traces using AI assistance. Users paste raw logs into the interface, and the system parses, normalizes, and structures them on the backend. An LLM (via Hugging Face Inference API) then groups similar errors, summarizes root causes with confidence levels, identifies missing debugging context, and suggests mitigation steps. All outputs are structured JSON with validated schemas.

The application demonstrates senior backend and platform engineering skills with emphasis on reliability, debuggability, and clear API boundaries.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled with Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Structure**: Single-page dashboard with panels for log input, parsed logs, error groups, and AI analysis

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript running on Node.js
- **API Design**: RESTful endpoints with clear boundaries (`/api/analyze`, `/api/health`)
- **Request Handling**: Custom async handler wrapper for consistent error handling
- **Validation**: Zod schemas for request/response validation with structured error messages via zod-validation-error

### Core Services
- **Log Parser** (`server/log-parser.ts`): Parses multiple log formats (ISO timestamps, common formats), extracts log levels, sources, messages, and stack traces, groups errors by pattern similarity
- **LLM Service** (`server/llm-service.ts`): Integrates with Hugging Face Inference API (Mixtral-8x7B-Instruct model), includes deterministic fallback behavior when LLM fails or rate limits, outputs are structured, validated JSON
- **Storage** (`server/storage.ts`): In-memory storage for analysis results and history (MemStorage class implementing IStorage interface)

### Data Flow
1. User submits raw logs via frontend
2. Backend validates request with Zod schema
3. Log parser extracts structured entries and groups errors
4. LLM service analyzes patterns and generates recommendations
5. Results cached in memory storage and returned to client

### Schema Design
- Shared schemas in `shared/schema.ts` using Zod
- Key types: LogEntry, ErrorGroup, AnalysisResult, AnalyzeLogsResponse
- Drizzle ORM configured for PostgreSQL (schema ready for database persistence)

### Build System
- Development: Vite dev server with HMR, tsx for TypeScript execution
- Production: esbuild bundles server, Vite builds client to `dist/public`
- Static file serving from compiled `dist/public` directory

## External Dependencies

### AI/LLM Integration
- **Hugging Face Inference API**: Primary LLM provider using Mixtral-8x7B-Instruct-v0.1 model
- Requires `HUGGINGFACE_API_KEY` environment variable
- Fallback behavior implemented for rate limits or failures

### Database
- **PostgreSQL**: Configured via Drizzle ORM with `DATABASE_URL` environment variable
- Currently using in-memory storage; database schema ready in `shared/schema.ts`
- Drizzle Kit for migrations (`drizzle-kit push`)

### Key NPM Packages
- **Server**: express, drizzle-orm, zod, zod-validation-error
- **Client**: React, TanStack Query, Radix UI primitives, Tailwind CSS
- **Build**: Vite, esbuild, tsx

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner`: Development tooling