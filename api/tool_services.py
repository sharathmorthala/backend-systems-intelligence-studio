import re
import json
import uuid
from typing import List, Dict, Any, Optional, Tuple, Literal, cast
from api.schemas import (
    ApiReviewResult, ResilienceResult, RetryStrategy, IdempotencyConfig, CircuitBreakerConfig,
    CodeScanResult, CodeRisk, SystemReviewResult, Bottleneck, SinglePointOfFailure,
    ScalabilityConcern, ObservabilityGap, DependencyAnalysisResult, DependencyRisk, DetectedRisk
)
from api.llm_service import call_llm
from api.code_analyzer import analyze_code, convert_to_ui_format

def parse_json_response(text: str) -> Optional[Dict[str, Any]]:
    try:
        json_match = re.search(r'\{[\s\S]*\}', text)
        if not json_match:
            return None
        return json.loads(json_match.group(0))
    except Exception:
        return None

async def review_api_contract(api_contract: str) -> ApiReviewResult:
    prompt = f"""<s>[INST] You are a senior API designer reviewing REST API contracts.

Analyze this API contract and identify issues:

{api_contract}

Respond with JSON only:
{{
  "missingFields": ["list of missing required fields or headers"],
  "inconsistencies": ["list of inconsistencies in the API design"],
  "breakingChangeRisks": ["list of potential breaking change risks"],
  "bestPractices": ["list of REST best practice recommendations"],
  "summary": "2-3 sentence summary of the API quality"
}}

JSON only, no markdown. [/INST]</s>"""

    llm_response = await call_llm(prompt)
    if llm_response:
        parsed = parse_json_response(llm_response)
        if parsed:
            return ApiReviewResult(
                missingFields=parsed.get("missingFields", []),
                inconsistencies=parsed.get("inconsistencies", []),
                breakingChangeRisks=parsed.get("breakingChangeRisks", []),
                bestPractices=parsed.get("bestPractices", []),
                summary=parsed.get("summary", "Analysis completed.")
            )
    
    return generate_api_review_fallback(api_contract)

def generate_api_review_fallback(api_contract: str) -> ApiReviewResult:
    lower = api_contract.lower()
    missing_fields = []
    inconsistencies = []
    breaking_change_risks = []
    best_practices = []
    
    if "content-type" not in lower:
        missing_fields.append("Content-Type header not specified")
    if "error" not in lower and "response" in lower:
        missing_fields.append("Error response format not defined")
    if "pagination" not in lower and ("list" in lower or "array" in lower):
        missing_fields.append("Pagination not defined for list endpoints")
    
    if "200" in lower and "post" in lower and "201" not in lower:
        inconsistencies.append("POST requests typically return 201 Created, not 200 OK")
    if "id" in lower and "_id" in lower:
        inconsistencies.append("Inconsistent ID field naming (id vs _id)")
    
    if "required" in lower or "mandatory" in lower:
        breaking_change_risks.append("Adding required fields to requests could break existing clients")
    if "remove" in lower or "deprecate" in lower:
        breaking_change_risks.append("Removing fields from responses could break clients")
    
    best_practices.append("Consider using semantic versioning in API paths (e.g., /v1/users)")
    best_practices.append("Include rate limiting headers in responses (X-RateLimit-*)")
    best_practices.append("Use consistent date formats (ISO 8601) across all endpoints")
    
    return ApiReviewResult(
        missingFields=missing_fields,
        inconsistencies=inconsistencies,
        breakingChangeRisks=breaking_change_risks,
        bestPractices=best_practices,
        summary=f"Analyzed API contract. Found {len(missing_fields)} missing fields, {len(inconsistencies)} inconsistencies, and {len(breaking_change_risks)} potential breaking change risks."
    )

async def get_resilience_advice(scenario: str) -> ResilienceResult:
    prompt = f"""<s>[INST] You are a reliability engineer advising on resilience patterns.

Analyze this failure scenario and provide recommendations:

{scenario}

Respond with JSON only:
{{
  "retryStrategy": {{
    "recommendation": "explanation of retry approach",
    "maxRetries": 3,
    "backoffType": "exponential|linear|constant",
    "initialDelay": "100ms|500ms|1s"
  }},
  "idempotency": {{
    "recommendation": "how to ensure idempotency",
    "keyStrategy": "request-id|hash|composite",
    "storageApproach": "redis|database|memory"
  }},
  "circuitBreaker": {{
    "recommendation": "circuit breaker guidance",
    "threshold": "50% failures in 10s",
    "timeout": "30s",
    "halfOpenRequests": 3
  }},
  "doNotRetry": ["list of scenarios that should NOT be retried"],
  "summary": "2-3 sentence summary"
}}

JSON only. [/INST]</s>"""

    llm_response = await call_llm(prompt)
    if llm_response:
        parsed = parse_json_response(llm_response)
        if parsed:
            return ResilienceResult(
                retryStrategy=RetryStrategy(
                    recommendation=parsed.get("retryStrategy", {}).get("recommendation", "Implement exponential backoff with jitter"),
                    maxRetries=parsed.get("retryStrategy", {}).get("maxRetries", 3),
                    backoffType=parsed.get("retryStrategy", {}).get("backoffType", "exponential"),
                    initialDelay=parsed.get("retryStrategy", {}).get("initialDelay", "100ms")
                ),
                idempotency=IdempotencyConfig(
                    recommendation=parsed.get("idempotency", {}).get("recommendation", "Use idempotency keys for mutation operations"),
                    keyStrategy=parsed.get("idempotency", {}).get("keyStrategy", "request-id"),
                    storageApproach=parsed.get("idempotency", {}).get("storageApproach", "redis")
                ),
                circuitBreaker=CircuitBreakerConfig(
                    recommendation=parsed.get("circuitBreaker", {}).get("recommendation", "Implement circuit breaker for external calls"),
                    threshold=parsed.get("circuitBreaker", {}).get("threshold", "50% failures"),
                    timeout=parsed.get("circuitBreaker", {}).get("timeout", "30s"),
                    halfOpenRequests=parsed.get("circuitBreaker", {}).get("halfOpenRequests", 3)
                ),
                doNotRetry=parsed.get("doNotRetry", []),
                summary=parsed.get("summary", "Analysis completed.")
            )
    
    return generate_resilience_fallback(scenario)

def generate_resilience_fallback(scenario: str) -> ResilienceResult:
    lower = scenario.lower()
    do_not_retry = []
    
    if "payment" in lower or "charge" in lower or "transaction" in lower:
        do_not_retry.append("Payment confirmations - may result in double charges")
        do_not_retry.append("Successful transactions - already completed")
    if "email" in lower or "notification" in lower:
        do_not_retry.append("Successfully sent notifications - duplicate messages")
    do_not_retry.append("4xx client errors - request is invalid")
    do_not_retry.append("Authentication failures - credentials won't change")
    do_not_retry.append("Resource not found (404) - resource still won't exist")
    
    has_payment = "payment" in lower or "stripe" in lower or "charge" in lower
    has_timeout = "timeout" in lower
    
    return ResilienceResult(
        retryStrategy=RetryStrategy(
            recommendation="Use very conservative retry strategy with idempotency keys to prevent duplicate payments" if has_payment else "Implement exponential backoff with jitter to prevent thundering herd",
            maxRetries=2 if has_payment else 3,
            backoffType="exponential",
            initialDelay="500ms" if has_timeout else "100ms"
        ),
        idempotency=IdempotencyConfig(
            recommendation="Critical: Generate unique idempotency key per payment attempt, store in database with payment status" if has_payment else "Include idempotency key header for all mutation operations",
            keyStrategy="composite" if has_payment else "request-id",
            storageApproach="database" if has_payment else "redis"
        ),
        circuitBreaker=CircuitBreakerConfig(
            recommendation="Open circuit after consecutive failures to prevent cascade failures and allow recovery",
            threshold="5 failures in 30s",
            timeout="60s" if has_timeout else "30s",
            halfOpenRequests=3
        ),
        doNotRetry=do_not_retry,
        summary=f"Analyzed scenario for resilience patterns. {'Payment scenarios require extra care with idempotency.' if has_payment else ''} Recommended exponential backoff with circuit breaker protection."
    )

async def scan_code(code: str) -> CodeScanResult:
    analysis_result = analyze_code(code)
    ui_format = convert_to_ui_format(analysis_result)
    
    blocking_calls = [CodeRisk(**r) for r in ui_format["blockingCalls"]]
    thread_safety_risks = [CodeRisk(**r) for r in ui_format["threadSafetyRisks"]]
    error_handling_gaps = [CodeRisk(**r) for r in ui_format["errorHandlingGaps"]]
    performance_concerns = [CodeRisk(**r) for r in ui_format["performanceConcerns"]]
    best_practices = ui_format["bestPractices"]
    
    total_issues = len(blocking_calls) + len(thread_safety_risks) + len(error_handling_gaps) + len(performance_concerns)
    all_risks = blocking_calls + thread_safety_risks + error_handling_gaps + performance_concerns
    high_count = len([r for r in all_risks if r.severity == "high"])
    medium_count = len([r for r in all_risks if r.severity == "medium"])
    low_count = len([r for r in all_risks if r.severity == "low"])
    
    summary = f"Scanned {analysis_result.lines_scanned} lines of {analysis_result.language} code using {analysis_result.parser_used}. "
    if total_issues > 0:
        summary += f"Found {total_issues} risks: {high_count} high, {medium_count} medium, {low_count} low severity."
    else:
        summary += "No risks detected by current ruleset. This does not guarantee correctness."
    
    if analysis_result.limitations:
        summary += " " + analysis_result.limitations[0]
    
    llm_insights = None
    
    if total_issues > 0 and analysis_result.findings:
        risk_summary = "\n".join([
            f"- Line {f.line} [{f.severity}]: {f.message}"
            for f in analysis_result.findings
        ])
        
        prompt = f"""<s>[INST] You are a senior backend engineer. The following risks were detected in {analysis_result.language} code through static analysis:

{risk_summary}

Explain briefly why each detected risk matters in production environments and suggest one best practice for each. Do NOT invent new risks - only explain the ones already detected.

Respond in plain text, not JSON. Keep it concise (2-3 sentences per risk). [/INST]</s>"""

        llm_response = await call_llm(prompt)
        if llm_response:
            llm_insights = llm_response.strip()
    
    return CodeScanResult(
        blockingCalls=blocking_calls,
        threadSafetyRisks=thread_safety_risks,
        errorHandlingGaps=error_handling_gaps,
        performanceConcerns=performance_concerns,
        bestPractices=best_practices,
        summary=summary,
        llmInsights=llm_insights,
        usedFallback=llm_insights is None,
        language=analysis_result.language,
        parserUsed=analysis_result.parser_used
    )

async def review_system_design(design: str) -> SystemReviewResult:
    prompt = f"""<s>[INST] You are a system architect reviewing system designs.

Analyze this system design:

{design}

Respond with JSON only:
{{
  "bottlenecks": [{{"component": "name", "description": "issue", "severity": "high|medium|low"}}],
  "singlePointsOfFailure": [{{"component": "name", "risk": "what could fail", "mitigation": "how to fix"}}],
  "scalabilityConcerns": [{{"area": "area", "description": "issue", "recommendation": "fix"}}],
  "observabilityGaps": [{{"area": "area", "description": "what's missing"}}],
  "summary": "2-3 sentence summary"
}}

JSON only. [/INST]</s>"""

    llm_response = await call_llm(prompt)
    if llm_response:
        parsed = parse_json_response(llm_response)
        if parsed:
            return SystemReviewResult(
                bottlenecks=[
                    Bottleneck(
                        component=i.get("component", "Unknown"),
                        description=i.get("description", "Bottleneck detected"),
                        severity=i.get("severity", "medium")
                    )
                    for i in (parsed.get("bottlenecks") or [])
                ],
                singlePointsOfFailure=[
                    SinglePointOfFailure(
                        component=i.get("component", "Unknown"),
                        risk=i.get("risk", "Single point of failure"),
                        mitigation=i.get("mitigation", "Add redundancy")
                    )
                    for i in (parsed.get("singlePointsOfFailure") or [])
                ],
                scalabilityConcerns=[
                    ScalabilityConcern(
                        area=i.get("area", "Unknown"),
                        description=i.get("description", "Scalability concern"),
                        recommendation=i.get("recommendation", "Consider horizontal scaling")
                    )
                    for i in (parsed.get("scalabilityConcerns") or [])
                ],
                observabilityGaps=[
                    ObservabilityGap(
                        area=i.get("area", "Unknown"),
                        description=i.get("description", "Observability gap")
                    )
                    for i in (parsed.get("observabilityGaps") or [])
                ],
                summary=parsed.get("summary", "System design analysis completed.")
            )
    
    return generate_system_review_fallback(design)

def generate_system_review_fallback(design: str) -> SystemReviewResult:
    lower = design.lower()
    bottlenecks = []
    single_points_of_failure = []
    scalability_concerns = []
    observability_gaps = []
    
    if "single" in lower and ("database" in lower or "instance" in lower):
        bottlenecks.append(Bottleneck(
            component="Database",
            description="Single database instance can become a bottleneck under load",
            severity="high"
        ))
    if "synchronous" in lower:
        bottlenecks.append(Bottleneck(
            component="Service Communication",
            description="Synchronous calls create tight coupling and can cause cascading delays",
            severity="medium"
        ))
    if "api gateway" in lower and "single" in lower:
        bottlenecks.append(Bottleneck(
            component="API Gateway",
            description="Single API gateway is a chokepoint for all traffic",
            severity="high"
        ))
    
    if "single" in lower and "database" in lower:
        single_points_of_failure.append(SinglePointOfFailure(
            component="Database",
            risk="Database unavailability brings down entire system",
            mitigation="Implement primary-replica setup with automatic failover"
        ))
    if "cache" in lower and ("single" in lower or "one" in lower):
        single_points_of_failure.append(SinglePointOfFailure(
            component="Cache",
            risk="Cache failure causes sudden load spike to backend",
            mitigation="Use distributed cache cluster (Redis Cluster, Memcached)"
        ))
    
    if "monolith" in lower:
        scalability_concerns.append(ScalabilityConcern(
            area="Architecture",
            description="Monolithic architecture limits independent scaling",
            recommendation="Consider service decomposition for independent scaling"
        ))
    if "state" in lower or "session" in lower:
        scalability_concerns.append(ScalabilityConcern(
            area="State Management",
            description="Stateful services are harder to scale horizontally",
            recommendation="Externalize state to shared storage (Redis, database)"
        ))
    
    if "logging" not in lower and "log" not in lower:
        observability_gaps.append(ObservabilityGap(
            area="Logging",
            description="No mention of logging strategy"
        ))
    if "metric" not in lower and "monitor" not in lower:
        observability_gaps.append(ObservabilityGap(
            area="Metrics",
            description="No metrics or monitoring infrastructure described"
        ))
    if "trace" not in lower and "tracing" not in lower:
        observability_gaps.append(ObservabilityGap(
            area="Distributed Tracing",
            description="No distributed tracing for request correlation"
        ))
    
    return SystemReviewResult(
        bottlenecks=bottlenecks,
        singlePointsOfFailure=single_points_of_failure,
        scalabilityConcerns=scalability_concerns,
        observabilityGaps=observability_gaps,
        summary=f"Analyzed system design. Found {len(bottlenecks)} bottlenecks, {len(single_points_of_failure)} single points of failure, and {len(observability_gaps)} observability gaps."
    )

VULNERABLE_PATTERNS = {
    "log4j": {"reason": "Historic Log4Shell vulnerability (CVE-2021-44228)", "severity": "high"},
    "log4j-core": {"reason": "Historic Log4Shell vulnerability (CVE-2021-44228)", "severity": "high"},
    "jackson-databind": {"reason": "Known deserialization vulnerabilities in older versions", "severity": "high"},
    "commons-collections": {"reason": "Known deserialization gadget chain vulnerabilities", "severity": "high"},
    "struts": {"reason": "Historic remote code execution vulnerabilities", "severity": "high"},
    "spring-core": {"reason": "Check for Spring4Shell (CVE-2022-22965) in versions < 5.3.18", "severity": "moderate"},
    "lodash": {"reason": "Prototype pollution vulnerabilities in older versions", "severity": "moderate"},
    "moment": {"reason": "Deprecated; consider date-fns or dayjs", "severity": "moderate"},
    "request": {"reason": "Deprecated and unmaintained", "severity": "moderate"},
    "event-stream": {"reason": "Historic supply-chain attack (2018)", "severity": "high"},
    "ua-parser-js": {"reason": "Historic supply-chain compromise", "severity": "moderate"},
    "node-ipc": {"reason": "Historic protestware incident", "severity": "high"},
    "colors": {"reason": "Historic sabotage incident", "severity": "moderate"},
    "faker": {"reason": "Unmaintained; author deleted code", "severity": "moderate"},
}

def detect_manifest_type(content: str) -> str:
    if "<project" in content and "<dependency>" in content:
        return "pom"
    if "dependencies {" in content or "implementation " in content or "compile " in content:
        return "gradle"
    if '"dependencies"' in content or '"devDependencies"' in content:
        return "npm"
    return "unknown"

def parse_pom_dependencies(content: str) -> List[Dict[str, Any]]:
    deps = []
    dep_regex = re.compile(r'<dependency>[\s\S]*?<groupId>(.*?)</groupId>[\s\S]*?<artifactId>(.*?)</artifactId>[\s\S]*?(?:<version>(.*?)</version>)?[\s\S]*?</dependency>')
    
    for match in dep_regex.finditer(content):
        name = f"{match.group(1)}:{match.group(2)}"
        version = match.group(3) or "UNSPECIFIED"
        deps.append({
            "name": name,
            "version": version,
            "has_range": "[" in version or "(" in version or "," in version,
            "is_unpinned": version == "UNSPECIFIED" or "LATEST" in version or "RELEASE" in version
        })
    return deps

def parse_gradle_dependencies(content: str) -> List[Dict[str, Any]]:
    deps = []
    patterns = [
        re.compile(r"(?:implementation|compile|api|runtimeOnly|testImplementation)\s*['\"]([\\w.-]+):([\\w.-]+):([\\w.+-]+)['\"]"),
        re.compile(r"(?:implementation|compile|api|runtimeOnly|testImplementation)\s+['\"]([\\w.-]+):([\\w.-]+):([\\w.+-]+)['\"]"),
    ]
    
    for pattern in patterns:
        for match in pattern.finditer(content):
            name = f"{match.group(1)}:{match.group(2)}"
            version = match.group(3)
            deps.append({
                "name": name,
                "version": version,
                "has_range": "+" in version or "latest" in version.lower(),
                "is_unpinned": version == "+" or "latest" in version.lower()
            })
    return deps

def parse_npm_dependencies(content: str) -> List[Dict[str, Any]]:
    deps = []
    try:
        pkg = json.loads(content)
        all_deps = {**(pkg.get("dependencies") or {}), **(pkg.get("devDependencies") or {})}
        
        for name, version in all_deps.items():
            v = str(version)
            deps.append({
                "name": name,
                "version": v,
                "has_range": any(c in v for c in "^~><x*"),
                "is_unpinned": v in ("*", "latest") or "x" in v
            })
    except json.JSONDecodeError:
        regex = re.compile(r'"([\w@/-]+)":\s*"([^"]+)"')
        for match in regex.finditer(content):
            v = match.group(2)
            deps.append({
                "name": match.group(1),
                "version": v,
                "has_range": "^" in v or "~" in v,
                "is_unpinned": v in ("*", "latest")
            })
    return deps

async def analyze_dependencies(manifest: str) -> DependencyAnalysisResult:
    manifest_type = detect_manifest_type(manifest)
    parsed = []
    
    if manifest_type == "pom":
        parsed = parse_pom_dependencies(manifest)
    elif manifest_type == "gradle":
        parsed = parse_gradle_dependencies(manifest)
    elif manifest_type == "npm":
        parsed = parse_npm_dependencies(manifest)
    
    dependencies = []
    risks = []
    recommendations = []
    
    if manifest_type == "unknown":
        risks.append(DetectedRisk(
            issue="Could not detect manifest type (pom.xml, build.gradle, or package.json)",
            severity="moderate"
        ))
    
    if manifest_type == "npm" and "lockfileVersion" not in manifest:
        risks.append(DetectedRisk(
            issue="No package-lock.json detected - versions may drift between installs",
            severity="moderate"
        ))
        recommendations.append("Generate and commit package-lock.json for reproducible builds")
    
    RiskLevel = Literal["high", "moderate", "low"]
    
    for dep in parsed:
        short_name = dep["name"].split(":")[-1].lower()
        risk_level: RiskLevel = "low"
        reason = "No known issues detected"
        
        for pattern, info in VULNERABLE_PATTERNS.items():
            if pattern in short_name:
                risk_level = cast(RiskLevel, info["severity"])
                reason = info["reason"]
                risks.append(DetectedRisk(
                    issue=f"{dep['name']} - {info['reason']}",
                    severity=cast(RiskLevel, info["severity"])
                ))
                break
        
        if dep["is_unpinned"]:
            if risk_level == "low":
                risk_level = "high"
            if reason == "No known issues detected":
                reason = "Unpinned version - may pull unexpected updates"
            risks.append(DetectedRisk(
                issue=f"{dep['name']}@{dep['version']} uses unpinned version",
                severity="high"
            ))
        elif dep["has_range"] and risk_level == "low":
            risk_level = "moderate"
            reason = "Version range may allow minor/patch drift"
        
        dependencies.append(DependencyRisk(
            name=dep["name"],
            version=dep["version"],
            riskLevel=risk_level,
            reason=reason
        ))
    
    high_risk_count = len([r for r in risks if r.severity == "high"])
    has_unpinned = any(d["is_unpinned"] for d in parsed)
    
    if high_risk_count > 0:
        recommendations.append("Audit high-risk dependencies immediately and consider upgrading")
    if has_unpinned:
        recommendations.append("Pin all dependency versions to avoid supply-chain risks")
    if manifest_type == "npm":
        recommendations.append("Run 'npm audit' regularly as part of CI/CD pipeline")
    if manifest_type in ("pom", "gradle"):
        recommendations.append("Integrate OWASP Dependency-Check or Snyk into build pipeline")
    if not recommendations:
        recommendations.append("Consider periodic dependency audits as part of security hygiene")
    
    summary = f"Analyzed {len(parsed)} dependencies from {manifest_type} manifest. Found {high_risk_count} high-risk, {len([r for r in risks if r.severity == 'moderate'])} moderate-risk issues."
    
    used_fallback = True
    
    prompt = f"""<s>[INST] You are a security engineer analyzing a dependency manifest for vulnerabilities and supply-chain risks.

Analyze this dependency manifest and provide security insights:

{manifest[:3000]}

Based on the dependencies found, provide:
1. Additional security concerns not covered by basic pattern matching
2. Specific upgrade recommendations for risky dependencies
3. Supply-chain risk patterns (stale dependencies, transitive risks)

Respond with JSON only:
{{
  "additionalRisks": ["list of additional security concerns"],
  "upgradeGuidance": ["specific upgrade recommendations"],
  "supplyChainInsights": ["supply chain observations"],
  "overallAssessment": "1-2 sentence security posture summary"
}}

JSON only. [/INST]</s>"""

    llm_response = await call_llm(prompt)
    if llm_response:
        parsed_llm = parse_json_response(llm_response)
        if parsed_llm:
            used_fallback = False
            
            for risk in (parsed_llm.get("additionalRisks") or []):
                if not any(r.issue == risk for r in risks):
                    risks.append(DetectedRisk(issue=risk, severity="moderate"))
            
            for upgrade in (parsed_llm.get("upgradeGuidance") or []):
                if upgrade not in recommendations:
                    recommendations.append(upgrade)
            
            overall_assessment = parsed_llm.get("overallAssessment")
            if overall_assessment:
                summary += " " + str(overall_assessment)
    
    return DependencyAnalysisResult(
        detectedRisks=risks,
        dependencies=dependencies,
        recommendations=recommendations,
        summary=summary,
        usedFallback=used_fallback
    )
