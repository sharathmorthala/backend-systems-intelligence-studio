import type { AnalyzeLogsResponse, AnalysisHistoryItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  saveAnalysis(analysis: AnalyzeLogsResponse): Promise<AnalyzeLogsResponse>;
  getAnalysis(id: string): Promise<AnalyzeLogsResponse | undefined>;
  getAnalysisHistory(): Promise<AnalysisHistoryItem[]>;
}

export class MemStorage implements IStorage {
  private analyses: Map<string, AnalyzeLogsResponse>;

  constructor() {
    this.analyses = new Map();
  }

  async saveAnalysis(analysis: AnalyzeLogsResponse): Promise<AnalyzeLogsResponse> {
    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  async getAnalysis(id: string): Promise<AnalyzeLogsResponse | undefined> {
    return this.analyses.get(id);
  }

  async getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
    return Array.from(this.analyses.values())
      .map((a) => ({
        id: a.id,
        createdAt: a.createdAt,
        logCount: a.parsedLogs.length,
        errorCount: a.errorGroups.reduce((sum, g) => sum + g.count, 0),
        status: a.status,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
