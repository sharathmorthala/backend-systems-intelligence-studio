import type { AnalysisResult, LogEntry, ErrorGroup } from "@shared/schema";
import { randomUUID } from "crypto";

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1";

interface LLMResponse {
  generated_text: string;
}

function buildPrompt(logs: LogEntry[], errorGroups: ErrorGroup[]): string {
  const errorSummary = errorGroups.map((g) => 
    `- ${g.label}: ${g.count} occurrences, severity ${g.severity}, sample: "${g.sampleMessage.slice(0, 100)}"`
  ).join("\n");

  const logSummary = logs.slice(0, 20).map((l) =>
    `[${l.level}] ${l.source ? `[${l.source}]` : ""} ${l.message.slice(0, 150)}`
  ).join("\n");

  return `<s>[INST] You are a senior backend engineer analyzing application logs to identify issues and provide recommendations.

Analyze the following log data and provide a structured analysis in JSON format.

ERROR GROUPS:
${errorSummary}

SAMPLE LOGS:
${logSummary}

Provide your analysis as a valid JSON object with this exact structure:
{
  "summary": "Brief 2-3 sentence summary of the overall situation",
  "rootCauses": [
    {
      "id": "unique-id",
      "description": "Description of the probable root cause",
      "confidence": "low" | "medium" | "high",
      "affectedComponents": ["component1", "component2"]
    }
  ],
  "missingContext": [
    {
      "id": "unique-id",
      "description": "What additional information would help",
      "importance": "optional" | "recommended" | "critical"
    }
  ],
  "recommendations": [
    {
      "id": "unique-id",
      "title": "Short action title",
      "description": "Detailed explanation of what to do",
      "priority": "low" | "medium" | "high",
      "category": "investigation" | "mitigation" | "prevention"
    }
  ]
}

Respond ONLY with valid JSON. No markdown, no explanation, just the JSON object. [/INST]</s>`;
}

function parseJSON(text: string): AnalysisResult | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize the structure
    return {
      summary: parsed.summary || "Analysis completed.",
      rootCauses: (parsed.rootCauses || []).map((c: any, i: number) => ({
        id: c.id || randomUUID(),
        description: c.description || "Unknown cause",
        confidence: ["low", "medium", "high"].includes(c.confidence) ? c.confidence : "medium",
        affectedComponents: Array.isArray(c.affectedComponents) ? c.affectedComponents : [],
      })),
      missingContext: (parsed.missingContext || []).map((m: any, i: number) => ({
        id: m.id || randomUUID(),
        description: m.description || "Unknown context",
        importance: ["optional", "recommended", "critical"].includes(m.importance) ? m.importance : "optional",
      })),
      recommendations: (parsed.recommendations || []).map((r: any, i: number) => ({
        id: r.id || randomUUID(),
        title: r.title || "Recommendation",
        description: r.description || "No description provided",
        priority: ["low", "medium", "high"].includes(r.priority) ? r.priority : "medium",
        category: ["investigation", "mitigation", "prevention"].includes(r.category) ? r.category : "investigation",
      })),
    };
  } catch (error) {
    console.error("Failed to parse LLM response:", error);
    return null;
  }
}

export async function analyzeWithLLM(
  logs: LogEntry[],
  errorGroups: ErrorGroup[]
): Promise<{ analysis: AnalysisResult; usedFallback: boolean }> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    console.warn("HUGGINGFACE_API_KEY not found, using fallback analysis");
    return { analysis: generateFallbackAnalysis(logs, errorGroups), usedFallback: true };
  }

  try {
    const prompt = buildPrompt(logs, errorGroups);
    
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
      const errorText = await response.text();
      console.error(`Hugging Face API error: ${response.status} - ${errorText}`);
      
      // Check for rate limiting or model loading
      if (response.status === 429 || response.status === 503) {
        console.warn("API rate limited or model loading, using fallback");
        return { analysis: generateFallbackAnalysis(logs, errorGroups), usedFallback: true };
      }
      
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json() as LLMResponse[] | LLMResponse;
    const generatedText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
    
    if (!generatedText) {
      console.warn("Empty response from LLM, using fallback");
      return { analysis: generateFallbackAnalysis(logs, errorGroups), usedFallback: true };
    }

    const analysis = parseJSON(generatedText);
    
    if (!analysis) {
      console.warn("Failed to parse LLM response, using fallback");
      return { analysis: generateFallbackAnalysis(logs, errorGroups), usedFallback: true };
    }

    return { analysis, usedFallback: false };
  } catch (error) {
    console.error("LLM analysis failed:", error);
    return { analysis: generateFallbackAnalysis(logs, errorGroups), usedFallback: true };
  }
}

// Deterministic fallback analysis when LLM is unavailable
export function generateFallbackAnalysis(
  logs: LogEntry[],
  errorGroups: ErrorGroup[]
): AnalysisResult {
  const errorCount = logs.filter((l) => l.level === "ERROR" || l.level === "FATAL").length;
  const warnCount = logs.filter((l) => l.level === "WARN").length;
  const totalCount = logs.length;

  // Build summary based on data
  let summaryParts: string[] = [];
  summaryParts.push(`Analyzed ${totalCount} log entries.`);
  
  if (errorCount > 0) {
    summaryParts.push(`Found ${errorCount} error${errorCount > 1 ? "s" : ""} across ${errorGroups.length} distinct error pattern${errorGroups.length > 1 ? "s" : ""}.`);
  }
  if (warnCount > 0) {
    summaryParts.push(`${warnCount} warning${warnCount > 1 ? "s" : ""} detected.`);
  }

  // Generate root causes from error groups
  const rootCauses = errorGroups.slice(0, 3).map((group, i) => {
    const components = extractComponents(group.sampleMessage, logs);
    const confidence = group.count >= 3 ? "high" : group.count >= 2 ? "medium" : "low";
    
    return {
      id: randomUUID(),
      description: inferRootCause(group.sampleMessage),
      confidence: confidence as "low" | "medium" | "high",
      affectedComponents: components,
    };
  });

  // Identify missing context
  const missingContext: AnalysisResult["missingContext"] = [];
  
  if (!logs.some((l) => l.message.includes("request_id") || l.message.includes("trace"))) {
    missingContext.push({
      id: randomUUID(),
      description: "Request IDs or distributed tracing context not found in logs",
      importance: "recommended",
    });
  }
  
  if (!logs.some((l) => l.message.includes("user") || l.message.includes("account"))) {
    missingContext.push({
      id: randomUUID(),
      description: "User or account context not present - unable to correlate by user",
      importance: "optional",
    });
  }

  // Generate recommendations
  const recommendations: AnalysisResult["recommendations"] = [];
  
  if (errorGroups.length > 0) {
    const topGroup = errorGroups[0];
    
    recommendations.push({
      id: randomUUID(),
      title: `Investigate ${topGroup.label}`,
      description: `Focus on the most frequent error pattern: "${topGroup.sampleMessage.slice(0, 80)}...". This occurred ${topGroup.count} time(s) and should be prioritized.`,
      priority: topGroup.severity === "critical" || topGroup.severity === "high" ? "high" : "medium",
      category: "investigation",
    });
  }

  // Pattern-specific recommendations
  const hasTimeout = logs.some((l) => l.message.toLowerCase().includes("timeout"));
  const hasConnection = logs.some((l) => l.message.toLowerCase().includes("connection"));
  const hasMemory = logs.some((l) => l.message.toLowerCase().includes("memory") || l.message.toLowerCase().includes("heap"));
  
  if (hasTimeout) {
    recommendations.push({
      id: randomUUID(),
      title: "Review timeout configurations",
      description: "Timeout errors detected. Consider increasing timeout thresholds or implementing circuit breakers for external service calls.",
      priority: "high",
      category: "mitigation",
    });
  }
  
  if (hasConnection) {
    recommendations.push({
      id: randomUUID(),
      title: "Check connection pool settings",
      description: "Connection-related errors found. Verify database/service connection pool sizing and health check configurations.",
      priority: "high",
      category: "investigation",
    });
  }
  
  if (hasMemory) {
    recommendations.push({
      id: randomUUID(),
      title: "Monitor memory usage",
      description: "Memory-related issues detected. Review heap dumps and consider scaling or optimizing memory-intensive operations.",
      priority: "medium",
      category: "investigation",
    });
  }

  // Add general recommendation
  recommendations.push({
    id: randomUUID(),
    title: "Implement structured logging",
    description: "Ensure all logs include correlation IDs, timestamps, and component identifiers for easier debugging.",
    priority: "low",
    category: "prevention",
  });

  return {
    summary: summaryParts.join(" "),
    rootCauses,
    missingContext,
    recommendations: recommendations.slice(0, 5),
  };
}

function extractComponents(message: string, logs: LogEntry[]): string[] {
  const components = new Set<string>();
  
  // Extract from source fields
  logs
    .filter((l) => l.message.includes(message.slice(0, 30)))
    .forEach((l) => {
      if (l.source) {
        components.add(l.source);
      }
    });

  // Extract from message patterns
  const serviceMatch = message.match(/\[([A-Za-z]+(?:Service|Controller|Handler|Gateway|Client))\]/);
  if (serviceMatch) {
    components.add(serviceMatch[1]);
  }

  // Extract file references
  const fileMatch = message.match(/([a-z-]+)\.(ts|js|py|java|go):\d+/i);
  if (fileMatch) {
    components.add(fileMatch[1]);
  }

  return Array.from(components).slice(0, 3);
}

function inferRootCause(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes("timeout")) {
    return "Service or database connection timing out, possibly due to high load or network issues";
  }
  if (lower.includes("connection") && lower.includes("refused")) {
    return "External service or database is unavailable or refusing connections";
  }
  if (lower.includes("connection") && lower.includes("pool")) {
    return "Connection pool exhausted - consider increasing pool size or reducing connection hold time";
  }
  if (lower.includes("jwt") || lower.includes("token") && lower.includes("expired")) {
    return "Authentication tokens expiring - may need to implement token refresh mechanism";
  }
  if (lower.includes("memory") || lower.includes("heap")) {
    return "Memory pressure or potential memory leak detected";
  }
  if (lower.includes("permission") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return "Authorization or permission issue - review access control configuration";
  }
  if (lower.includes("null") || lower.includes("undefined")) {
    return "Null or undefined value encountered - add proper null checks and validation";
  }
  
  return "Error pattern detected - requires manual investigation of stack traces and context";
}
