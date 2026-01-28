from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class LogEntry(BaseModel):
    id: str
    timestamp: str
    level: Literal["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]
    message: str
    source: Optional[str] = None
    stackTrace: Optional[str] = None

class ErrorGroup(BaseModel):
    id: str
    label: str
    count: int
    severity: Literal["low", "medium", "high", "critical"]
    firstOccurrence: str
    lastOccurrence: str
    sampleMessage: str
    relatedLogIds: List[str]

class RootCause(BaseModel):
    id: str
    description: str
    confidence: Literal["low", "medium", "high"]
    affectedComponents: List[str]

class MissingContext(BaseModel):
    id: str
    description: str
    importance: Literal["optional", "recommended", "critical"]

class Recommendation(BaseModel):
    id: str
    title: str
    description: str
    priority: Literal["low", "medium", "high"]
    category: Literal["investigation", "mitigation", "prevention"]

class AnalysisResult(BaseModel):
    summary: str
    rootCauses: List[RootCause]
    missingContext: List[MissingContext]
    recommendations: List[Recommendation]

class AnalyzeLogsRequest(BaseModel):
    rawLogs: str = Field(..., min_length=1)

class AnalyzeLogsResponse(BaseModel):
    id: str
    createdAt: str
    status: Literal["processing", "completed", "failed"]
    parsedLogs: List[LogEntry]
    errorGroups: List[ErrorGroup]
    analysis: Optional[AnalysisResult] = None
    error: Optional[str] = None
    usedFallback: bool

class AnalysisHistoryItem(BaseModel):
    id: str
    createdAt: str
    logCount: int
    errorCount: int
    status: Literal["processing", "completed", "failed"]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    hasApiKey: bool

class ApiReviewRequest(BaseModel):
    apiContract: str

class ApiReviewResult(BaseModel):
    missingFields: List[str]
    inconsistencies: List[str]
    breakingChangeRisks: List[str]
    bestPractices: List[str]
    summary: str

class RetryStrategy(BaseModel):
    recommendation: str
    maxRetries: int
    backoffType: str
    initialDelay: str

class IdempotencyConfig(BaseModel):
    recommendation: str
    keyStrategy: str
    storageApproach: str

class CircuitBreakerConfig(BaseModel):
    recommendation: str
    threshold: str
    timeout: str
    halfOpenRequests: int

class ResilienceRequest(BaseModel):
    scenario: str

class ResilienceResult(BaseModel):
    retryStrategy: RetryStrategy
    idempotency: IdempotencyConfig
    circuitBreaker: CircuitBreakerConfig
    doNotRetry: List[str]
    summary: str

class CodeRisk(BaseModel):
    line: int
    type: str
    description: str
    severity: Literal["high", "medium", "low"]

class CodeScanRequest(BaseModel):
    code: str

class CodeScanResult(BaseModel):
    blockingCalls: List[CodeRisk]
    threadSafetyRisks: List[CodeRisk]
    errorHandlingGaps: List[CodeRisk]
    performanceConcerns: List[CodeRisk]
    bestPractices: List[str]
    summary: str
    llmInsights: Optional[str] = None
    usedFallback: bool
    language: str
    parserUsed: str

class Bottleneck(BaseModel):
    component: str
    description: str
    severity: str

class SinglePointOfFailure(BaseModel):
    component: str
    risk: str
    mitigation: str

class ScalabilityConcern(BaseModel):
    area: str
    description: str
    recommendation: str

class ObservabilityGap(BaseModel):
    area: str
    description: str

class SystemReviewRequest(BaseModel):
    design: str

class SystemReviewResult(BaseModel):
    bottlenecks: List[Bottleneck]
    singlePointsOfFailure: List[SinglePointOfFailure]
    scalabilityConcerns: List[ScalabilityConcern]
    observabilityGaps: List[ObservabilityGap]
    summary: str

class DependencyRisk(BaseModel):
    name: str
    version: str
    riskLevel: Literal["high", "moderate", "low"]
    reason: str

class DetectedRisk(BaseModel):
    issue: str
    severity: Literal["high", "moderate", "low"]

class DependencyAnalyzeRequest(BaseModel):
    manifest: str

class DependencyAnalysisResult(BaseModel):
    detectedRisks: List[DetectedRisk]
    dependencies: List[DependencyRisk]
    recommendations: List[str]
    summary: str
    usedFallback: bool

class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., max_length=254)
    message: str = Field(..., min_length=1, max_length=5000)

class ContactResponse(BaseModel):
    success: bool
    message: str
    error: Optional[str] = None
