# Tool Documentation

Detailed documentation for each of the 6 backend analysis tools.

---

## 1. Log & Incident Analyzer

### Purpose
Analyze application logs and stack traces to identify patterns, group similar errors, and suggest investigation steps.

### Input Format
Plain text logs in common formats:
- ISO 8601 timestamps: `2024-01-23T10:15:32.123Z ERROR [Service] Message`
- Common log format: `[2024-01-23 10:15:32] ERROR: Message`
- Stack traces with exception types

### How It Works

1. **Parsing**: The log parser (`server/log-parser.ts`) extracts:
   - Timestamps (normalized to ISO format)
   - Log levels (ERROR, WARN, INFO, DEBUG)
   - Source/service names
   - Messages and stack traces

2. **Error Grouping**: Similar errors are grouped by:
   - Exception type
   - Message pattern similarity
   - Stack trace fingerprinting

3. **Analysis**: The LLM analyzes patterns to provide:
   - Root cause hypotheses with confidence levels
   - Missing context that would help debugging
   - Recommended investigation steps

### Example

**Input:**
```
2024-01-23T10:15:32.123Z ERROR [PaymentService] Failed to process payment
java.lang.NullPointerException: Cannot invoke method on null object
    at com.example.PaymentProcessor.process(PaymentProcessor.java:42)
```

**Output:**
- Parsed log entry with level, source, message
- Error group: NullPointerException in PaymentProcessor
- Root cause: Uninitialized dependency injection
- Recommendation: Add null checks, review initialization order

---

## 2. API Contract Reviewer

### Purpose
Review REST API request/response pairs and OpenAPI specs for contract issues.

### Input Format
- JSON request/response pairs
- OpenAPI/Swagger specifications (YAML or JSON)

### What It Detects

- **Missing Fields**: Required fields absent from responses
- **Type Mismatches**: Field types don't match spec
- **Inconsistent Errors**: Error responses vary unexpectedly
- **Breaking Changes**: Changes that would break clients
- **Best Practice Violations**: Missing content-types, improper status codes

### Example

**Input:**
```json
{
  "request": {
    "method": "POST",
    "path": "/api/users",
    "body": {"name": "John"}
  },
  "response": {
    "status": 200,
    "body": {"id": 123}
  }
}
```

**Issues Found:**
- POST should return 201 Created, not 200
- Response missing `name` field (echo pattern)
- No Content-Type header specified

---

## 3. Resilience Strategy Advisor

### Purpose
Get recommendations for handling failure scenarios with appropriate resilience patterns.

### Input Format
Describe a failure scenario in plain text:
- "Payment gateway times out during checkout"
- "Database connection pool exhausted"
- "Third-party API returns 503"

### Patterns Recommended

- **Retry Strategies**: Exponential backoff, jitter, max attempts
- **Circuit Breakers**: Thresholds, recovery time, fallback behavior
- **Idempotency**: Keys, deduplication, safe operations
- **Timeouts**: Connection vs. read timeouts, cascading limits
- **Bulkheads**: Resource isolation, queue limits

### What NOT to Retry

The advisor also identifies scenarios where retries are dangerous:
- Non-idempotent operations without idempotency keys
- Authentication failures (credentials won't magically become valid)
- Validation errors (input won't fix itself)
- Rate limit errors without proper backoff

---

## 4. Backend Code Risk Scanner

### Purpose
Scan backend code for risk patterns, potential bugs, and security concerns.

### Supported Languages

| Language | Analysis Method |
|----------|-----------------|
| JavaScript/TypeScript | Full AST parsing via @babel/parser |
| Java | Structural parsing with context-aware regex |
| Kotlin | Structural parsing with context-aware regex |
| Python | Structural parsing with context-aware regex |

### What It Detects

**JavaScript/TypeScript:**
- Undeclared variables (tracks declarations vs. usage)
- Unsafe property access chains (`user.settings.id` without null checks)
- Blocking synchronous calls (`readFileSync`, `execSync`)
- Empty catch blocks

**Java/Kotlin:**
- Blocking network calls (`.execute()`)
- Resource leaks (Response without try-with-resources)
- Missing HTTP status validation (no `isSuccessful()` check)
- Null safety risks (`.body().string()` without null check)

**Python:**
- Broad `except` clauses (`except Exception:`)
- Bare `except:` statements
- Blocking calls in async context

### Risk Levels

- **High**: Likely causes runtime errors or security issues
- **Medium**: Could cause issues under certain conditions
- **Low**: Best practice violations, maintainability concerns

### Disclaimer

This tool highlights potential risk patterns—not guaranteed failures. It complements static analysis tools; it does not replace them.

---

## 5. System Design Reviewer

### Purpose
Review system design descriptions for architectural concerns.

### Input Format
Plain text description of system architecture:
- Component interactions
- Data flow
- Technology choices
- Scaling approach

### What It Identifies

- **Bottlenecks**: Single points of contention
- **Single Points of Failure**: Unredundant critical paths
- **Scalability Concerns**: Horizontal vs. vertical limits
- **Observability Gaps**: Missing logs, metrics, traces
- **Data Consistency**: CAP theorem trade-offs
- **Security Concerns**: Exposed surfaces, authentication gaps

### Example

**Input:**
```
User requests go to a single API server. The server queries 
a MySQL database directly. Results are cached in a local 
HashMap. Background jobs run on the same server.
```

**Findings:**
- Single API server = single point of failure
- No load balancing mentioned
- Local cache not shared across instances (won't scale)
- Background jobs compete with request processing
- No mention of connection pooling

---

## 6. Dependency Risk & Vulnerability Analyzer

### Purpose
Analyze dependency manifests for vulnerability indicators and supply-chain risks.

### Supported Formats

- `package.json` (npm/Node.js)
- `pom.xml` (Maven/Java)
- `build.gradle` (Gradle/Java/Kotlin)

### What It Detects

- **Known Vulnerable Libraries**: Common CVE indicators
- **Unpinned Versions**: `^`, `~`, `*`, `latest` ranges
- **Outdated Major Versions**: Known old versions
- **Suspicious Patterns**: Typosquatting indicators
- **Supply-Chain Risks**: Excessive dependencies, unknown sources

### Risk Levels

- **Critical**: Known high-severity CVEs
- **High**: Suspected vulnerabilities, unpinned majors
- **Medium**: Outdated versions, loose ranges
- **Low**: Best practice suggestions

### Disclaimer

This analyzer highlights dependency risk patterns and known indicators. It is **not a replacement** for enterprise vulnerability scanners (Snyk, Dependabot, OWASP Dependency-Check) or continuous security tooling.

---

## Common Patterns

All tools share these characteristics:

1. **Three-Column Layout**: Input | Structured Analysis | LLM Insights
2. **Deterministic First**: Core analysis happens in code, not LLM
3. **Fallback Mode**: Works without LLM (reduced insights)
4. **Structured Output**: JSON with Zod validation
5. **Export Support**: PDF export for reporting
