import re
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from api.schemas import LogEntry, ErrorGroup

ISO_TIMESTAMP = re.compile(r'^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)')
COMMON_TIMESTAMP = re.compile(r'^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?)')
LEVEL_PATTERN = re.compile(r'\b(DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|CRITICAL)\b', re.IGNORECASE)
SOURCE_PATTERN = re.compile(r'\[([^\]]+)\]')
STACK_TRACE = re.compile(r'^\s+at\s+')
CAUSED_BY = re.compile(r'^\s*Caused by:', re.IGNORECASE)

def normalize_level(level: str) -> str:
    normalized = level.upper()
    if normalized in ("DEBUG", "INFO", "ERROR", "FATAL"):
        return normalized
    if normalized in ("WARN", "WARNING"):
        return "WARN"
    if normalized == "CRITICAL":
        return "FATAL"
    return "INFO"

def parse_line(line: str) -> Dict[str, Any]:
    result = {
        "message": line.strip(),
        "is_stack_trace": False,
        "timestamp": None,
        "level": None,
        "source": None
    }
    
    if STACK_TRACE.match(line) or CAUSED_BY.match(line):
        result["is_stack_trace"] = True
        return result
    
    working_line = line
    
    iso_match = ISO_TIMESTAMP.match(working_line)
    if iso_match:
        result["timestamp"] = iso_match.group(1)
        working_line = working_line[len(iso_match.group(0)):].strip()
    else:
        common_match = COMMON_TIMESTAMP.match(working_line)
        if common_match:
            result["timestamp"] = common_match.group(1).replace(" ", "T") + "Z"
            working_line = working_line[len(common_match.group(0)):].strip()
    
    level_match = LEVEL_PATTERN.search(working_line)
    if level_match:
        result["level"] = normalize_level(level_match.group(1))
        working_line = working_line.replace(level_match.group(0), "", 1).strip()
    
    source_match = SOURCE_PATTERN.search(working_line)
    if source_match:
        result["source"] = source_match.group(1)
        working_line = working_line.replace(source_match.group(0), "", 1).strip()
    
    result["message"] = working_line.strip()
    return result

def parse_logs(raw_logs: str) -> List[LogEntry]:
    lines = raw_logs.split("\n")
    entries: List[LogEntry] = []
    current_entry: Optional[Dict[str, Any]] = None
    current_stack_trace: List[str] = []
    
    def finalize_entry():
        nonlocal current_entry, current_stack_trace
        if current_entry and current_entry.get("message"):
            entries.append(LogEntry(
                id=str(uuid.uuid4()),
                timestamp=current_entry.get("timestamp") or datetime.utcnow().isoformat() + "Z",
                level=current_entry.get("level") or "INFO",
                message=current_entry.get("message", ""),
                source=current_entry.get("source"),
                stackTrace="\n".join(current_stack_trace) if current_stack_trace else None
            ))
        current_entry = None
        current_stack_trace = []
    
    for line in lines:
        if not line.strip():
            continue
        
        parsed = parse_line(line)
        
        if parsed["is_stack_trace"]:
            current_stack_trace.append(line.strip())
        elif parsed["timestamp"] or parsed["level"]:
            finalize_entry()
            current_entry = {
                "timestamp": parsed["timestamp"],
                "level": parsed["level"],
                "source": parsed["source"],
                "message": parsed["message"]
            }
        elif current_entry:
            if line.startswith("  ") or line.startswith("\t"):
                current_stack_trace.append(line.strip())
            else:
                current_entry["message"] = (current_entry.get("message") or "") + " " + parsed["message"]
        else:
            current_entry = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "level": "INFO",
                "message": parsed["message"]
            }
    
    finalize_entry()
    return entries

def create_error_pattern(message: str, source: Optional[str]) -> str:
    pattern = message
    pattern = re.sub(r'#\d+', '#ID', pattern)
    pattern = re.sub(r'\b\d{4,}\b', 'NUM', pattern)
    pattern = re.sub(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', 'UUID', pattern, flags=re.IGNORECASE)
    pattern = re.sub(r'\d{4}-\d{2}-\d{2}T?\d{2}:\d{2}:\d{2}', 'TIMESTAMP', pattern)
    pattern = re.sub(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', 'IP', pattern)
    return f"{source or 'unknown'}:{pattern[:100]}"

def group_errors(logs: List[LogEntry]) -> List[ErrorGroup]:
    error_logs = [log for log in logs if log.level in ("ERROR", "FATAL")]
    
    groups: Dict[str, Dict[str, Any]] = {}
    
    for log in error_logs:
        pattern = create_error_pattern(log.message, log.source)
        if pattern not in groups:
            groups[pattern] = {"logs": [], "pattern": pattern}
        groups[pattern]["logs"].append(log)
    
    result: List[ErrorGroup] = []
    
    for i, (_, group) in enumerate(groups.items()):
        sorted_logs = sorted(group["logs"], key=lambda x: x.timestamp)
        count = len(group["logs"])
        
        if any(log.level == "FATAL" for log in group["logs"]):
            severity = "critical"
        elif count >= 5:
            severity = "high"
        elif count >= 2:
            severity = "medium"
        else:
            severity = "low"
        
        result.append(ErrorGroup(
            id=str(uuid.uuid4()),
            label=f"Error Group {chr(65 + i)}",
            count=count,
            severity=severity,
            firstOccurrence=sorted_logs[0].timestamp,
            lastOccurrence=sorted_logs[-1].timestamp,
            sampleMessage=sorted_logs[0].message,
            relatedLogIds=[log.id for log in group["logs"]]
        ))
    
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    result.sort(key=lambda x: (severity_order[x.severity], -x.count))
    
    return result
