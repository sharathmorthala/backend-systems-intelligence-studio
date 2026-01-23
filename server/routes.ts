import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseLogs, groupErrors } from "./log-parser";
import { analyzeWithLLM } from "./llm-service";
import { analyzeLogsRequestSchema, type AnalyzeLogsResponse } from "@shared/schema";
import { randomUUID } from "crypto";
import { fromZodError } from "zod-validation-error";

// Error handling middleware
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      hasApiKey: !!process.env.HUGGINGFACE_API_KEY 
    });
  });

  // Analyze logs endpoint
  app.post(
    "/api/analyze",
    asyncHandler(async (req, res) => {
      console.log("[API] Received analyze request");
      
      // Validate request body
      const parseResult = analyzeLogsRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        const error = fromZodError(parseResult.error);
        console.error("[API] Validation error:", error.message);
        res.status(400).json({ 
          error: "Invalid request", 
          details: error.message 
        });
        return;
      }

      const { rawLogs } = parseResult.data;
      const analysisId = randomUUID();
      const createdAt = new Date().toISOString();

      try {
        console.log("[API] Parsing logs...");
        // Step 1: Parse logs
        const parsedLogs = parseLogs(rawLogs);
        console.log(`[API] Parsed ${parsedLogs.length} log entries`);

        // Step 2: Group errors
        console.log("[API] Grouping errors...");
        const errorGroups = groupErrors(parsedLogs);
        console.log(`[API] Found ${errorGroups.length} error groups`);

        // Step 3: Analyze with LLM
        console.log("[API] Analyzing with LLM...");
        const { analysis, usedFallback } = await analyzeWithLLM(parsedLogs, errorGroups);
        console.log(`[API] Analysis complete (fallback: ${usedFallback})`);

        // Build response
        const response: AnalyzeLogsResponse = {
          id: analysisId,
          createdAt,
          status: "completed",
          parsedLogs,
          errorGroups,
          analysis,
          usedFallback,
        };

        // Save to storage
        await storage.saveAnalysis(response);

        res.json(response);
      } catch (error) {
        console.error("[API] Analysis failed:", error);
        
        const errorResponse: AnalyzeLogsResponse = {
          id: analysisId,
          createdAt,
          status: "failed",
          parsedLogs: [],
          errorGroups: [],
          analysis: null,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          usedFallback: false,
        };

        await storage.saveAnalysis(errorResponse);
        
        res.status(500).json(errorResponse);
      }
    })
  );

  // Get analysis by ID
  app.get(
    "/api/analysis/:id",
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        res.status(404).json({ error: "Analysis not found" });
        return;
      }

      res.json(analysis);
    })
  );

  // Get analysis history
  app.get(
    "/api/history",
    asyncHandler(async (req, res) => {
      const history = await storage.getAnalysisHistory();
      res.json(history);
    })
  );

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("[API] Unhandled error:", err);
    res.status(500).json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  });

  return httpServer;
}
