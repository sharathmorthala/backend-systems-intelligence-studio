import type { LogEntry } from "@shared/schema";
import { randomUUID } from "crypto";

// Regular expressions for parsing common log formats
const LOG_PATTERNS = {
  // ISO timestamp pattern: 2024-01-23T10:15:32.123Z
  isoTimestamp: /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/,
  // Common timestamp: 2024-01-23 10:15:32
  commonTimestamp: /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/,
  // Log levels
  level: /\b(DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|CRITICAL)\b/i,
  // Source/component in brackets
  source: /\[([^\]]+)\]/,
  // Stack trace detection
  stackTrace: /^\s+at\s+/,
  // Caused by
  causedBy: /^\s*Caused by:/i,
};

interface ParsedLine {
  timestamp?: string;
  level?: LogEntry["level"];
  source?: string;
  message: string;
  isStackTrace: boolean;
}

function normalizeLevel(level: string): LogEntry["level"] {
  const normalized = level.toUpperCase();
  switch (normalized) {
    case "DEBUG":
      return "DEBUG";
    case "INFO":
      return "INFO";
    case "WARN":
    case "WARNING":
      return "WARN";
    case "ERROR":
      return "ERROR";
    case "FATAL":
    case "CRITICAL":
      return "FATAL";
    default:
      return "INFO";
  }
}

function parseLine(line: string): ParsedLine {
  const result: ParsedLine = {
    message: line.trim(),
    isStackTrace: false,
  };

  // Check if this is a stack trace line
  if (LOG_PATTERNS.stackTrace.test(line) || LOG_PATTERNS.causedBy.test(line)) {
    result.isStackTrace = true;
    return result;
  }

  let workingLine = line;

  // Try to extract ISO timestamp
  const isoMatch = workingLine.match(LOG_PATTERNS.isoTimestamp);
  if (isoMatch) {
    result.timestamp = isoMatch[1];
    workingLine = workingLine.slice(isoMatch[0].length).trim();
  } else {
    // Try common timestamp format
    const commonMatch = workingLine.match(LOG_PATTERNS.commonTimestamp);
    if (commonMatch) {
      result.timestamp = commonMatch[1].replace(" ", "T") + "Z";
      workingLine = workingLine.slice(commonMatch[0].length).trim();
    }
  }

  // Extract log level
  const levelMatch = workingLine.match(LOG_PATTERNS.level);
  if (levelMatch) {
    result.level = normalizeLevel(levelMatch[1]);
    workingLine = workingLine.replace(levelMatch[0], "").trim();
  }

  // Extract source/component
  const sourceMatch = workingLine.match(LOG_PATTERNS.source);
  if (sourceMatch) {
    result.source = sourceMatch[1];
    workingLine = workingLine.replace(sourceMatch[0], "").trim();
  }

  // Clean up the message
  result.message = workingLine.trim();

  return result;
}

export function parseLogs(rawLogs: string): LogEntry[] {
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  let currentEntry: Partial<LogEntry> | null = null;
  let currentStackTrace: string[] = [];

  const finalizeEntry = () => {
    if (currentEntry && currentEntry.message) {
      entries.push({
        id: randomUUID(),
        timestamp: currentEntry.timestamp || new Date().toISOString(),
        level: currentEntry.level || "INFO",
        message: currentEntry.message,
        source: currentEntry.source,
        stackTrace: currentStackTrace.length > 0 ? currentStackTrace.join("\n") : undefined,
      });
    }
    currentEntry = null;
    currentStackTrace = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const parsed = parseLine(line);

    if (parsed.isStackTrace) {
      // This is a continuation of the current entry's stack trace
      currentStackTrace.push(line.trim());
    } else if (parsed.timestamp || parsed.level) {
      // This is a new log entry
      finalizeEntry();
      currentEntry = {
        timestamp: parsed.timestamp,
        level: parsed.level,
        source: parsed.source,
        message: parsed.message,
      };
    } else if (currentEntry) {
      // This might be a continuation of the current message or stack trace
      if (line.startsWith("  ") || line.startsWith("\t")) {
        currentStackTrace.push(line.trim());
      } else {
        currentEntry.message = (currentEntry.message || "") + " " + parsed.message;
      }
    } else {
      // Standalone line without context - create a new entry
      currentEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: parsed.message,
      };
    }
  }

  // Don't forget the last entry
  finalizeEntry();

  return entries;
}

export function groupErrors(logs: LogEntry[]): import("@shared/schema").ErrorGroup[] {
  const errorLogs = logs.filter((log) => log.level === "ERROR" || log.level === "FATAL");
  
  // Group by similar error patterns
  const groups = new Map<string, {
    logs: LogEntry[];
    pattern: string;
  }>();

  for (const log of errorLogs) {
    // Create a pattern key based on the error message structure
    const pattern = createErrorPattern(log.message, log.source);
    
    if (!groups.has(pattern)) {
      groups.set(pattern, { logs: [], pattern });
    }
    groups.get(pattern)!.logs.push(log);
  }

  // Convert to ErrorGroup format
  const result: import("@shared/schema").ErrorGroup[] = [];
  let groupIndex = 0;

  for (const [_, group] of groups) {
    const sortedLogs = group.logs.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const count = group.logs.length;
    let severity: "low" | "medium" | "high" | "critical";
    
    if (group.logs.some((l) => l.level === "FATAL")) {
      severity = "critical";
    } else if (count >= 5) {
      severity = "high";
    } else if (count >= 2) {
      severity = "medium";
    } else {
      severity = "low";
    }

    result.push({
      id: randomUUID(),
      label: `Error Group ${String.fromCharCode(65 + groupIndex)}`,
      count,
      severity,
      firstOccurrence: sortedLogs[0].timestamp,
      lastOccurrence: sortedLogs[sortedLogs.length - 1].timestamp,
      sampleMessage: sortedLogs[0].message,
      relatedLogIds: group.logs.map((l) => l.id),
    });

    groupIndex++;
  }

  // Sort by severity and count
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return result.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });
}

function createErrorPattern(message: string, source?: string): string {
  // Normalize the message to create a pattern
  let pattern = message
    // Remove specific IDs and numbers
    .replace(/#\d+/g, "#ID")
    .replace(/\b\d{4,}\b/g, "NUM")
    // Remove UUIDs
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "UUID")
    // Remove timestamps within message
    .replace(/\d{4}-\d{2}-\d{2}T?\d{2}:\d{2}:\d{2}/g, "TIMESTAMP")
    // Remove IP addresses
    .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, "IP")
    // Normalize to first 100 chars
    .slice(0, 100);

  return `${source || "unknown"}:${pattern}`;
}
