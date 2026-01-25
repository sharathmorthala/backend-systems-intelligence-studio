# Known Limitations

Transparency about what this project can and cannot do.

---

## General Limitations

### Portfolio Project, Not Production Service

This is a demonstration of engineering skills, not a production-ready SaaS:

- **No authentication** — Anyone can access all tools
- **No persistence** — Analysis history lost on restart
- **No rate limiting** — No protection against abuse
- **Single instance** — No horizontal scaling

### LLM Dependency

AI-powered insights require:
- Valid Hugging Face API key
- Network connectivity to Hugging Face servers
- Available model (Mixtral-8x7B-Instruct-v0.1)

**Mitigation:** Deterministic fallback analysis ensures basic functionality without LLM.

### Free Tier Constraints

Hugging Face free tier has:
- Rate limits (requests per minute)
- Model loading delays (cold starts)
- Occasional 503 errors during high traffic

---

## Tool-Specific Limitations

### Log & Incident Analyzer

- **Log format assumptions**: Works best with standard formats (ISO timestamps, bracketed sources)
- **No custom parsers**: Can't define custom log patterns
- **Memory limits**: Very large log files (>10MB) may cause issues

### API Contract Reviewer

- **No schema linking**: Can't automatically fetch OpenAPI specs by URL
- **Manual input**: Must paste JSON/YAML directly
- **No versioning**: Can't compare spec versions

### Resilience Strategy Advisor

- **Generic advice**: Recommendations are patterns, not implementation code
- **No code generation**: Doesn't produce runnable circuit breaker code
- **Context limitations**: Doesn't know your specific infrastructure

### Backend Code Risk Scanner

| Language | Limitation |
|----------|------------|
| JavaScript/TypeScript | AST parsing is accurate but slow for very large files |
| Java | Regex-based, may miss complex patterns |
| Kotlin | Regex-based, limited null-safety analysis |
| Python | Regex-based, no full AST parsing |

**Not detected:**
- Logic errors
- Security vulnerabilities beyond patterns
- Performance issues
- Test coverage gaps

### System Design Reviewer

- **Text-based only**: Can't analyze diagrams or code
- **Subjective assessment**: Recommendations may not fit all contexts
- **No quantitative analysis**: Can't measure actual performance

### Dependency Risk Analyzer

**Critical limitation:** This is pattern-based, not a vulnerability database.

- No CVE database queries
- No SBOM generation
- No transitive dependency analysis
- No automatic updates

**Use for:** Quick risk indicators
**Don't use for:** Compliance, security audits, CI/CD gates

---

## Technical Limitations

### Browser Support

Tested on:
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

May not work on:
- Internet Explorer
- Very old mobile browsers

### Input Size Limits

- Log files: ~5MB practical limit
- Code files: ~1MB practical limit
- Request body: 10MB max (Express default)

### Concurrency

- Single-threaded Node.js
- No request queuing
- Blocking on LLM calls

---

## What This Is Not

| This Is | This Is Not |
|---------|-------------|
| Learning/portfolio tool | Production security scanner |
| Pattern highlighter | Vulnerability database |
| Starting point | Complete solution |
| Demonstration | Enterprise software |

---

## Recommended Complements

For production use, combine with:

| Need | Recommended Tool |
|------|------------------|
| Dependency vulnerabilities | Snyk, Dependabot, OWASP Dependency-Check |
| Code security | SonarQube, CodeQL, Semgrep |
| Log analysis | ELK Stack, Datadog, Splunk |
| API testing | Postman, Insomnia, Hoppscotch |
| System observability | Prometheus, Grafana, Jaeger |
