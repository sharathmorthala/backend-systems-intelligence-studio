from typing import Dict, List, Optional
from api.schemas import AnalyzeLogsResponse, AnalysisHistoryItem

class MemStorage:
    def __init__(self):
        self.analyses: Dict[str, AnalyzeLogsResponse] = {}
    
    async def save_analysis(self, analysis: AnalyzeLogsResponse) -> AnalyzeLogsResponse:
        self.analyses[analysis.id] = analysis
        return analysis
    
    async def get_analysis(self, id: str) -> Optional[AnalyzeLogsResponse]:
        return self.analyses.get(id)
    
    async def get_analysis_history(self) -> List[AnalysisHistoryItem]:
        items = []
        for a in self.analyses.values():
            items.append(AnalysisHistoryItem(
                id=a.id,
                createdAt=a.createdAt,
                logCount=len(a.parsedLogs),
                errorCount=sum(g.count for g in a.errorGroups),
                status=a.status
            ))
        items.sort(key=lambda x: x.createdAt, reverse=True)
        return items

storage = MemStorage()
