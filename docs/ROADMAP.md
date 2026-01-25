# Future Roadmap

Potential improvements if this project evolves beyond portfolio scope.

---

## Short Term (If Continuing Development)

### Enhanced Analysis

- [ ] **Multi-model support** — OpenAI, Anthropic, Ollama integration
- [ ] **Streaming responses** — Show LLM output as it generates
- [ ] **Analysis history** — PostgreSQL persistence for past analyses
- [ ] **Export formats** — JSON, Markdown, CSV in addition to PDF

### Code Scanner Improvements

- [ ] **Full Python AST** — Replace regex with `ast` module parsing
- [ ] **Java AST** — Integrate tree-sitter or similar
- [ ] **Custom rules** — User-defined detection patterns
- [ ] **Severity tuning** — Configure what matters for your codebase

### UX Enhancements

- [ ] **File upload** — Drag-and-drop for logs, code, manifests
- [ ] **Keyboard shortcuts** — Power user productivity
- [ ] **Saved templates** — Reuse common analysis configurations
- [ ] **Comparison view** — Diff two analyses side by side

---

## Medium Term (Production Path)

### Infrastructure

- [ ] **Database** — PostgreSQL via Drizzle ORM (schema ready)
- [ ] **Caching** — Redis for repeated analysis patterns
- [ ] **Queue** — Bull/BullMQ for async processing
- [ ] **CDN** — Static asset optimization

### Reliability

- [ ] **Rate limiting** — Protect against abuse
- [ ] **Circuit breaker** — For LLM API calls
- [ ] **Health checks** — Kubernetes-ready probes
- [ ] **Graceful shutdown** — Drain connections properly

### Observability

- [ ] **Structured logging** — JSON with correlation IDs
- [ ] **Metrics** — Prometheus exposition format
- [ ] **Tracing** — OpenTelemetry instrumentation
- [ ] **Alerting** — PagerDuty/Opsgenie integration

### Security

- [ ] **Authentication** — OAuth2/OIDC support
- [ ] **Authorization** — Role-based access
- [ ] **Audit logging** — Track who analyzed what
- [ ] **Input sanitization** — Enhanced XSS/injection prevention

---

## Long Term (SaaS Vision)

### Multi-Tenancy

- [ ] **Workspaces** — Team/organization isolation
- [ ] **API keys** — Programmatic access
- [ ] **Webhooks** — Integration with CI/CD pipelines
- [ ] **SSO** — Enterprise identity providers

### Advanced Features

- [ ] **Custom LLM prompts** — User-tunable analysis behavior
- [ ] **Learning mode** — Improve from user feedback
- [ ] **Integration marketplace** — Connect to GitHub, GitLab, Jira
- [ ] **Scheduled analysis** — Periodic dependency scans

### Platform Extensions

- [ ] **CLI tool** — Analyze from terminal
- [ ] **VS Code extension** — In-editor risk scanning
- [ ] **GitHub Action** — PR analysis automation
- [ ] **Slack/Teams bot** — Incident analysis from chat

---

## Non-Goals

Things this project will **not** become:

- **Full IDE** — Not replacing VS Code
- **CI/CD system** — Not replacing GitHub Actions
- **APM tool** — Not replacing Datadog
- **Ticketing system** — Not replacing Jira

The focus remains: **Backend analysis tooling with responsible AI integration**.

---

## Contributing

If you'd like to contribute to any of these improvements:

1. Open an issue describing the feature
2. Discuss approach before implementing
3. Follow existing code conventions
4. Include tests where applicable
5. Update documentation

---

*This roadmap reflects potential directions, not commitments. Priorities depend on interest and use cases.*
