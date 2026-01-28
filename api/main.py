import os
import uuid
from datetime import datetime
from typing import Optional
import re
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from api.schemas import (
    AnalyzeLogsRequest, AnalyzeLogsResponse, AnalysisHistoryItem, HealthResponse,
    ApiReviewRequest, ApiReviewResult, ResilienceRequest, ResilienceResult,
    CodeScanRequest, CodeScanResult, SystemReviewRequest, SystemReviewResult,
    DependencyAnalyzeRequest, DependencyAnalysisResult, ContactRequest, ContactResponse
)
from api.storage import storage
from api.log_parser import parse_logs, group_errors
from api.llm_service import analyze_with_llm
from api.tool_services import (
    review_api_contract, get_resilience_advice, scan_code,
    review_system_design, analyze_dependencies
)
from api.email_service import send_contact_email

app = FastAPI(title="Backend Systems Intelligence Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid request", "details": str(exc)}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    print(f"[API] Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow().isoformat() + "Z",
        hasApiKey=bool(os.environ.get("HUGGINGFACE_API_KEY"))
    )

@app.post("/api/analyze", response_model=AnalyzeLogsResponse)
async def analyze_logs(request: AnalyzeLogsRequest):
    print("[API] Received analyze request")
    
    analysis_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"
    
    try:
        print("[API] Parsing logs...")
        parsed_logs = parse_logs(request.rawLogs)
        print(f"[API] Parsed {len(parsed_logs)} log entries")
        
        print("[API] Grouping errors...")
        error_groups = group_errors(parsed_logs)
        print(f"[API] Found {len(error_groups)} error groups")
        
        print("[API] Analyzing with LLM...")
        analysis, used_fallback = await analyze_with_llm(parsed_logs, error_groups)
        print(f"[API] Analysis complete (fallback: {used_fallback})")
        
        response = AnalyzeLogsResponse(
            id=analysis_id,
            createdAt=created_at,
            status="completed",
            parsedLogs=parsed_logs,
            errorGroups=error_groups,
            analysis=analysis,
            usedFallback=used_fallback
        )
        
        await storage.save_analysis(response)
        return response
        
    except Exception as e:
        print(f"[API] Analysis failed: {e}")
        
        error_response = AnalyzeLogsResponse(
            id=analysis_id,
            createdAt=created_at,
            status="failed",
            parsedLogs=[],
            errorGroups=[],
            analysis=None,
            error=str(e),
            usedFallback=False
        )
        
        await storage.save_analysis(error_response)
        raise HTTPException(status_code=500, detail=error_response.model_dump())

@app.get("/api/analysis/{id}")
async def get_analysis(id: str):
    analysis = await storage.get_analysis(id)
    if not analysis:
        raise HTTPException(status_code=404, detail={"error": "Analysis not found"})
    return analysis

@app.get("/api/history")
async def get_history():
    return await storage.get_analysis_history()

@app.post("/api/tools/api-review", response_model=ApiReviewResult)
async def api_review(request: ApiReviewRequest):
    print("[API] API Review request received")
    
    if not request.apiContract:
        raise HTTPException(status_code=400, detail={"error": "apiContract is required"})
    
    return await review_api_contract(request.apiContract)

@app.post("/api/tools/resilience-advice", response_model=ResilienceResult)
async def resilience_advice(request: ResilienceRequest):
    print("[API] Resilience advice request received")
    
    if not request.scenario:
        raise HTTPException(status_code=400, detail={"error": "scenario is required"})
    
    return await get_resilience_advice(request.scenario)

@app.post("/api/tools/code-scan", response_model=CodeScanResult)
async def code_scan(request: CodeScanRequest):
    print("[API] Code scan request received")
    
    if not request.code:
        raise HTTPException(status_code=400, detail={"error": "code is required"})
    
    return await scan_code(request.code)

@app.post("/api/tools/system-review", response_model=SystemReviewResult)
async def system_review(request: SystemReviewRequest):
    print("[API] System review request received")
    
    if not request.design:
        raise HTTPException(status_code=400, detail={"error": "design is required"})
    
    return await review_system_design(request.design)

@app.post("/api/tools/dependency-analyze", response_model=DependencyAnalysisResult)
async def dependency_analyze(request: DependencyAnalyzeRequest):
    print("[API] Dependency analysis request received")
    
    if not request.manifest:
        raise HTTPException(status_code=400, detail={"error": "manifest is required"})
    
    return await analyze_dependencies(request.manifest)

@app.post("/api/contact", response_model=ContactResponse)
async def contact(request: ContactRequest):
    print("[API] Contact form submission received")
    
    email_regex = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    if not email_regex.match(request.email):
        raise HTTPException(status_code=400, detail={"error": "Invalid email format"})
    
    print(f"[Contact] New submission from: {request.email}")
    
    result = await send_contact_email(request.name, request.email, request.message)
    
    if not result["success"]:
        print(f"[Contact] Email failed: {result.get('error')}")
        return ContactResponse(
            success=False,
            message="Message received but email notification failed",
            error=result.get("error")
        )
    
    print("[Contact] Email sent successfully")
    return ContactResponse(success=True, message="Message sent successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5001)
