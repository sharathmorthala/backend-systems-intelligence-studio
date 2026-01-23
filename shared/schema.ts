import { z } from "zod";

// Log entry schema for structured log data
export const logEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  level: z.enum(["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]),
  message: z.string(),
  source: z.string().optional(),
  stackTrace: z.string().optional(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

// Error group schema for clustered errors
export const errorGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  firstOccurrence: z.string(),
  lastOccurrence: z.string(),
  sampleMessage: z.string(),
  relatedLogIds: z.array(z.string()),
});

export type ErrorGroup = z.infer<typeof errorGroupSchema>;

// Analysis result from LLM
export const analysisResultSchema = z.object({
  summary: z.string(),
  rootCauses: z.array(z.object({
    id: z.string(),
    description: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
    affectedComponents: z.array(z.string()),
  })),
  missingContext: z.array(z.object({
    id: z.string(),
    description: z.string(),
    importance: z.enum(["optional", "recommended", "critical"]),
  })),
  recommendations: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(["low", "medium", "high"]),
    category: z.enum(["investigation", "mitigation", "prevention"]),
  })),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// Request schema for log analysis
export const analyzeLogsRequestSchema = z.object({
  rawLogs: z.string().min(1, "Logs cannot be empty"),
});

export type AnalyzeLogsRequest = z.infer<typeof analyzeLogsRequestSchema>;

// Response schema for log analysis
export const analyzeLogsResponseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  status: z.enum(["processing", "completed", "failed"]),
  parsedLogs: z.array(logEntrySchema),
  errorGroups: z.array(errorGroupSchema),
  analysis: analysisResultSchema.nullable(),
  error: z.string().optional(),
  usedFallback: z.boolean(),
});

export type AnalyzeLogsResponse = z.infer<typeof analyzeLogsResponseSchema>;

// Analysis history item
export const analysisHistoryItemSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  logCount: z.number(),
  errorCount: z.number(),
  status: z.enum(["processing", "completed", "failed"]),
});

export type AnalysisHistoryItem = z.infer<typeof analysisHistoryItemSchema>;
