import os
import re
import json
import uuid
import httpx
from typing import List, Optional, Dict, Any, Tuple
from api.schemas import LogEntry, ErrorGroup, AnalysisResult, RootCause, MissingContext, Recommendation

HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"

def build_prompt(logs: List[LogEntry], error_groups: List[ErrorGroup]) -> str:
    error_summary = "\n".join([
        f"- {g.label}: {g.count} occurrences, severity {g.severity}, sample: \"{g.sampleMessage[:100]}\""
        for g in error_groups
    ])
    
    log_summary = "\n".join([
        f"[{l.level}] {f'[{l.source}]' if l.source else ''} {l.message[:150]}"
        for l in logs[:20]
    ])
    
    return f"""<s>[INST] You are a senior backend engineer analyzing application logs to identify issues and provide recommendations.

Analyze the following log data and provide a structured analysis in JSON format.

ERROR GROUPS:
{error_summary}

SAMPLE LOGS:
{log_summary}

Provide your analysis as a valid JSON object with this exact structure:
{{
  "summary": "Brief 2-3 sentence summary of the overall situation",
  "rootCauses": [
    {{
      "id": "unique-id",
      "description": "Description of the probable root cause",
      "confidence": "low" | "medium" | "high",
      "affectedComponents": ["component1", "component2"]
    }}
  ],
  "missingContext": [
    {{
      "id": "unique-id",
      "description": "What additional information would help",
      "importance": "optional" | "recommended" | "critical"
    }}
  ],
  "recommendations": [
    {{
      "id": "unique-id",
      "title": "Short action title",
      "description": "Detailed explanation of what to do",
      "priority": "low" | "medium" | "high",
      "category": "investigation" | "mitigation" | "prevention"
    }}
  ]
}}

Respond ONLY with valid JSON. No markdown, no explanation, just the JSON object. [/INST]</s>"""

def parse_json_response(text: str) -> Optional[Dict[str, Any]]:
    try:
        json_match = re.search(r'\{[\s\S]*\}', text)
        if not json_match:
            return None
        return json.loads(json_match.group(0))
    except Exception:
        return None

def extract_components(message: str, logs: List[LogEntry]) -> List[str]:
    components = set()
    
    for log in logs:
        if message[:30] in log.message and log.source:
            components.add(log.source)
    
    service_match = re.search(r'\[([A-Za-z]+(?:Service|Controller|Handler|Gateway|Client))\]', message)
    if service_match:
        components.add(service_match.group(1))
    
    file_match = re.search(r'([a-z-]+)\.(ts|js|py|java|go):\d+', message, re.IGNORECASE)
    if file_match:
        components.add(file_match.group(1))
    
    return list(components)[:3]

def infer_root_cause(message: str) -> str:
    lower = message.lower()
    
    if "timeout" in lower:
        return "Service or database connection timing out, possibly due to high load or network issues"
    if "connection" in lower and "refused" in lower:
        return "External service or database is unavailable or refusing connections"
    if "connection" in lower and "pool" in lower:
        return "Connection pool exhausted - consider increasing pool size or reducing connection hold time"
    if ("jwt" in lower or "token" in lower) and "expired" in lower:
        return "Authentication tokens expiring - may need to implement token refresh mechanism"
    if "memory" in lower or "heap" in lower:
        return "Memory pressure or potential memory leak detected"
    if "permission" in lower or "unauthorized" in lower or "forbidden" in lower:
        return "Authorization or permission issue - review access control configuration"
    if "null" in lower or "undefined" in lower:
        return "Null or undefined value encountered - add proper null checks and validation"
    
    return "Error pattern detected - requires manual investigation of stack traces and context"

def generate_fallback_analysis(logs: List[LogEntry], error_groups: List[ErrorGroup]) -> AnalysisResult:
    error_count = len([l for l in logs if l.level in ("ERROR", "FATAL")])
    warn_count = len([l for l in logs if l.level == "WARN"])
    total_count = len(logs)
    
    summary_parts = [f"Analyzed {total_count} log entries."]
    
    if error_count > 0:
        summary_parts.append(f"Found {error_count} error{'s' if error_count > 1 else ''} across {len(error_groups)} distinct error pattern{'s' if len(error_groups) > 1 else ''}.")
    if warn_count > 0:
        summary_parts.append(f"{warn_count} warning{'s' if warn_count > 1 else ''} detected.")
    
    root_causes = []
    for group in error_groups[:3]:
        components = extract_components(group.sampleMessage, logs)
        confidence = "high" if group.count >= 3 else ("medium" if group.count >= 2 else "low")
        
        root_causes.append(RootCause(
            id=str(uuid.uuid4()),
            description=infer_root_cause(group.sampleMessage),
            confidence=confidence,
            affectedComponents=components
        ))
    
    missing_context = []
    log_messages = " ".join(l.message for l in logs)
    
    if "request_id" not in log_messages and "trace" not in log_messages:
        missing_context.append(MissingContext(
            id=str(uuid.uuid4()),
            description="Request IDs or distributed tracing context not found in logs",
            importance="recommended"
        ))
    
    if "user" not in log_messages and "account" not in log_messages:
        missing_context.append(MissingContext(
            id=str(uuid.uuid4()),
            description="User or account context not present - unable to correlate by user",
            importance="optional"
        ))
    
    recommendations = []
    
    if error_groups:
        top_group = error_groups[0]
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            title=f"Investigate {top_group.label}",
            description=f"Focus on the most frequent error pattern: \"{top_group.sampleMessage[:80]}...\". This occurred {top_group.count} time(s) and should be prioritized.",
            priority="high" if top_group.severity in ("critical", "high") else "medium",
            category="investigation"
        ))
    
    has_timeout = any("timeout" in l.message.lower() for l in logs)
    has_connection = any("connection" in l.message.lower() for l in logs)
    has_memory = any("memory" in l.message.lower() or "heap" in l.message.lower() for l in logs)
    
    if has_timeout:
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            title="Review timeout configurations",
            description="Timeout errors detected. Consider increasing timeout thresholds or implementing circuit breakers for external service calls.",
            priority="high",
            category="mitigation"
        ))
    
    if has_connection:
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            title="Check connection pool settings",
            description="Connection-related errors found. Verify database/service connection pool sizing and health check configurations.",
            priority="high",
            category="investigation"
        ))
    
    if has_memory:
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            title="Monitor memory usage",
            description="Memory-related issues detected. Review heap dumps and consider scaling or optimizing memory-intensive operations.",
            priority="medium",
            category="investigation"
        ))
    
    recommendations.append(Recommendation(
        id=str(uuid.uuid4()),
        title="Implement structured logging",
        description="Ensure all logs include correlation IDs, timestamps, and component identifiers for easier debugging.",
        priority="low",
        category="prevention"
    ))
    
    return AnalysisResult(
        summary=" ".join(summary_parts),
        rootCauses=root_causes,
        missingContext=missing_context,
        recommendations=recommendations[:5]
    )

async def analyze_with_llm(logs: List[LogEntry], error_groups: List[ErrorGroup]) -> Tuple[AnalysisResult, bool]:
    api_key = os.environ.get("HUGGINGFACE_API_KEY")
    
    if not api_key:
        print("[LLM] HUGGINGFACE_API_KEY not found, using fallback analysis")
        return generate_fallback_analysis(logs, error_groups), True
    
    try:
        prompt = build_prompt(logs, error_groups)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                HUGGINGFACE_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": 1500,
                        "temperature": 0.3,
                        "top_p": 0.9,
                        "do_sample": True,
                        "return_full_text": False,
                    },
                },
                timeout=60.0
            )
        
        if response.status_code != 200:
            print(f"[LLM] Hugging Face API error: {response.status_code}")
            if response.status_code in (429, 503):
                print("[LLM] API rate limited or model loading, using fallback")
            return generate_fallback_analysis(logs, error_groups), True
        
        data = response.json()
        generated_text = data[0].get("generated_text") if isinstance(data, list) else data.get("generated_text")
        
        if not generated_text:
            print("[LLM] Empty response from LLM, using fallback")
            return generate_fallback_analysis(logs, error_groups), True
        
        parsed = parse_json_response(generated_text)
        
        if not parsed:
            print("[LLM] Failed to parse LLM response, using fallback")
            return generate_fallback_analysis(logs, error_groups), True
        
        root_causes = [
            RootCause(
                id=c.get("id") or str(uuid.uuid4()),
                description=c.get("description", "Unknown cause"),
                confidence=c.get("confidence", "medium") if c.get("confidence") in ("low", "medium", "high") else "medium",
                affectedComponents=c.get("affectedComponents", [])
            )
            for c in (parsed.get("rootCauses") or [])
        ]
        
        missing_context = [
            MissingContext(
                id=m.get("id") or str(uuid.uuid4()),
                description=m.get("description", "Unknown context"),
                importance=m.get("importance", "optional") if m.get("importance") in ("optional", "recommended", "critical") else "optional"
            )
            for m in (parsed.get("missingContext") or [])
        ]
        
        recommendations = [
            Recommendation(
                id=r.get("id") or str(uuid.uuid4()),
                title=r.get("title", "Recommendation"),
                description=r.get("description", "No description provided"),
                priority=r.get("priority", "medium") if r.get("priority") in ("low", "medium", "high") else "medium",
                category=r.get("category", "investigation") if r.get("category") in ("investigation", "mitigation", "prevention") else "investigation"
            )
            for r in (parsed.get("recommendations") or [])
        ]
        
        return AnalysisResult(
            summary=parsed.get("summary", "Analysis completed."),
            rootCauses=root_causes,
            missingContext=missing_context,
            recommendations=recommendations
        ), False
        
    except Exception as e:
        print(f"[LLM] LLM analysis failed: {e}")
        return generate_fallback_analysis(logs, error_groups), True

async def call_llm(prompt: str) -> Optional[str]:
    api_key = os.environ.get("HUGGINGFACE_API_KEY")
    
    if not api_key:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                HUGGINGFACE_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": 1500,
                        "temperature": 0.3,
                        "top_p": 0.9,
                        "do_sample": True,
                        "return_full_text": False,
                    },
                },
                timeout=60.0
            )
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        return data[0].get("generated_text") if isinstance(data, list) else data.get("generated_text")
    
    except Exception as e:
        print(f"[LLM] LLM call failed: {e}")
        return None
