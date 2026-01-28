import re
from typing import List, Dict, Any, Literal
from dataclasses import dataclass

@dataclass
class RiskFinding:
    rule_id: str
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    category: Literal["blocking", "thread-safety", "error-handling", "performance", "safety"]
    message: str
    line: int
    why_it_matters: str
    suggested_fix: str

@dataclass
class AnalysisResult:
    language: str
    parser_used: str
    lines_scanned: int
    findings: List[RiskFinding]
    limitations: List[str]

def detect_language(code: str) -> str:
    trimmed = code.strip()
    
    if re.match(r'^(def |class |import |from |async def |if __name__|@\w+)', trimmed) or \
       re.search(r':\s*\n\s+(pass|return|raise|print)', code) or \
       re.search(r'self\.\w+', code):
        return "python"
    
    if re.search(r'\bfun\s+\w+', code) or \
       re.search(r'\bsuspend\s+fun', code) or \
       re.search(r'\brunBlocking\s*\{', code) or \
       (re.search(r'\bval\s+\w+\s*[:=]', code) and re.search(r'\bfun\s', code)):
        return "kotlin"
    
    if re.search(r'\bpublic\s+(class|interface|enum|static|void|String)', code) or \
       re.search(r'\bprivate\s+(static|final|void|String|int|boolean)', code) or \
       re.search(r'\b(implements|extends)\s+\w+', code) or \
       re.search(r'@(Override|Service|Controller|Autowired)', code):
        return "java"
    
    if re.search(r'\b(function|const|let|var|=>|async|await|require|import|export)\b', code) or \
       re.search(r'\bconsole\.\w+', code):
        return "javascript"
    
    return "unknown"

def analyze_javascript(code: str) -> List[RiskFinding]:
    findings = []
    lines = code.split('\n')
    
    blocking_methods = ["readFileSync", "writeFileSync", "execSync", "spawnSync", "existsSync", "statSync", "readdirSync"]
    
    for i, line in enumerate(lines):
        line_num = i + 1
        
        for method in blocking_methods:
            if method in line:
                findings.append(RiskFinding(
                    rule_id="JS_BLOCKING_CALL",
                    severity="HIGH",
                    category="blocking",
                    message=f"Blocking call '{method}' detected",
                    line=line_num,
                    why_it_matters="Blocking calls freeze the event loop, causing latency spikes and preventing concurrent request handling.",
                    suggested_fix=f"Use async version: {method.replace('Sync', '')} with await or callbacks."
                ))
        
        if re.search(r'catch\s*\([^)]*\)\s*\{\s*\}', line):
            findings.append(RiskFinding(
                rule_id="JS_EMPTY_CATCH",
                severity="HIGH",
                category="error-handling",
                message="Empty catch block swallows exception",
                line=line_num,
                why_it_matters="Silent exception handling hides bugs and makes debugging extremely difficult.",
                suggested_fix="Log the exception, rethrow, or handle appropriately. Never silently ignore."
            ))
    
    return findings

def analyze_java_kotlin(code: str, language: str) -> List[RiskFinding]:
    findings = []
    lines = code.split('\n')
    
    in_catch_block = False
    catch_start_line = 0
    catch_block_content = ""
    brace_depth = 0
    in_suspend_function = False
    in_request_handler = False
    
    request_handler_patterns = [
        re.compile(r'@(GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping|Controller)'),
        re.compile(r'@(GET|POST|PUT|DELETE|Path)'),
        re.compile(r'public\s+\w+\s+(doGet|doPost|service)\s*\('),
        re.compile(r'suspend\s+fun\s+\w+.*Route'),
    ]
    
    for i, line in enumerate(lines):
        line_num = i + 1
        
        if any(p.search(line) for p in request_handler_patterns):
            in_request_handler = True
        
        if language == "kotlin" and re.search(r'suspend\s+fun', line):
            in_suspend_function = True
        
        brace_depth += line.count('{') - line.count('}')
        
        if brace_depth == 0:
            in_request_handler = False
            in_suspend_function = False
        
        if in_request_handler or in_suspend_function:
            if re.search(r'\.execute\s*\(', line):
                findings.append(RiskFinding(
                    rule_id=f"{language.upper()}_BLOCKING_IO",
                    severity="HIGH",
                    category="blocking",
                    message=f"Blocking HTTP call in {'suspend function' if in_suspend_function else 'request handler'}",
                    line=line_num,
                    why_it_matters="Blocking calls in request handlers cause thread starvation and reduce throughput.",
                    suggested_fix="Use async HTTP client (OkHttp enqueue, WebClient) or withContext(Dispatchers.IO)" if language == "kotlin" else "Use async HTTP client"
                ))
            
            if re.search(r'Thread\.sleep\s*\(', line):
                findings.append(RiskFinding(
                    rule_id=f"{language.upper()}_THREAD_SLEEP",
                    severity="HIGH",
                    category="blocking",
                    message=f"Thread.sleep() in {'suspend function' if in_suspend_function else 'server code'}",
                    line=line_num,
                    why_it_matters="Thread.sleep blocks the thread, wasting resources and delaying other requests.",
                    suggested_fix="Use delay() from kotlinx.coroutines instead" if language == "kotlin" else "Consider using ScheduledExecutorService"
                ))
        
        if language == "kotlin" and re.search(r'runBlocking\s*\{', line):
            if in_suspend_function or in_request_handler:
                findings.append(RiskFinding(
                    rule_id="KT_RUNBLOCKING_MISUSE",
                    severity="HIGH",
                    category="blocking",
                    message="runBlocking used inside suspend function or request handler",
                    line=line_num,
                    why_it_matters="runBlocking blocks the current thread, defeating the purpose of coroutines.",
                    suggested_fix="Remove runBlocking and use suspend functions directly, or use coroutineScope {}"
                ))
        
        if re.search(r'catch\s*\(', line):
            in_catch_block = True
            catch_start_line = line_num
            catch_block_content = ""
        
        if in_catch_block:
            catch_block_content += line + "\n"
            
            if brace_depth <= 0 and '}' in line:
                content_without_comments = re.sub(r'//.*$', '', catch_block_content, flags=re.MULTILINE)
                content_without_comments = re.sub(r'/\*[\s\S]*?\*/', '', content_without_comments)
                statements = [s.strip() for s in content_without_comments.split(';') if s.strip() and not s.strip().startswith('catch') and s.strip() not in ('{', '}')]
                
                if len(statements) == 0 or (len(statements) == 1 and re.match(r'^(catch|}\s*catch|\{|\})$', statements[0])):
                    findings.append(RiskFinding(
                        rule_id=f"{language.upper()}_EMPTY_CATCH",
                        severity="HIGH",
                        category="error-handling",
                        message="Empty catch block swallows exception",
                        line=catch_start_line,
                        why_it_matters="Silent exception handling hides bugs and makes debugging extremely difficult.",
                        suggested_fix="Log the exception, rethrow, or handle appropriately. Never silently ignore."
                    ))
                
                in_catch_block = False
        
        if language == "java" and re.search(r'Response\s+\w+\s*=', line):
            prev_lines = '\n'.join(lines[max(0, i-3):i])
            if not re.search(r'try\s*\(', prev_lines):
                findings.append(RiskFinding(
                    rule_id="JAVA_RESOURCE_LEAK",
                    severity="HIGH",
                    category="error-handling",
                    message="HTTP Response not using try-with-resources",
                    line=line_num,
                    why_it_matters="Unclosed responses leak connections, eventually exhausting the connection pool.",
                    suggested_fix="Wrap in try-with-resources: try (Response response = ...) { ... }"
                ))
        
        if re.search(r'\.body\s*\(\s*\)\s*\.string\s*\(', line) or re.search(r'\.body\s*\(\s*\)\s*\.bytes\s*\(', line):
            findings.append(RiskFinding(
                rule_id=f"{language.upper()}_NULL_BODY_ACCESS",
                severity="MEDIUM",
                category="safety",
                message="Response body accessed without null check",
                line=line_num,
                why_it_matters="Response body can be null, causing NullPointerException in production.",
                suggested_fix="Use response.body?.string() with null-safe operator" if language == "kotlin" else "Check if response.body() != null before calling .string()"
            ))
    
    return findings

def analyze_python(code: str) -> List[RiskFinding]:
    findings = []
    lines = code.split('\n')
    
    in_async_function = False
    async_function_indent = 0
    in_except_block = False
    except_start_line = 0
    except_indent = 0
    
    for i, line in enumerate(lines):
        line_num = i + 1
        trimmed = line.strip()
        indent = len(line) - len(line.lstrip()) if line.strip() else 0
        
        if re.match(r'^async\s+def\s', trimmed):
            in_async_function = True
            async_function_indent = indent
        
        if in_async_function and indent <= async_function_indent and trimmed and not re.match(r'^async\s+def', trimmed) and not trimmed.startswith('#'):
            if not line.startswith(' ') and trimmed:
                in_async_function = False
        
        if re.search(r'except\s+Exception\s*:', trimmed) or re.search(r'except\s+BaseException\s*:', trimmed):
            findings.append(RiskFinding(
                rule_id="PY_BROAD_EXCEPT",
                severity="MEDIUM",
                category="error-handling",
                message="Broad exception catch (except Exception)",
                line=line_num,
                why_it_matters="Catching Exception catches too many error types, hiding bugs and control flow issues.",
                suggested_fix="Catch specific exceptions like ValueError, IOError, or create custom exception types."
            ))
        
        if re.match(r'^except\s*:', trimmed):
            findings.append(RiskFinding(
                rule_id="PY_BARE_EXCEPT",
                severity="HIGH",
                category="error-handling",
                message="Bare except clause catches all exceptions including SystemExit and KeyboardInterrupt",
                line=line_num,
                why_it_matters="Bare except catches system signals, making the program difficult to terminate.",
                suggested_fix="Use 'except Exception:' at minimum, or better yet, catch specific exceptions."
            ))
        
        if re.match(r'^except', trimmed):
            in_except_block = True
            except_start_line = line_num
            except_indent = indent
        
        if in_except_block and indent <= except_indent and i > except_start_line - 1:
            block_content = [l.strip() for l in lines[except_start_line:i] if l.strip() and not l.strip().startswith('#') and not l.strip().startswith('except')]
            
            if len(block_content) == 1 and block_content[0] == "pass":
                findings.append(RiskFinding(
                    rule_id="PY_SILENT_EXCEPT",
                    severity="HIGH",
                    category="error-handling",
                    message="Silent exception handler (except: pass)",
                    line=except_start_line,
                    why_it_matters="Silently passing on exceptions hides errors and makes debugging impossible.",
                    suggested_fix="Log the exception, re-raise, or handle appropriately."
                ))
            in_except_block = False
        
        if in_async_function:
            blocking_patterns = [
                (re.compile(r'time\.sleep\s*\('), "time.sleep()"),
                (re.compile(r'requests\.(get|post|put|delete|patch)\s*\('), "requests.X()"),
                (re.compile(r'urllib\.request\.urlopen\s*\('), "urllib.request.urlopen()"),
                (re.compile(r'open\s*\([^)]+\)\.read\s*\('), "file.read()"),
                (re.compile(r'subprocess\.(run|call|check_output)\s*\('), "subprocess blocking call"),
            ]
            
            for pattern, name in blocking_patterns:
                if pattern.search(trimmed):
                    findings.append(RiskFinding(
                        rule_id="PY_BLOCKING_IN_ASYNC",
                        severity="HIGH",
                        category="blocking",
                        message=f"Blocking call '{name}' in async function",
                        line=line_num,
                        why_it_matters="Blocking calls in async functions block the event loop, defeating async benefits.",
                        suggested_fix=f"Use async alternative: asyncio.sleep(), aiohttp, aiofiles, asyncio.create_subprocess_exec()"
                    ))
    
    return findings

def analyze_code(code: str) -> AnalysisResult:
    language = detect_language(code)
    lines_scanned = len(code.split('\n'))
    
    if language == "javascript":
        findings = analyze_javascript(code)
        parser_used = "Regex-based structural analysis"
    elif language == "java":
        findings = analyze_java_kotlin(code, "java")
        parser_used = "Regex-based structural analysis"
    elif language == "kotlin":
        findings = analyze_java_kotlin(code, "kotlin")
        parser_used = "Regex-based structural analysis"
    elif language == "python":
        findings = analyze_python(code)
        parser_used = "Regex-based structural analysis"
    else:
        findings = []
        parser_used = "No parser available"
    
    limitations = []
    if language == "unknown":
        limitations.append("Could not detect language; analysis may be incomplete.")
    
    return AnalysisResult(
        language=language,
        parser_used=parser_used,
        lines_scanned=lines_scanned,
        findings=findings,
        limitations=limitations
    )

def convert_to_ui_format(result: AnalysisResult) -> Dict[str, Any]:
    blocking_calls = []
    thread_safety_risks = []
    error_handling_gaps = []
    performance_concerns = []
    
    for finding in result.findings:
        risk = {
            "line": finding.line,
            "type": finding.message.split("'")[0].strip() if "'" in finding.message else finding.message[:30],
            "description": finding.message,
            "severity": finding.severity.lower()
        }
        
        if finding.category == "blocking":
            blocking_calls.append(risk)
        elif finding.category == "thread-safety":
            thread_safety_risks.append(risk)
        elif finding.category == "error-handling":
            error_handling_gaps.append(risk)
        elif finding.category == "performance":
            performance_concerns.append(risk)
        elif finding.category == "safety":
            error_handling_gaps.append(risk)
    
    best_practices = []
    if any(f.category == "blocking" for f in result.findings):
        best_practices.append("Use asynchronous APIs for I/O operations to avoid blocking.")
    if any(f.category == "error-handling" for f in result.findings):
        best_practices.append("Always handle exceptions explicitly and log relevant context.")
    if any(f.category == "safety" for f in result.findings):
        best_practices.append("Add null checks and validate inputs before use.")
    
    if not best_practices:
        best_practices.append("No specific issues detected. Consider running additional static analysis tools.")
    
    return {
        "blockingCalls": blocking_calls,
        "threadSafetyRisks": thread_safety_risks,
        "errorHandlingGaps": error_handling_gaps,
        "performanceConcerns": performance_concerns,
        "bestPractices": best_practices
    }
