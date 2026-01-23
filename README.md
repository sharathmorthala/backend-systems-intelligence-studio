# AI-Assisted Log & Incident Analyzer

A production-minded web application that analyzes application logs and stack traces using AI assistance. Built to showcase senior backend and platform engineering skills with emphasis on reliability, debuggability, and clean architecture.

## Overview

This application accepts raw application logs and stack traces, normalizes and structures them on the backend, and uses an LLM (via Hugging Face Inference API) to:

- **Group similar errors** by pattern recognition
- **Summarize root causes** with confidence levels
- **Identify missing context** that would help debugging
- **Suggest mitigation and investigation steps**

All outputs are structured JSON with validated schemas - no free-form blobs.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌───────────┐  ┌───────────────┐  ┌────────────────────────┐  │
│  │ Log Input │  │ Parsed Logs   │  │ AI Analysis Panel      │  │
│  │ Panel     │  │ & Error Groups│  │ - Root Causes          │  │
│  │           │  │               │  │ - Missing Context      │  │
│  │           │  │               │  │ - Recommendations      │  │
│  └───────────┘  └───────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express.js)                        │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ API Routes │──│ Log Parser  │──│ LLM Service              │ │
│  │            │  │             │  │ (Hugging Face + Fallback)│ │
│  └────────────┘  └─────────────┘  └──────────────────────────┘ │
│                        │                                        │
│                        ▼                                        │
│              ┌─────────────────┐                               │
│              │ In-Memory Store │                               │
│              │ (Analysis Cache)│                               │
│              └─────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Log Parser** (`server/log-parser.ts`)
   - Parses multiple log formats (ISO timestamps, common formats)
   - Extracts log levels, sources, messages, and stack traces
   - Groups errors by pattern similarity

2. **LLM Service** (`server/llm-service.ts`)
   - Integrates with Hugging Face Inference API
   - Uses Mixtral-8x7B model for analysis
   - Implements deterministic fallback when LLM unavailable
   - Validates and normalizes LLM responses

3. **API Routes** (`server/routes.ts`)
   - RESTful endpoints with Zod validation
   - Comprehensive error handling and logging
   - Async/await with proper error propagation

## Design Trade-offs

### LLM as Assistant, Not System of Record

The LLM provides suggestions and analysis, but the system doesn't blindly trust its outputs:

- **Schema validation**: All LLM responses are validated against Zod schemas
- **Fallback mode**: If LLM fails, the system uses deterministic pattern matching
- **Confidence levels**: Analysis includes confidence indicators for transparency

### Reliability vs. Speed

- **Timeout handling**: API requests have reasonable timeouts
- **Graceful degradation**: Fallback analysis ensures the app always works
- **Progress indicators**: Users see detailed loading states during analysis

### Simplicity vs. Completeness

- **In-memory storage**: Fast iteration without database complexity
- **Single LLM model**: Focused on one reliable model vs. multiple options
- **Minimal dependencies**: Only essential packages for maintainability

## Error Handling & Reliability Strategies

### API Layer
- Request validation using Zod schemas with descriptive error messages
- Async handler wrapper to catch and propagate errors
- Global error handler for uncaught exceptions

### LLM Integration
- API key presence check before attempting calls
- Rate limit detection (429) and model loading (503) handling
- JSON parsing with fallback for malformed responses
- Deterministic fallback analysis based on log patterns

### Frontend
- Loading states with progress indicators
- Toast notifications for success/error feedback
- Graceful handling of network failures

## Scaling Considerations

For production deployment, consider:

### Infrastructure
- **Database**: Replace in-memory storage with PostgreSQL for persistence
- **Caching**: Redis for caching frequent analysis patterns
- **Queue**: Bull/BullMQ for async log processing at scale

### Performance
- **Streaming**: Stream large log files instead of loading fully in memory
- **Pagination**: Paginate parsed logs and analysis history
- **Worker processes**: Offload LLM calls to background workers

### Observability
- **Structured logging**: JSON logging with correlation IDs
- **Metrics**: Prometheus metrics for API latency, LLM call success rate
- **Tracing**: Distributed tracing with OpenTelemetry

## API Endpoints

### POST /api/analyze
Analyze raw logs and get structured analysis.

**Request:**
```json
{
  "rawLogs": "2024-01-23T10:15:32.123Z ERROR [PaymentService] Failed to process payment..."
}
```

**Response:**
```json
{
  "id": "uuid",
  "createdAt": "ISO timestamp",
  "status": "completed",
  "parsedLogs": [...],
  "errorGroups": [...],
  "analysis": {
    "summary": "...",
    "rootCauses": [...],
    "missingContext": [...],
    "recommendations": [...]
  },
  "usedFallback": false
}
```

### GET /api/analysis/:id
Retrieve a previous analysis by ID.

### GET /api/history
Get list of past analyses.

### GET /api/health
Health check endpoint.

## LLM Provider Notes

### Current: Hugging Face Inference API

Using `mistralai/Mixtral-8x7B-Instruct-v0.1` model via Hugging Face's free inference API.

**Setup:**
1. Create account at [huggingface.co](https://huggingface.co)
2. Generate API token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. Set `HUGGINGFACE_API_KEY` environment variable

### Switching Providers

To replace with another provider:

1. **OpenAI**: Update `HUGGINGFACE_API_URL` and prompt format
2. **Anthropic**: Modify request/response handling for Claude API
3. **Local LLM**: Use Ollama or similar with local endpoint

Key changes needed:
- Update API endpoint URL
- Adjust authentication headers
- Modify prompt format (instruction wrapping differs per model)
- Update response parsing for different output formats

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app runs on port 5000
```

## Environment Variables

- `HUGGINGFACE_API_KEY`: Hugging Face API token (required for AI analysis)

## Tech Stack

- **Frontend**: React, TanStack Query, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript
- **Validation**: Zod
- **Build**: Vite, esbuild
