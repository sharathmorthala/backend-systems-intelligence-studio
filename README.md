# Backend Systems Intelligence Studio

Production-minded backend analysis tools for engineers building reliable, scalable systems.

---

## Overview

Backend Systems Intelligence Studio is an interactive engineering portfolio demonstrating senior backend and platform engineering expertise. It contains **6 specialized tools** for backend engineering tasks, all powered by AI assistance via the Hugging Face Inference API (Mixtral-8x7B-Instruct model) with deterministic fallback behavior ensuring reliability.

This application demonstrates:
- **Backend architecture and API design** — Clean separation of concerns, structured analysis pipelines
- **Observability and reliability engineering** — Production-minded tooling for debugging and risk assessment
- **Responsible LLM integration** — AI as assistant, not source of truth, with fallback patterns

### Who This Is For

- Backend engineers evaluating code quality and system design
- Platform teams analyzing dependencies and resilience strategies
- Engineering managers reviewing log analysis and incident patterns
- Anyone interested in production-grade AI-assisted tooling

---

## Design Philosophy

### Deterministic Analysis First

Every tool performs structured, deterministic analysis before involving AI:
- Log parsing and error grouping happen in code
- Code scanning uses AST-based static analysis (JavaScript/TypeScript) or structural parsing (Java, Kotlin, Python)
- Dependency manifests are parsed and validated deterministically

### LLMs as Assistants, Not Source of Truth

The LLM provides suggestions and explanations, but the system doesn't blindly trust its outputs:
- **Schema validation** — All LLM responses are validated against Zod schemas
- **Fallback mode** — If LLM fails or is unavailable, the system uses deterministic pattern matching
- **Transparency** — Analysis includes indicators when fallback was used

### Production-Minded Tooling

- Graceful degradation ensures tools always work
- Structured JSON output (never free-form blobs)
- Clear error handling and descriptive messages

---

## Tools

### 1. Log & Incident Analyzer
**Input:** Raw application logs, stack traces  
**Analysis:** Normalizes logs, groups similar errors, identifies root causes  
**Output:** Structured JSON with error groups, probable causes, suggested actions

### 2. API Contract Reviewer
**Input:** REST request/response JSON, OpenAPI specs  
**Analysis:** Identifies missing fields, inconsistent error models, breaking changes  
**Output:** Contract issues, inconsistencies, best practice recommendations

### 3. Resilience Strategy Advisor
**Input:** Failure scenario descriptions  
**Analysis:** Recommends resilience patterns  
**Output:** Retry strategies, idempotency guidance, circuit breaker config, what NOT to retry

### 4. Backend Code Risk Scanner
**Input:** JavaScript, TypeScript, Java, Kotlin, or Python code  
**Analysis:** AST-based static analysis for JavaScript (via @babel/parser), structural parsing for other languages  
**Detection:** Undeclared variables, unsafe property access, blocking I/O, resource leaks, empty catch blocks, null safety risks  
**Output:** Risk categorization by severity and line number, with best practices recommendations

### 5. System Design Reviewer
**Input:** System design descriptions  
**Analysis:** Identifies architectural concerns  
**Output:** Bottlenecks, single points of failure, scalability concerns, observability gaps

### 6. Dependency Risk & Vulnerability Analyzer
**Input:** Dependency manifests (pom.xml, package.json, build.gradle)  
**Analysis:** Detects known vulnerable libraries, unpinned versions, supply-chain risks  
**Output:** Risk list with severity, per-dependency breakdown, actionable recommendations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React + Vite)                      │
│  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │ Tool Input  │  │ Structured Analysis │  │ LLM Insights Panel  │  │
│  │ Panel       │  │ (Deterministic)     │  │ (AI-Assisted)       │  │
│  └─────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                          Three-Column Layout                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Backend (Express.js 5)                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ API Routes   │──│ Tool Services    │──│ LLM Service            │ │
│  │ (Zod valid.) │  │ (AST Analysis)   │  │ (HF API + Fallback)    │ │
│  └──────────────┘  └──────────────────┘  └────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│                    ┌─────────────────┐                              │
│                    │ In-Memory Store │                              │
│                    │ (Analysis Cache)│                              │
│                    └─────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **Log Parser** | `server/log-parser.ts` | Parse multiple log formats, extract levels/sources, group errors |
| **LLM Service** | `server/llm-service.ts` | Hugging Face API integration with fallback |
| **Tool Services** | `server/tool-services.ts` | Unified LLM interface for all 5 tools (API review, resilience, system design, dependencies) |
| **AST Analyzer** | `server/ast-analyzer.ts` | JavaScript/TypeScript AST parsing via Babel, structural analysis for Java/Kotlin/Python |
| **API Routes** | `server/routes.ts` | RESTful endpoints with Zod validation |
| **Email Service** | `server/email-service.ts` | Contact form delivery via Resend |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with API key status |
| `/api/analyze` | POST | Log & Incident Analyzer |
| `/api/tools/api-review` | POST | API Contract Reviewer |
| `/api/tools/resilience-advice` | POST | Resilience Strategy Advisor |
| `/api/tools/code-scan` | POST | Backend Code Risk Scanner |
| `/api/tools/system-review` | POST | System Design Reviewer |
| `/api/tools/dependency-analyze` | POST | Dependency Risk Analyzer |
| `/api/contact` | POST | Contact form submission |

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for bundling and HMR
- **TanStack Query** for server state management
- **Tailwind CSS** with dark mode support
- **Shadcn/ui** component library (Radix UI primitives)
- **Wouter** for client-side routing

### Backend
- **Express.js 5** with TypeScript
- **Zod** for request/response validation
- **Babel** (@babel/parser, @babel/traverse) for JavaScript AST analysis

### LLM Integration
- **Hugging Face Inference API** — Mixtral-8x7B-Instruct-v0.1 model
- Deterministic fallback when API unavailable

### Email
- **Resend** for contact form notifications

---

## Local Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/backend-systems-intelligence-studio.git
cd backend-systems-intelligence-studio

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required for AI-powered analysis (free tier available)
HUGGINGFACE_API_KEY=hf_your_api_token_here

# Optional: Override contact form recipient
CONTACT_EMAIL=your-email@example.com
```

**Getting a Hugging Face API Key:**
1. Create account at [huggingface.co](https://huggingface.co)
2. Generate API token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. Use "Read" access level (free tier is sufficient)

### Running Locally

```bash
# Development mode (with hot reload)
npm run dev

# The app runs on http://localhost:5000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HUGGINGFACE_API_KEY` | Yes* | — | Hugging Face API token for LLM analysis |
| `CONTACT_EMAIL` | No | morthalasharath@gmail.com | Contact form recipient |
| `PORT` | No | 5000 | Server port |
| `NODE_ENV` | No | development | Environment mode |

*Without `HUGGINGFACE_API_KEY`, the app still works using deterministic fallback analysis.

### Switching LLM Providers

To use a different LLM provider, modify `server/llm-service.ts` and `server/tool-services.ts`:

1. **OpenAI**: Update API endpoint and prompt format
2. **Anthropic**: Modify request/response handling for Claude API
3. **Local LLM**: Use Ollama or similar with local endpoint

---

## Documentation

For detailed documentation, see the [`/docs`](./docs) folder:

- **[TOOLS.md](./docs/TOOLS.md)** — Detailed guide for each analysis tool
- **[DESIGN.md](./docs/DESIGN.md)** — Architectural decisions and trade-offs
- **[LIMITATIONS.md](./docs/LIMITATIONS.md)** — Known limitations and what this is not
- **[ROADMAP.md](./docs/ROADMAP.md)** — Potential future improvements

---

## Production Notes

### What This Is

- A **portfolio demonstration** of backend engineering skills
- A **learning tool** for understanding production patterns
- A **starting point** for building similar analysis tools

### What This Is Not

- **Not a replacement** for enterprise vulnerability scanners (e.g., Snyk, Dependabot)
- **Not a CI/CD tool** — designed for interactive analysis
- **Not a security audit** — highlights patterns, not guarantees

### Scaling Considerations

For production deployment at scale:

| Concern | Current | Production Recommendation |
|---------|---------|---------------------------|
| **Storage** | In-memory | PostgreSQL for persistence |
| **Caching** | None | Redis for analysis caching |
| **Queue** | Sync | Bull/BullMQ for async processing |
| **Logging** | Console | Structured JSON + correlation IDs |
| **Metrics** | None | Prometheus + Grafana |
| **Tracing** | None | OpenTelemetry |

---

## Project Structure

```
├── client/                  # Frontend (React + Vite)
│   └── src/
│       ├── components/      # Reusable UI components
│       │   └── ui/          # Shadcn/ui primitives
│       ├── pages/           # Route pages
│       │   └── tools/       # Individual tool pages
│       ├── hooks/           # Custom React hooks
│       └── lib/             # Utilities and query client
├── server/                  # Backend (Express.js)
│   ├── routes.ts            # API endpoint definitions
│   ├── log-parser.ts        # Log parsing and error grouping
│   ├── llm-service.ts       # Hugging Face integration
│   ├── tool-services.ts     # Tool-specific LLM prompts
│   ├── ast-analyzer.ts      # JavaScript AST analysis
│   ├── email-service.ts     # Resend email integration
│   └── storage.ts           # In-memory storage
├── shared/                  # Shared types and schemas
│   └── schema.ts            # Zod schemas for validation
├── docs/                    # Additional documentation
└── public/                  # Static assets
```

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

## Author

**Sharath Morthala**  
Backend & Platform Engineer

- GitHub: [github.com/yourusername](https://github.com/yourusername)
- LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)

---

*LLMs are used as assistants. Deterministic backend logic remains the source of truth.*
