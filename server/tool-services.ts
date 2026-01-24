import { randomUUID } from "crypto";

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1";

interface LLMResponse {
  generated_text: string;
}

async function callLLM(prompt: string): Promise<string | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    console.warn("HUGGINGFACE_API_KEY not found");
    return null;
  }

  try {
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1500,
          temperature: 0.3,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Hugging Face API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as LLMResponse[] | LLMResponse;
    return Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
  } catch (error) {
    console.error("LLM call failed:", error);
    return null;
  }
}

function parseJSON(text: string): any {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// API Contract Reviewer
export interface ApiReviewResult {
  missingFields: string[];
  inconsistencies: string[];
  breakingChangeRisks: string[];
  bestPractices: string[];
  summary: string;
}

export async function reviewApiContract(apiContract: string): Promise<ApiReviewResult> {
  const prompt = `<s>[INST] You are a senior API designer reviewing REST API contracts.

Analyze this API contract and identify issues:

${apiContract}

Respond with JSON only:
{
  "missingFields": ["list of missing required fields or headers"],
  "inconsistencies": ["list of inconsistencies in the API design"],
  "breakingChangeRisks": ["list of potential breaking change risks"],
  "bestPractices": ["list of REST best practice recommendations"],
  "summary": "2-3 sentence summary of the API quality"
}

JSON only, no markdown. [/INST]</s>`;

  const llmResponse = await callLLM(prompt);
  if (llmResponse) {
    const parsed = parseJSON(llmResponse);
    if (parsed) {
      return {
        missingFields: parsed.missingFields || [],
        inconsistencies: parsed.inconsistencies || [],
        breakingChangeRisks: parsed.breakingChangeRisks || [],
        bestPractices: parsed.bestPractices || [],
        summary: parsed.summary || "Analysis completed.",
      };
    }
  }

  // Fallback analysis
  return generateApiReviewFallback(apiContract);
}

function generateApiReviewFallback(apiContract: string): ApiReviewResult {
  const lower = apiContract.toLowerCase();
  const missingFields: string[] = [];
  const inconsistencies: string[] = [];
  const breakingChangeRisks: string[] = [];
  const bestPractices: string[] = [];

  // Check for common missing fields
  if (!lower.includes("content-type")) {
    missingFields.push("Content-Type header not specified");
  }
  if (!lower.includes("error") && lower.includes("response")) {
    missingFields.push("Error response format not defined");
  }
  if (!lower.includes("pagination") && (lower.includes("list") || lower.includes("array"))) {
    missingFields.push("Pagination not defined for list endpoints");
  }

  // Check for inconsistencies
  if (lower.includes("200") && lower.includes("post") && !lower.includes("201")) {
    inconsistencies.push("POST requests typically return 201 Created, not 200 OK");
  }
  if (lower.includes("id") && lower.includes("_id")) {
    inconsistencies.push("Inconsistent ID field naming (id vs _id)");
  }

  // Check for breaking change risks
  if (lower.includes("required") || lower.includes("mandatory")) {
    breakingChangeRisks.push("Adding required fields to requests could break existing clients");
  }
  if (lower.includes("remove") || lower.includes("deprecate")) {
    breakingChangeRisks.push("Removing fields from responses could break clients");
  }

  // Best practices
  bestPractices.push("Consider using semantic versioning in API paths (e.g., /v1/users)");
  bestPractices.push("Include rate limiting headers in responses (X-RateLimit-*)");
  bestPractices.push("Use consistent date formats (ISO 8601) across all endpoints");

  return {
    missingFields,
    inconsistencies,
    breakingChangeRisks,
    bestPractices,
    summary: `Analyzed API contract. Found ${missingFields.length} missing fields, ${inconsistencies.length} inconsistencies, and ${breakingChangeRisks.length} potential breaking change risks.`,
  };
}

// Resilience Strategy Advisor
export interface ResilienceResult {
  retryStrategy: {
    recommendation: string;
    maxRetries: number;
    backoffType: string;
    initialDelay: string;
  };
  idempotency: {
    recommendation: string;
    keyStrategy: string;
    storageApproach: string;
  };
  circuitBreaker: {
    recommendation: string;
    threshold: string;
    timeout: string;
    halfOpenRequests: number;
  };
  doNotRetry: string[];
  summary: string;
}

export async function getResilienceAdvice(scenario: string): Promise<ResilienceResult> {
  const prompt = `<s>[INST] You are a reliability engineer advising on resilience patterns.

Analyze this failure scenario and provide recommendations:

${scenario}

Respond with JSON only:
{
  "retryStrategy": {
    "recommendation": "explanation of retry approach",
    "maxRetries": 3,
    "backoffType": "exponential|linear|constant",
    "initialDelay": "100ms|500ms|1s"
  },
  "idempotency": {
    "recommendation": "how to ensure idempotency",
    "keyStrategy": "request-id|hash|composite",
    "storageApproach": "redis|database|memory"
  },
  "circuitBreaker": {
    "recommendation": "circuit breaker guidance",
    "threshold": "50% failures in 10s",
    "timeout": "30s",
    "halfOpenRequests": 3
  },
  "doNotRetry": ["list of scenarios that should NOT be retried"],
  "summary": "2-3 sentence summary"
}

JSON only. [/INST]</s>`;

  const llmResponse = await callLLM(prompt);
  if (llmResponse) {
    const parsed = parseJSON(llmResponse);
    if (parsed) {
      return {
        retryStrategy: {
          recommendation: parsed.retryStrategy?.recommendation || "Implement exponential backoff with jitter",
          maxRetries: parsed.retryStrategy?.maxRetries || 3,
          backoffType: parsed.retryStrategy?.backoffType || "exponential",
          initialDelay: parsed.retryStrategy?.initialDelay || "100ms",
        },
        idempotency: {
          recommendation: parsed.idempotency?.recommendation || "Use idempotency keys for mutation operations",
          keyStrategy: parsed.idempotency?.keyStrategy || "request-id",
          storageApproach: parsed.idempotency?.storageApproach || "redis",
        },
        circuitBreaker: {
          recommendation: parsed.circuitBreaker?.recommendation || "Implement circuit breaker for external calls",
          threshold: parsed.circuitBreaker?.threshold || "50% failures",
          timeout: parsed.circuitBreaker?.timeout || "30s",
          halfOpenRequests: parsed.circuitBreaker?.halfOpenRequests || 3,
        },
        doNotRetry: parsed.doNotRetry || [],
        summary: parsed.summary || "Analysis completed.",
      };
    }
  }

  return generateResilienceFallback(scenario);
}

function generateResilienceFallback(scenario: string): ResilienceResult {
  const lower = scenario.toLowerCase();
  const doNotRetry: string[] = [];

  if (lower.includes("payment") || lower.includes("charge") || lower.includes("transaction")) {
    doNotRetry.push("Payment confirmations - may result in double charges");
    doNotRetry.push("Successful transactions - already completed");
  }
  if (lower.includes("email") || lower.includes("notification")) {
    doNotRetry.push("Successfully sent notifications - duplicate messages");
  }
  doNotRetry.push("4xx client errors - request is invalid");
  doNotRetry.push("Authentication failures - credentials won't change");
  doNotRetry.push("Resource not found (404) - resource still won't exist");

  const hasPayment = lower.includes("payment") || lower.includes("stripe") || lower.includes("charge");
  const hasTimeout = lower.includes("timeout");
  const hasRetry = lower.includes("retry");

  return {
    retryStrategy: {
      recommendation: hasPayment 
        ? "Use very conservative retry strategy with idempotency keys to prevent duplicate payments"
        : "Implement exponential backoff with jitter to prevent thundering herd",
      maxRetries: hasPayment ? 2 : 3,
      backoffType: "exponential",
      initialDelay: hasTimeout ? "500ms" : "100ms",
    },
    idempotency: {
      recommendation: hasPayment
        ? "Critical: Generate unique idempotency key per payment attempt, store in database with payment status"
        : "Include idempotency key header for all mutation operations",
      keyStrategy: hasPayment ? "composite" : "request-id",
      storageApproach: hasPayment ? "database" : "redis",
    },
    circuitBreaker: {
      recommendation: "Open circuit after consecutive failures to prevent cascade failures and allow recovery",
      threshold: "5 failures in 30s",
      timeout: hasTimeout ? "60s" : "30s",
      halfOpenRequests: 3,
    },
    doNotRetry,
    summary: `Analyzed scenario for resilience patterns. ${hasPayment ? "Payment scenarios require extra care with idempotency." : ""} Recommended exponential backoff with circuit breaker protection.`,
  };
}

// Code Risk Scanner
export interface CodeRisk {
  line: number;
  type: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface CodeScanResult {
  blockingCalls: CodeRisk[];
  threadSafetyRisks: CodeRisk[];
  errorHandlingGaps: CodeRisk[];
  performanceConcerns: CodeRisk[];
  bestPractices: string[];
  summary: string;
  llmInsights: string | null;
  usedFallback: boolean;
}

// Deterministic risk detection - runs BEFORE LLM
function detectCodeRisksDeterministic(code: string): {
  blockingCalls: CodeRisk[];
  threadSafetyRisks: CodeRisk[];
  errorHandlingGaps: CodeRisk[];
  performanceConcerns: CodeRisk[];
} {
  const lines = code.split('\n');
  const blockingCalls: CodeRisk[] = [];
  const threadSafetyRisks: CodeRisk[] = [];
  const errorHandlingGaps: CodeRisk[] = [];
  const performanceConcerns: CodeRisk[] = [];
  
  // Track context for multi-line analysis
  let hasResponseAssignment = false;
  let responseAssignmentLine = 0;
  let hasTryWithResources = false;
  let hasExecuteCall = false;
  let executeCallLine = 0;
  let hasStatusCheck = false;
  let hasBodyStringCall = false;
  let bodyStringLine = 0;
  
  // First pass: gather context
  lines.forEach((line, i) => {
    const lineNum = i + 1;
    
    // Check for try-with-resources
    if (/try\s*\(/.test(line)) {
      hasTryWithResources = true;
    }
    
    // Rule 1: Blocking network call - .execute() on HTTP client
    if (/\.execute\s*\(/.test(line)) {
      hasExecuteCall = true;
      executeCallLine = lineNum;
      blockingCalls.push({
        line: lineNum,
        type: "Blocking I/O",
        description: "Blocking network call detected. This may cause thread starvation under load or when executed on request or event-loop threads.",
        severity: "high"
      });
    }
    
    // Rule 2: Resource leak - Response response = without try-with-resources
    if (/Response\s+\w+\s*=/.test(line)) {
      hasResponseAssignment = true;
      responseAssignmentLine = lineNum;
    }
    
    // Rule 3: Missing status validation
    if (/\.isSuccessful\s*\(/.test(line) || /\.code\s*\(/.test(line) || /response\.code/.test(line) || /status\s*[=!]=/.test(line.toLowerCase())) {
      hasStatusCheck = true;
    }
    
    // Rule 4: Null safety - response.body().string()
    if (/\.body\s*\(\s*\)\s*\.string\s*\(/.test(line) || /\.body\s*\(\s*\)\s*\.bytes\s*\(/.test(line)) {
      hasBodyStringCall = true;
      bodyStringLine = lineNum;
      errorHandlingGaps.push({
        line: lineNum,
        type: "Null Safety",
        description: "Response body accessed without null check. Response body may be null.",
        severity: "medium"
      });
    }
  });
  
  // Second pass: line-by-line analysis for other patterns
  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const lower = line.toLowerCase();

    // Additional blocking call patterns
    if (/\.get\s*\(\s*\)/.test(line) && !lower.includes("optional") && !lower.includes("map.get") && !lower.includes("list.get")) {
      blockingCalls.push({
        line: lineNum,
        type: "Blocking Future",
        description: "Blocking .get() call on Future without timeout. Consider using get(timeout, unit) or async handling.",
        severity: "high"
      });
    }
    if (/Thread\.sleep/.test(line)) {
      blockingCalls.push({
        line: lineNum,
        type: "Thread Sleep",
        description: "Thread.sleep() blocks the current thread. Avoid in request handlers or event loops.",
        severity: "medium"
      });
    }
    if (/\.wait\s*\(\s*\)/.test(line)) {
      blockingCalls.push({
        line: lineNum,
        type: "Object Wait",
        description: "Object.wait() without timeout may block indefinitely.",
        severity: "high"
      });
    }
    if (/\.join\s*\(\s*\)/.test(line) && !lower.includes("string")) {
      blockingCalls.push({
        line: lineNum,
        type: "Thread Join",
        description: "Thread.join() without timeout blocks until thread completes.",
        severity: "medium"
      });
    }

    // Thread safety
    if (/static\s+(?:final\s+)?(?:Map|HashMap|ArrayList|List|Set|HashSet)/.test(line) && !/ConcurrentHashMap|CopyOnWriteArrayList|ConcurrentSkipListSet|Collections\.synchronized/.test(line)) {
      threadSafetyRisks.push({
        line: lineNum,
        type: "Shared Mutable State",
        description: "Static mutable collection is not thread-safe. Consider ConcurrentHashMap or Collections.synchronizedX().",
        severity: "high"
      });
    }
    if (/new\s+HashMap\s*[<(]/.test(line) && !lower.includes("local") && !/private\s+final/.test(lines.slice(Math.max(0, i-5), i).join('\n'))) {
      threadSafetyRisks.push({
        line: lineNum,
        type: "Thread Safety",
        description: "HashMap is not thread-safe for concurrent access. Consider ConcurrentHashMap.",
        severity: "medium"
      });
    }
    if (/SimpleDateFormat/.test(line)) {
      threadSafetyRisks.push({
        line: lineNum,
        type: "Thread Safety",
        description: "SimpleDateFormat is not thread-safe. Use DateTimeFormatter (Java 8+) or ThreadLocal.",
        severity: "medium"
      });
    }
    if (/\+\+\s*\w+|\w+\s*\+\+/.test(line) && /static|shared|volatile/.test(lines.slice(Math.max(0, i-10), i).join('\n').toLowerCase())) {
      threadSafetyRisks.push({
        line: lineNum,
        type: "Race Condition",
        description: "Increment/decrement on potentially shared variable. Consider AtomicInteger or synchronized block.",
        severity: "high"
      });
    }

    // Error handling gaps
    if (/catch\s*\(\s*Exception\s+\w+\s*\)/.test(line)) {
      errorHandlingGaps.push({
        line: lineNum,
        type: "Generic Exception",
        description: "Catching generic Exception. Consider catching specific exception types for better error handling.",
        severity: "low"
      });
    }
    if (/catch\s*\(/.test(line) && (i + 1 < lines.length)) {
      const nextLines = lines.slice(i + 1, Math.min(i + 4, lines.length)).join(' ');
      if (/^\s*\}\s*$/.test(nextLines.trim()) || /\/\/\s*(ignore|todo|fixme)/i.test(nextLines)) {
        errorHandlingGaps.push({
          line: lineNum,
          type: "Swallowed Exception",
          description: "Exception caught but not handled. This hides errors and makes debugging difficult.",
          severity: "high"
        });
      }
    }
    if (/throws\s+Exception\b/.test(line)) {
      errorHandlingGaps.push({
        line: lineNum,
        type: "Broad Throws",
        description: "Method throws generic Exception. Consider declaring specific checked exceptions.",
        severity: "low"
      });
    }

    // Performance concerns
    if (/for\s*\(.*:.*findAll|findAll.*\.forEach/.test(line) || (/findAll/.test(line) && /stream\s*\(\s*\)/.test(lines.slice(i, Math.min(i + 3, lines.length)).join(' ')))) {
      performanceConcerns.push({
        line: lineNum,
        type: "N+1 Query",
        description: "Possible N+1 query pattern. Consider using JOIN FETCH or batch loading.",
        severity: "high"
      });
    }
    if (/\.toList\s*\(\s*\).*\.forEach|collect.*forEach/.test(line)) {
      performanceConcerns.push({
        line: lineNum,
        type: "Unnecessary Collection",
        description: "Unnecessary intermediate list creation before iteration.",
        severity: "low"
      });
    }
    if (/new\s+String\s*\(.*getBytes/.test(line)) {
      performanceConcerns.push({
        line: lineNum,
        type: "String Allocation",
        description: "Inefficient string encoding/decoding pattern.",
        severity: "low"
      });
    }
  });
  
  // Post-analysis: check for resource leak (Response without try-with-resources)
  if (hasResponseAssignment && !hasTryWithResources) {
    errorHandlingGaps.push({
      line: responseAssignmentLine,
      type: "Resource Leak",
      description: "HTTP response not closed. This can lead to connection leaks and resource exhaustion. Use try-with-resources.",
      severity: "high"
    });
  }
  
  // Post-analysis: check for missing status validation
  if (hasExecuteCall && !hasStatusCheck) {
    errorHandlingGaps.push({
      line: executeCallLine,
      type: "Missing Validation",
      description: "HTTP response status not validated before reading response body. Check isSuccessful() or response code.",
      severity: "medium"
    });
  }

  return { blockingCalls, threadSafetyRisks, errorHandlingGaps, performanceConcerns };
}

function generateBestPractices(risks: {
  blockingCalls: CodeRisk[];
  threadSafetyRisks: CodeRisk[];
  errorHandlingGaps: CodeRisk[];
  performanceConcerns: CodeRisk[];
}): string[] {
  const practices: string[] = [];
  
  if (risks.blockingCalls.some(r => r.type === "Blocking I/O")) {
    practices.push("Use asynchronous HTTP clients (e.g., OkHttp with enqueue(), WebClient, or CompletableFuture) for non-blocking I/O.");
  }
  if (risks.errorHandlingGaps.some(r => r.type === "Resource Leak")) {
    practices.push("Always use try-with-resources for Response objects to ensure proper cleanup.");
  }
  if (risks.errorHandlingGaps.some(r => r.type === "Missing Validation")) {
    practices.push("Check response.isSuccessful() before accessing the response body to handle HTTP errors properly.");
  }
  if (risks.errorHandlingGaps.some(r => r.type === "Null Safety")) {
    practices.push("Always null-check response.body() before calling .string() - the body can be null.");
  }
  if (risks.threadSafetyRisks.length > 0) {
    practices.push("Prefer immutable objects and concurrent collections for shared state in multi-threaded environments.");
  }
  if (risks.blockingCalls.some(r => r.type === "Blocking Future")) {
    practices.push("Use get(timeout, TimeUnit) instead of get() to prevent indefinite blocking on futures.");
  }
  if (risks.performanceConcerns.some(r => r.type === "N+1 Query")) {
    practices.push("Use JOIN FETCH, @EntityGraph, or batch loading strategies to avoid N+1 query problems.");
  }
  
  // Default practices if no specific issues
  if (practices.length === 0) {
    practices.push("No specific issues detected by current ruleset. This does not guarantee correctness.");
    practices.push("Consider running static analysis tools like SpotBugs, PMD, or SonarQube for comprehensive coverage.");
  }
  
  return practices;
}

export async function scanCode(code: string): Promise<CodeScanResult> {
  const lines = code.split('\n');
  
  // STEP 1: Deterministic risk detection (ALWAYS runs first)
  const deterministicRisks = detectCodeRisksDeterministic(code);
  const bestPractices = generateBestPractices(deterministicRisks);
  
  const totalIssues = 
    deterministicRisks.blockingCalls.length + 
    deterministicRisks.threadSafetyRisks.length + 
    deterministicRisks.errorHandlingGaps.length + 
    deterministicRisks.performanceConcerns.length;
  
  const highCount = [
    ...deterministicRisks.blockingCalls,
    ...deterministicRisks.threadSafetyRisks,
    ...deterministicRisks.errorHandlingGaps,
    ...deterministicRisks.performanceConcerns
  ].filter(r => r.severity === "high").length;
  
  const mediumCount = [
    ...deterministicRisks.blockingCalls,
    ...deterministicRisks.threadSafetyRisks,
    ...deterministicRisks.errorHandlingGaps,
    ...deterministicRisks.performanceConcerns
  ].filter(r => r.severity === "medium").length;
  
  const summary = totalIssues > 0
    ? `Scanned ${lines.length} lines of code. Found ${totalIssues} risks: ${highCount} high, ${mediumCount} medium, ${totalIssues - highCount - mediumCount} low severity.`
    : `Scanned ${lines.length} lines of code. No risks detected by current ruleset. This does not guarantee correctness.`;

  // STEP 2: LLM for explanations ONLY (not for detection)
  let llmInsights: string | null = null;
  
  if (totalIssues > 0) {
    const riskSummary = [
      ...deterministicRisks.blockingCalls.map(r => `- Line ${r.line}: ${r.type} - ${r.description}`),
      ...deterministicRisks.threadSafetyRisks.map(r => `- Line ${r.line}: ${r.type} - ${r.description}`),
      ...deterministicRisks.errorHandlingGaps.map(r => `- Line ${r.line}: ${r.type} - ${r.description}`),
      ...deterministicRisks.performanceConcerns.map(r => `- Line ${r.line}: ${r.type} - ${r.description}`),
    ].join('\n');
    
    const prompt = `<s>[INST] You are a senior backend engineer. The following risks were detected in Java/Kotlin code through static analysis:

${riskSummary}

Explain briefly why each detected risk matters in production environments and suggest one best practice for each. Do NOT invent new risks - only explain the ones already detected.

Respond in plain text, not JSON. Keep it concise (2-3 sentences per risk). [/INST]</s>`;

    const llmResponse = await callLLM(prompt);
    if (llmResponse) {
      llmInsights = llmResponse.trim();
    }
  }

  return {
    ...deterministicRisks,
    bestPractices,
    summary,
    llmInsights,
    usedFallback: llmInsights === null
  };
}

// System Design Reviewer
export interface SystemReviewResult {
  bottlenecks: Array<{ component: string; description: string; severity: string }>;
  singlePointsOfFailure: Array<{ component: string; risk: string; mitigation: string }>;
  scalabilityConcerns: Array<{ area: string; description: string; recommendation: string }>;
  observabilityGaps: Array<{ area: string; description: string }>;
  summary: string;
}

export async function reviewSystemDesign(design: string): Promise<SystemReviewResult> {
  const prompt = `<s>[INST] You are a system architect reviewing system designs.

Analyze this system design:

${design}

Respond with JSON only:
{
  "bottlenecks": [{"component": "name", "description": "issue", "severity": "high|medium|low"}],
  "singlePointsOfFailure": [{"component": "name", "risk": "what could fail", "mitigation": "how to fix"}],
  "scalabilityConcerns": [{"area": "area", "description": "issue", "recommendation": "fix"}],
  "observabilityGaps": [{"area": "area", "description": "what's missing"}],
  "summary": "2-3 sentence summary"
}

JSON only. [/INST]</s>`;

  const llmResponse = await callLLM(prompt);
  if (llmResponse) {
    const parsed = parseJSON(llmResponse);
    if (parsed) {
      return {
        bottlenecks: (parsed.bottlenecks || []).map((i: any) => ({
          component: i.component || "Unknown",
          description: i.description || "Bottleneck detected",
          severity: i.severity || "medium",
        })),
        singlePointsOfFailure: (parsed.singlePointsOfFailure || []).map((i: any) => ({
          component: i.component || "Unknown",
          risk: i.risk || "Single point of failure",
          mitigation: i.mitigation || "Add redundancy",
        })),
        scalabilityConcerns: (parsed.scalabilityConcerns || []).map((i: any) => ({
          area: i.area || "Unknown",
          description: i.description || "Scalability concern",
          recommendation: i.recommendation || "Consider horizontal scaling",
        })),
        observabilityGaps: (parsed.observabilityGaps || []).map((i: any) => ({
          area: i.area || "Unknown",
          description: i.description || "Observability gap",
        })),
        summary: parsed.summary || "System design analysis completed.",
      };
    }
  }

  return generateSystemReviewFallback(design);
}

// Dependency Risk & Vulnerability Analyzer
export interface DependencyRisk {
  name: string;
  version: string;
  riskLevel: "high" | "moderate" | "low";
  reason: string;
}

export interface DependencyAnalysisResult {
  detectedRisks: Array<{ issue: string; severity: "high" | "moderate" | "low" }>;
  dependencies: DependencyRisk[];
  recommendations: string[];
  summary: string;
  usedFallback: boolean;
}

interface ParsedDependency {
  name: string;
  version: string;
  hasRange: boolean;
  isUnpinned: boolean;
}

// Known historically vulnerable libraries and patterns
const VULNERABLE_PATTERNS: Record<string, { reason: string; severity: "high" | "moderate" }> = {
  "log4j": { reason: "Historic Log4Shell vulnerability (CVE-2021-44228)", severity: "high" },
  "log4j-core": { reason: "Historic Log4Shell vulnerability (CVE-2021-44228)", severity: "high" },
  "jackson-databind": { reason: "Known deserialization vulnerabilities in older versions", severity: "high" },
  "commons-collections": { reason: "Known deserialization gadget chain vulnerabilities", severity: "high" },
  "struts": { reason: "Historic remote code execution vulnerabilities", severity: "high" },
  "spring-core": { reason: "Check for Spring4Shell (CVE-2022-22965) in versions < 5.3.18", severity: "moderate" },
  "lodash": { reason: "Prototype pollution vulnerabilities in older versions", severity: "moderate" },
  "moment": { reason: "Deprecated; consider date-fns or dayjs", severity: "low" as "moderate" },
  "request": { reason: "Deprecated and unmaintained", severity: "moderate" },
  "event-stream": { reason: "Historic supply-chain attack (2018)", severity: "high" },
  "ua-parser-js": { reason: "Historic supply-chain compromise", severity: "moderate" },
  "node-ipc": { reason: "Historic protestware incident", severity: "high" },
  "colors": { reason: "Historic sabotage incident", severity: "moderate" },
  "faker": { reason: "Unmaintained; author deleted code", severity: "moderate" },
};

function detectManifestType(content: string): "pom" | "gradle" | "npm" | "unknown" {
  if (content.includes("<project") && content.includes("<dependency>")) return "pom";
  if (content.includes("dependencies {") || content.includes("implementation ") || content.includes("compile ")) return "gradle";
  if (content.includes('"dependencies"') || content.includes('"devDependencies"')) return "npm";
  return "unknown";
}

function parsePomDependencies(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  const depRegex = /<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?(?:<version>(.*?)<\/version>)?[\s\S]*?<\/dependency>/g;
  
  let match;
  while ((match = depRegex.exec(content)) !== null) {
    const name = `${match[1]}:${match[2]}`;
    const version = match[3] || "UNSPECIFIED";
    deps.push({
      name,
      version,
      hasRange: version.includes("[") || version.includes("(") || version.includes(","),
      isUnpinned: version === "UNSPECIFIED" || version.includes("LATEST") || version.includes("RELEASE"),
    });
  }
  return deps;
}

function parseGradleDependencies(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  const patterns = [
    /(?:implementation|compile|api|runtimeOnly|testImplementation)\s*['"]([\w.-]+):([\w.-]+):([\w.+-]+)['"]/g,
    /(?:implementation|compile|api|runtimeOnly|testImplementation)\s*group:\s*['"]([\w.-]+)['"],\s*name:\s*['"]([\w.-]+)['"],\s*version:\s*['"]([\w.+-]+)['"]/g,
  ];
  
  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const name = `${match[1]}:${match[2]}`;
      const version = match[3];
      deps.push({
        name,
        version,
        hasRange: version.includes("+") || version.includes("latest"),
        isUnpinned: version === "+" || version.toLowerCase().includes("latest"),
      });
    }
  }
  return deps;
}

function parseNpmDependencies(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  try {
    const pkg = JSON.parse(content);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    for (const [name, version] of Object.entries(allDeps)) {
      const v = String(version);
      deps.push({
        name,
        version: v,
        hasRange: v.includes("^") || v.includes("~") || v.includes(">") || v.includes("<") || v.includes("x") || v.includes("*"),
        isUnpinned: v === "*" || v === "latest" || v.includes("x"),
      });
    }
  } catch {
    // Try regex fallback for malformed JSON
    const regex = /"([\w@/-]+)":\s*"([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const v = match[2];
      deps.push({
        name: match[1],
        version: v,
        hasRange: v.includes("^") || v.includes("~"),
        isUnpinned: v === "*" || v === "latest",
      });
    }
  }
  return deps;
}

function analyzeDependenciesLocal(content: string): { 
  dependencies: DependencyRisk[]; 
  risks: Array<{ issue: string; severity: "high" | "moderate" | "low" }>;
  recommendations: string[];
  summary: string;
} {
  const manifestType = detectManifestType(content);
  let parsed: ParsedDependency[] = [];
  
  switch (manifestType) {
    case "pom": parsed = parsePomDependencies(content); break;
    case "gradle": parsed = parseGradleDependencies(content); break;
    case "npm": parsed = parseNpmDependencies(content); break;
  }
  
  const dependencies: DependencyRisk[] = [];
  const risks: Array<{ issue: string; severity: "high" | "moderate" | "low" }> = [];
  const recommendations: string[] = [];
  
  if (manifestType === "unknown") {
    risks.push({ issue: "Could not detect manifest type (pom.xml, build.gradle, or package.json)", severity: "moderate" });
  }
  
  // Check for lock file indicators
  if (manifestType === "npm" && !content.includes("lockfileVersion")) {
    risks.push({ issue: "No package-lock.json detected - versions may drift between installs", severity: "moderate" });
    recommendations.push("Generate and commit package-lock.json for reproducible builds");
  }
  
  for (const dep of parsed) {
    const shortName = dep.name.split(":").pop()?.toLowerCase() || dep.name.toLowerCase();
    let riskLevel: "high" | "moderate" | "low" = "low";
    let reason = "No known issues detected";
    
    // Check against known vulnerable patterns
    for (const [pattern, info] of Object.entries(VULNERABLE_PATTERNS)) {
      if (shortName.includes(pattern)) {
        riskLevel = info.severity;
        reason = info.reason;
        risks.push({ issue: `${dep.name} - ${info.reason}`, severity: info.severity });
        break;
      }
    }
    
    // Check for unpinned versions
    if (dep.isUnpinned) {
      if (riskLevel === "low") riskLevel = "high";
      reason = reason === "No known issues detected" ? "Unpinned version - may pull unexpected updates" : reason;
      risks.push({ issue: `${dep.name}@${dep.version} uses unpinned version`, severity: "high" });
    } else if (dep.hasRange && riskLevel === "low") {
      riskLevel = "moderate";
      reason = "Version range may allow minor/patch drift";
    }
    
    dependencies.push({ name: dep.name, version: dep.version, riskLevel, reason });
  }
  
  // Add recommendations based on findings
  const highRiskCount = risks.filter(r => r.severity === "high").length;
  const hasUnpinned = parsed.some(d => d.isUnpinned);
  
  if (highRiskCount > 0) {
    recommendations.push("Audit high-risk dependencies immediately and consider upgrading");
  }
  if (hasUnpinned) {
    recommendations.push("Pin all dependency versions to avoid supply-chain risks");
  }
  if (manifestType === "npm") {
    recommendations.push("Run 'npm audit' regularly as part of CI/CD pipeline");
  }
  if (manifestType === "pom" || manifestType === "gradle") {
    recommendations.push("Integrate OWASP Dependency-Check or Snyk into build pipeline");
  }
  if (recommendations.length === 0) {
    recommendations.push("Consider periodic dependency audits as part of security hygiene");
  }
  
  const summary = `Analyzed ${parsed.length} dependencies from ${manifestType} manifest. Found ${highRiskCount} high-risk, ${risks.filter(r => r.severity === "moderate").length} moderate-risk issues.`;
  
  return { dependencies, risks, recommendations, summary };
}

export async function analyzeDependencies(manifest: string): Promise<DependencyAnalysisResult> {
  // Step 1: Deterministic analysis
  const localAnalysis = analyzeDependenciesLocal(manifest);
  
  // Step 2: Try LLM for additional insights
  const prompt = `<s>[INST] You are a security engineer analyzing a dependency manifest for vulnerabilities and supply-chain risks.

Analyze this dependency manifest and provide security insights:

${manifest.substring(0, 3000)}

Based on the dependencies found, provide:
1. Additional security concerns not covered by basic pattern matching
2. Specific upgrade recommendations for risky dependencies
3. Supply-chain risk patterns (stale dependencies, transitive risks)

Respond with JSON only:
{
  "additionalRisks": ["list of additional security concerns"],
  "upgradeGuidance": ["specific upgrade recommendations"],
  "supplyChainInsights": ["supply chain observations"],
  "overallAssessment": "1-2 sentence security posture summary"
}

JSON only. [/INST]</s>`;

  const llmResponse = await callLLM(prompt);
  let usedFallback = true;
  
  if (llmResponse) {
    const parsed = parseJSON(llmResponse);
    if (parsed) {
      usedFallback = false;
      // Merge LLM insights with deterministic analysis
      const additionalRisks = parsed.additionalRisks || [];
      const upgradeGuidance = parsed.upgradeGuidance || [];
      
      for (const risk of additionalRisks) {
        if (!localAnalysis.risks.some(r => r.issue.includes(risk))) {
          localAnalysis.risks.push({ issue: risk, severity: "moderate" });
        }
      }
      
      for (const upgrade of upgradeGuidance) {
        if (!localAnalysis.recommendations.includes(upgrade)) {
          localAnalysis.recommendations.push(upgrade);
        }
      }
      
      if (parsed.overallAssessment) {
        localAnalysis.summary += " " + parsed.overallAssessment;
      }
    }
  }
  
  return {
    detectedRisks: localAnalysis.risks,
    dependencies: localAnalysis.dependencies,
    recommendations: localAnalysis.recommendations,
    summary: localAnalysis.summary,
    usedFallback,
  };
}

function generateSystemReviewFallback(design: string): SystemReviewResult {
  const lower = design.toLowerCase();
  const bottlenecks: SystemReviewResult["bottlenecks"] = [];
  const singlePointsOfFailure: SystemReviewResult["singlePointsOfFailure"] = [];
  const scalabilityConcerns: SystemReviewResult["scalabilityConcerns"] = [];
  const observabilityGaps: SystemReviewResult["observabilityGaps"] = [];

  // Detect bottlenecks
  if (lower.includes("single") && (lower.includes("database") || lower.includes("instance"))) {
    bottlenecks.push({
      component: "Database",
      description: "Single database instance can become a bottleneck under load",
      severity: "high",
    });
  }
  if (lower.includes("synchronous") || lower.includes("synchronously")) {
    bottlenecks.push({
      component: "Service Communication",
      description: "Synchronous calls create tight coupling and can cause cascading delays",
      severity: "medium",
    });
  }
  if (lower.includes("api gateway") && lower.includes("single")) {
    bottlenecks.push({
      component: "API Gateway",
      description: "Single API gateway is a chokepoint for all traffic",
      severity: "high",
    });
  }

  // Single points of failure
  if (lower.includes("single") || !lower.includes("replica")) {
    singlePointsOfFailure.push({
      component: "Database",
      risk: "Database failure causes complete system outage",
      mitigation: "Add read replicas and implement automatic failover",
    });
  }
  if (!lower.includes("load balancer") && !lower.includes("lb")) {
    singlePointsOfFailure.push({
      component: "Application Server",
      risk: "Single server failure causes service unavailability",
      mitigation: "Deploy multiple instances behind a load balancer",
    });
  }
  if (lower.includes("sendgrid") || lower.includes("email") || lower.includes("notification")) {
    singlePointsOfFailure.push({
      component: "Notification Service",
      risk: "External service dependency can cause notification failures",
      mitigation: "Implement queue-based async delivery with retries",
    });
  }

  // Scalability concerns
  if (!lower.includes("cache") && !lower.includes("redis")) {
    scalabilityConcerns.push({
      area: "Caching",
      description: "No caching layer mentioned",
      recommendation: "Add Redis or Memcached for frequently accessed data",
    });
  }
  if (lower.includes("sql") || lower.includes("mysql") || lower.includes("postgres")) {
    scalabilityConcerns.push({
      area: "Database Scaling",
      description: "Relational databases can be difficult to scale horizontally",
      recommendation: "Consider read replicas, sharding, or CQRS pattern",
    });
  }
  if (lower.includes("90%") || lower.includes("80%") || lower.includes("storage")) {
    scalabilityConcerns.push({
      area: "Storage",
      description: "High storage utilization indicates capacity planning needed",
      recommendation: "Plan storage scaling, implement data archival strategy",
    });
  }

  // Observability gaps
  if (!lower.includes("metric") && !lower.includes("prometheus") && !lower.includes("datadog")) {
    observabilityGaps.push({
      area: "Metrics",
      description: "No metrics collection system mentioned",
    });
  }
  if (!lower.includes("trace") && !lower.includes("jaeger") && !lower.includes("zipkin")) {
    observabilityGaps.push({
      area: "Distributed Tracing",
      description: "No distributed tracing for request flow visibility",
    });
  }
  if (!lower.includes("alert") && !lower.includes("pagerduty") && !lower.includes("opsgenie")) {
    observabilityGaps.push({
      area: "Alerting",
      description: "No alerting system mentioned for incident response",
    });
  }

  const totalIssues = bottlenecks.length + singlePointsOfFailure.length + scalabilityConcerns.length + observabilityGaps.length;

  return {
    bottlenecks,
    singlePointsOfFailure,
    scalabilityConcerns,
    observabilityGaps,
    summary: `Analyzed system design. Found ${totalIssues} areas of concern: ${bottlenecks.length} bottlenecks, ${singlePointsOfFailure.length} single points of failure, ${scalabilityConcerns.length} scalability concerns, and ${observabilityGaps.length} observability gaps.`,
  };
}
