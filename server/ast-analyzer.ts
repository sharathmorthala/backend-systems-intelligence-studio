import * as parser from "@babel/parser";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";

// Handle both ESM and CJS imports for @babel/traverse
const traverse = (_traverse as any).default || _traverse;

// Normalized AST node structure for language-agnostic analysis
export interface NormalizedNode {
  type: string;
  name?: string;
  children?: NormalizedNode[];
  location?: {
    line: number;
    column: number;
  };
  metadata?: Record<string, any>;
}

// Risk finding structure - matches existing UI contract
export interface RiskFinding {
  ruleId: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: "blocking" | "thread-safety" | "error-handling" | "performance" | "safety";
  message: string;
  line: number;
  whyItMatters: string;
  suggestedFix: string;
}

// Analysis context for rule evaluation
export interface AnalysisContext {
  language: "javascript" | "java" | "kotlin" | "python";
  scopeStack: string[];
  declaredVariables: Set<string>;
  isAsyncContext: boolean;
  isCoroutineContext: boolean;
  isRequestHandler: boolean;
}

// Rule interface for pluggable rule engine
export interface RiskRule {
  id: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: "blocking" | "thread-safety" | "error-handling" | "performance" | "safety";
  languages: ("javascript" | "java" | "kotlin" | "python")[];
  match(node: NormalizedNode, context: AnalysisContext): boolean;
  buildFinding(node: NormalizedNode, context: AnalysisContext): RiskFinding;
}

// Language detection
export function detectLanguage(code: string): "javascript" | "java" | "kotlin" | "python" | "unknown" {
  const trimmed = code.trim();
  
  // Python indicators
  if (/^(def |class |import |from |async def |if __name__|@\w+)/.test(trimmed) ||
      /:\s*\n\s+(pass|return|raise|print)/.test(code) ||
      /self\.\w+/.test(code)) {
    return "python";
  }
  
  // Kotlin indicators
  if (/\bfun\s+\w+/.test(code) || 
      /\bsuspend\s+fun/.test(code) ||
      /\brunBlocking\s*\{/.test(code) ||
      /\bval\s+\w+\s*[:=]/.test(code) && /\bfun\s/.test(code)) {
    return "kotlin";
  }
  
  // Java indicators
  if (/\bpublic\s+(class|interface|enum|static|void|String)/.test(code) ||
      /\bprivate\s+(static|final|void|String|int|boolean)/.test(code) ||
      /\b(implements|extends)\s+\w+/.test(code) ||
      /@(Override|Service|Controller|Autowired)/.test(code)) {
    return "java";
  }
  
  // JavaScript/TypeScript indicators
  if (/\b(function|const|let|var|=>|async|await|require|import|export)\b/.test(code) ||
      /\bconsole\.\w+/.test(code)) {
    return "javascript";
  }
  
  return "unknown";
}

// JavaScript AST Parser using Babel
function parseJavaScript(code: string): NormalizedNode | null {
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
    });
    
    return normalizeJSAst(ast);
  } catch (error) {
    console.error("JavaScript parsing error:", error);
    return null;
  }
}

function normalizeJSAst(ast: any): NormalizedNode {
  const normalized: NormalizedNode = {
    type: ast.type,
    children: [],
    metadata: {},
  };
  
  if (ast.loc) {
    normalized.location = {
      line: ast.loc.start.line,
      column: ast.loc.start.column,
    };
  }
  
  // Store relevant metadata
  if (ast.name) normalized.name = ast.name;
  if (ast.id?.name) normalized.metadata!.identifier = ast.id.name;
  if (ast.callee?.name) normalized.metadata!.callee = ast.callee.name;
  if (ast.property?.name) normalized.metadata!.property = ast.property.name;
  if (ast.object) normalized.metadata!.hasObject = true;
  if (ast.async) normalized.metadata!.async = true;
  if (ast.kind) normalized.metadata!.kind = ast.kind;
  
  // Recursively normalize children
  const childKeys = ["body", "declarations", "expression", "left", "right", 
                     "object", "property", "callee", "arguments", "init",
                     "consequent", "alternate", "test", "params", "block",
                     "handler", "param", "cases"];
  
  for (const key of childKeys) {
    if (ast[key]) {
      if (Array.isArray(ast[key])) {
        for (const child of ast[key]) {
          if (child && typeof child === "object" && child.type) {
            normalized.children!.push(normalizeJSAst(child));
          }
        }
      } else if (typeof ast[key] === "object" && ast[key].type) {
        normalized.children!.push(normalizeJSAst(ast[key]));
      }
    }
  }
  
  return normalized;
}

// JavaScript-specific analysis using Babel traverse
function analyzeJavaScript(code: string): RiskFinding[] {
  const findings: RiskFinding[] = [];
  
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
    });
    
    const declaredVariables = new Set<string>();
    const usedVariables: Array<{ name: string; line: number }> = [];
    const memberExpressions: Array<{ path: string; line: number; depth: number; node: any }> = [];
    
    // First pass: collect declarations
    traverse(ast, {
      VariableDeclarator(path: any) {
        if (t.isIdentifier(path.node.id)) {
          declaredVariables.add(path.node.id.name);
        }
      },
      FunctionDeclaration(path: any) {
        if (path.node.id) {
          declaredVariables.add(path.node.id.name);
        }
        path.node.params.forEach((param: any) => {
          if (t.isIdentifier(param)) {
            declaredVariables.add(param.name);
          }
        });
      },
      FunctionExpression(path: any) {
        path.node.params.forEach((param: any) => {
          if (t.isIdentifier(param)) {
            declaredVariables.add(param.name);
          }
        });
      },
      ArrowFunctionExpression(path: any) {
        path.node.params.forEach((param: any) => {
          if (t.isIdentifier(param)) {
            declaredVariables.add(param.name);
          }
        });
      },
      CatchClause(path: any) {
        if (path.node.param && t.isIdentifier(path.node.param)) {
          declaredVariables.add(path.node.param.name);
        }
      },
      ImportDeclaration(path: any) {
        path.node.specifiers.forEach((spec: any) => {
          if (t.isImportSpecifier(spec) || t.isImportDefaultSpecifier(spec)) {
            declaredVariables.add(spec.local.name);
          }
        });
      },
    });
    
    // Add built-ins
    const builtIns = ["console", "window", "document", "global", "process", "require", 
                      "module", "exports", "__dirname", "__filename", "Buffer", "Promise",
                      "Array", "Object", "String", "Number", "Boolean", "Math", "Date",
                      "JSON", "Error", "undefined", "null", "NaN", "Infinity", "setTimeout",
                      "setInterval", "clearTimeout", "clearInterval", "fetch", "URL",
                      "URLSearchParams", "Map", "Set", "WeakMap", "WeakSet", "Symbol",
                      "Proxy", "Reflect", "parseInt", "parseFloat", "isNaN", "isFinite",
                      "encodeURI", "decodeURI", "encodeURIComponent", "decodeURIComponent",
                      "eval", "Function", "RegExp", "TextEncoder", "TextDecoder"];
    builtIns.forEach(b => declaredVariables.add(b));
    
    // Second pass: find issues
    traverse(ast, {
      Identifier(path: any) {
        // Skip if it's a declaration, property access, or import
        if (path.parent && t.isMemberExpression(path.parent) && path.parent.property === path.node) {
          return;
        }
        if (t.isVariableDeclarator(path.parent) && path.parent.id === path.node) {
          return;
        }
        if (t.isFunctionDeclaration(path.parent) && path.parent.id === path.node) {
          return;
        }
        if (t.isProperty(path.parent) && path.parent.key === path.node) {
          return;
        }
        if (t.isObjectProperty(path.parent) && path.parent.key === path.node) {
          return;
        }
        if (t.isImportSpecifier(path.parent) || t.isImportDefaultSpecifier(path.parent)) {
          return;
        }
        if (t.isCatchClause(path.parent)) {
          return;
        }
        
        const name = path.node.name;
        if (!declaredVariables.has(name)) {
          usedVariables.push({
            name,
            line: path.node.loc?.start.line || 1,
          });
        }
      },
      
      MemberExpression(path: any) {
        // Detect deep property access chains (obj.a.b.c)
        let depth = 0;
        let current: any = path.node;
        const parts: string[] = [];
        
        while (t.isMemberExpression(current)) {
          depth++;
          if (t.isIdentifier(current.property)) {
            parts.unshift(current.property.name);
          }
          current = current.object;
        }
        
        if (t.isIdentifier(current)) {
          parts.unshift(current.name);
        }
        
        if (depth >= 2) {
          memberExpressions.push({
            path: parts.join("."),
            line: path.node.loc?.start.line || 1,
            depth,
            node: path.node,
          });
        }
      },
      
      CallExpression(path: any) {
        // Detect blocking calls in event loop context
        if (t.isMemberExpression(path.node.callee)) {
          const callee = path.node.callee;
          if (t.isIdentifier(callee.property)) {
            const method = callee.property.name;
            const blockingMethods = ["readFileSync", "writeFileSync", "execSync", 
                                     "spawnSync", "existsSync", "statSync", "readdirSync"];
            
            if (blockingMethods.includes(method)) {
              findings.push({
                ruleId: "JS_BLOCKING_CALL",
                severity: "HIGH",
                category: "blocking",
                message: `Blocking call '${method}' detected`,
                line: path.node.loc?.start.line || 1,
                whyItMatters: "Blocking calls freeze the event loop, causing latency spikes and preventing concurrent request handling.",
                suggestedFix: `Use async version: ${method.replace("Sync", "")} with await or callbacks.`,
              });
            }
          }
        }
      },
    });
    
    // Report undeclared variables (deduplicated)
    const reportedVars = new Set<string>();
    for (const v of usedVariables) {
      if (!reportedVars.has(v.name)) {
        reportedVars.add(v.name);
        findings.push({
          ruleId: "JS_UNDECLARED_VARIABLE",
          severity: "HIGH",
          category: "safety",
          message: `Undeclared variable '${v.name}' used`,
          line: v.line,
          whyItMatters: "Using undeclared variables causes ReferenceError at runtime, crashing the application.",
          suggestedFix: `Declare '${v.name}' with const, let, or var before use, or check if it should be imported.`,
        });
      }
    }
    
    // Report unsafe property access
    for (const expr of memberExpressions) {
      findings.push({
        ruleId: "JS_UNSAFE_PROPERTY_ACCESS",
        severity: "MEDIUM",
        category: "safety",
        message: `Unsafe property access on '${expr.path}' (depth: ${expr.depth})`,
        line: expr.line,
        whyItMatters: "Deep property chains may fail if intermediate objects are undefined or null.",
        suggestedFix: `Use optional chaining: ${expr.path.split(".").join("?.")} or validate each level.`,
      });
    }
    
  } catch (error) {
    console.error("JavaScript analysis error:", error);
  }
  
  return findings;
}

// Java/Kotlin AST-like analysis (structural parsing)
function analyzeJavaKotlin(code: string, language: "java" | "kotlin"): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const lines = code.split("\n");
  
  // Track context
  let inCatchBlock = false;
  let catchStartLine = 0;
  let catchBlockContent = "";
  let braceDepth = 0;
  let inAsyncContext = false;
  let inSuspendFunction = false;
  let inRequestHandler = false;
  
  // Detect request handler methods
  const requestHandlerPatterns = [
    /@(GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping|Controller)/,
    /@(GET|POST|PUT|DELETE|Path)/,
    /public\s+\w+\s+(doGet|doPost|service)\s*\(/,
    /suspend\s+fun\s+\w+.*Route/,
  ];
  
  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const trimmed = line.trim();
    
    // Track if we're in a request handler
    if (requestHandlerPatterns.some(p => p.test(line))) {
      inRequestHandler = true;
    }
    
    // Track suspend functions (Kotlin)
    if (language === "kotlin" && /suspend\s+fun/.test(line)) {
      inSuspendFunction = true;
    }
    
    // Track brace depth for context
    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;
    
    if (braceDepth === 0) {
      inRequestHandler = false;
      inSuspendFunction = false;
    }
    
    // Rule: Blocking I/O in request handlers
    if (inRequestHandler || inSuspendFunction) {
      // Blocking network calls
      if (/\.execute\s*\(/.test(line)) {
        findings.push({
          ruleId: language === "kotlin" ? "KT_BLOCKING_IN_COROUTINE" : "JAVA_BLOCKING_IO",
          severity: "HIGH",
          category: "blocking",
          message: "Blocking HTTP call in " + (inSuspendFunction ? "suspend function" : "request handler"),
          line: lineNum,
          whyItMatters: "Blocking calls in request handlers cause thread starvation and reduce throughput.",
          suggestedFix: language === "kotlin" 
            ? "Use suspending HTTP client (Ktor, Fuel) or wrap in withContext(Dispatchers.IO)"
            : "Use async HTTP client (OkHttp enqueue, WebClient, CompletableFuture)",
        });
      }
      
      // Thread.sleep
      if (/Thread\.sleep\s*\(/.test(line)) {
        findings.push({
          ruleId: language === "kotlin" ? "KT_THREAD_SLEEP_IN_COROUTINE" : "JAVA_THREAD_SLEEP",
          severity: "HIGH",
          category: "blocking",
          message: "Thread.sleep() in " + (inSuspendFunction ? "suspend function" : "server code"),
          line: lineNum,
          whyItMatters: "Thread.sleep blocks the thread, wasting resources and delaying other requests.",
          suggestedFix: language === "kotlin"
            ? "Use delay() from kotlinx.coroutines instead"
            : "Consider using ScheduledExecutorService or reactive delays",
        });
      }
    }
    
    // Kotlin: runBlocking misuse
    if (language === "kotlin" && /runBlocking\s*\{/.test(line)) {
      if (inSuspendFunction || inRequestHandler) {
        findings.push({
          ruleId: "KT_RUNBLOCKING_MISUSE",
          severity: "HIGH",
          category: "blocking",
          message: "runBlocking used inside suspend function or request handler",
          line: lineNum,
          whyItMatters: "runBlocking blocks the current thread, defeating the purpose of coroutines.",
          suggestedFix: "Remove runBlocking and use suspend functions directly, or use coroutineScope {}",
        });
      }
    }
    
    // Track catch blocks
    if (/catch\s*\(/.test(line)) {
      inCatchBlock = true;
      catchStartLine = lineNum;
      catchBlockContent = "";
    }
    
    if (inCatchBlock) {
      catchBlockContent += line + "\n";
      
      // Check if catch block ends
      if (/\}\s*(catch|finally)?/.test(line) && braceDepth <= (lines.slice(0, catchStartLine).join("\n").match(/\{/g) || []).length) {
        // Analyze catch block content
        const contentWithoutComments = catchBlockContent
          .replace(/\/\/.*$/gm, "")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .trim();
        
        // Empty catch block detection
        const statements = contentWithoutComments
          .split(/[;\n]/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith("catch") && s !== "{" && s !== "}");
        
        if (statements.length === 0 || 
            (statements.length === 1 && /^(catch|}\s*catch|\{|\})/.test(statements[0]))) {
          findings.push({
            ruleId: language === "kotlin" ? "KT_EMPTY_CATCH" : "JAVA_EMPTY_CATCH",
            severity: "HIGH",
            category: "error-handling",
            message: "Empty catch block swallows exception",
            line: catchStartLine,
            whyItMatters: "Silent exception handling hides bugs and makes debugging extremely difficult.",
            suggestedFix: "Log the exception, rethrow, or handle appropriately. Never silently ignore.",
          });
        }
        
        inCatchBlock = false;
      }
    }
    
    // Java: Response without try-with-resources
    if (language === "java" && /Response\s+\w+\s*=/.test(line)) {
      // Check if previous lines have try(
      const prevLines = lines.slice(Math.max(0, i - 3), i).join("\n");
      if (!/try\s*\(/.test(prevLines)) {
        findings.push({
          ruleId: "JAVA_RESOURCE_LEAK",
          severity: "HIGH",
          category: "error-handling",
          message: "HTTP Response not using try-with-resources",
          line: lineNum,
          whyItMatters: "Unclosed responses leak connections, eventually exhausting the connection pool.",
          suggestedFix: "Wrap in try-with-resources: try (Response response = ...) { ... }",
        });
      }
    }
    
    // Missing status validation
    if (/\.execute\s*\(/.test(line)) {
      const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join("\n");
      if (!/\.isSuccessful\s*\(|\.code\s*\(|response\.code|status/.test(nextLines)) {
        findings.push({
          ruleId: language === "kotlin" ? "KT_MISSING_STATUS_CHECK" : "JAVA_MISSING_STATUS_CHECK",
          severity: "MEDIUM",
          category: "error-handling",
          message: "HTTP response status not validated",
          line: lineNum,
          whyItMatters: "Unvalidated responses may contain error data that causes downstream failures.",
          suggestedFix: "Check response.isSuccessful() or response.code() before processing body",
        });
      }
    }
    
    // Null safety - body().string()
    if (/\.body\s*\(\s*\)\s*\.string\s*\(/.test(line) || /\.body\s*\(\s*\)\s*\.bytes\s*\(/.test(line)) {
      findings.push({
        ruleId: language === "kotlin" ? "KT_NULL_BODY_ACCESS" : "JAVA_NULL_BODY_ACCESS",
        severity: "MEDIUM",
        category: "safety",
        message: "Response body accessed without null check",
        line: lineNum,
        whyItMatters: "Response body can be null, causing NullPointerException in production.",
        suggestedFix: language === "kotlin"
          ? "Use response.body?.string() with null-safe operator"
          : "Check if response.body() != null before calling .string()",
      });
    }
  });
  
  return findings;
}

// Python AST-like analysis
function analyzePython(code: string): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const lines = code.split("\n");
  
  let inAsyncFunction = false;
  let asyncFunctionIndent = 0;
  let inExceptBlock = false;
  let exceptStartLine = 0;
  let exceptIndent = 0;
  
  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const trimmed = line.trim();
    const indent = line.search(/\S/);
    
    // Track async function context
    if (/^async\s+def\s/.test(trimmed)) {
      inAsyncFunction = true;
      asyncFunctionIndent = indent;
    }
    
    // Exit async function when dedented
    if (inAsyncFunction && indent <= asyncFunctionIndent && trimmed.length > 0 && 
        !/^async\s+def/.test(trimmed) && !/^#/.test(trimmed)) {
      if (!/^\s/.test(line) && trimmed.length > 0) {
        inAsyncFunction = false;
      }
    }
    
    // Rule: Broad exception catch
    if (/except\s+Exception\s*:/.test(trimmed) || /except\s+BaseException\s*:/.test(trimmed)) {
      findings.push({
        ruleId: "PY_BROAD_EXCEPT",
        severity: "MEDIUM",
        category: "error-handling",
        message: "Broad exception catch (except Exception)",
        line: lineNum,
        whyItMatters: "Catching Exception catches too many error types, hiding bugs and control flow issues.",
        suggestedFix: "Catch specific exceptions like ValueError, IOError, or create custom exception types.",
      });
    }
    
    // Rule: Bare except
    if (/^except\s*:/.test(trimmed)) {
      findings.push({
        ruleId: "PY_BARE_EXCEPT",
        severity: "HIGH",
        category: "error-handling",
        message: "Bare except clause catches all exceptions including SystemExit and KeyboardInterrupt",
        line: lineNum,
        whyItMatters: "Bare except catches system signals, making the program difficult to terminate.",
        suggestedFix: "Use 'except Exception:' at minimum, or better yet, catch specific exceptions.",
      });
    }
    
    // Track except block for empty detection
    if (/^except/.test(trimmed)) {
      inExceptBlock = true;
      exceptStartLine = lineNum;
      exceptIndent = indent;
    }
    
    if (inExceptBlock && indent <= exceptIndent && i > exceptStartLine - 1) {
      const blockContent = lines.slice(exceptStartLine, i)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith("#") && !l.startsWith("except"));
      
      if (blockContent.length === 1 && blockContent[0] === "pass") {
        findings.push({
          ruleId: "PY_SILENT_EXCEPT",
          severity: "HIGH",
          category: "error-handling",
          message: "Silent exception handler (except: pass)",
          line: exceptStartLine,
          whyItMatters: "Silently passing on exceptions hides errors and makes debugging impossible.",
          suggestedFix: "Log the exception, re-raise, or handle appropriately.",
        });
      }
      inExceptBlock = false;
    }
    
    // Rule: Blocking calls in async functions
    if (inAsyncFunction) {
      const blockingPatterns = [
        { pattern: /time\.sleep\s*\(/, name: "time.sleep()" },
        { pattern: /requests\.(get|post|put|delete|patch)\s*\(/, name: "requests.X()" },
        { pattern: /urllib\.request\.urlopen\s*\(/, name: "urllib.request.urlopen()" },
        { pattern: /open\s*\([^)]+\)\.read\s*\(/, name: "file.read()" },
        { pattern: /subprocess\.(run|call|check_output)\s*\(/, name: "subprocess blocking call" },
      ];
      
      for (const { pattern, name } of blockingPatterns) {
        if (pattern.test(trimmed)) {
          findings.push({
            ruleId: "PY_BLOCKING_IN_ASYNC",
            severity: "HIGH",
            category: "blocking",
            message: `Blocking call '${name}' inside async function`,
            line: lineNum,
            whyItMatters: "Blocking calls in async functions freeze the event loop, negating concurrency benefits.",
            suggestedFix: name.includes("sleep") 
              ? "Use 'await asyncio.sleep()' instead"
              : name.includes("requests")
                ? "Use 'aiohttp' or 'httpx' with await"
                : "Use async alternatives or run_in_executor()",
          });
        }
      }
    }
  });
  
  return findings;
}

// Main analysis function - integrates all language analyzers
export function analyzeCode(code: string, forcedLanguage?: string): {
  findings: RiskFinding[];
  language: string;
  linesScanned: number;
  parserUsed: string;
  limitations: string[];
} {
  const language = forcedLanguage || detectLanguage(code);
  const lines = code.split("\n").length;
  let findings: RiskFinding[] = [];
  let parserUsed = "unknown";
  const limitations: string[] = [];
  
  switch (language) {
    case "javascript":
      parserUsed = "@babel/parser (AST)";
      findings = analyzeJavaScript(code);
      break;
      
    case "java":
      parserUsed = "structural-parser (regex+context)";
      findings = analyzeJavaKotlin(code, "java");
      limitations.push("Java analysis uses pattern matching, not full AST. Some edge cases may be missed.");
      break;
      
    case "kotlin":
      parserUsed = "structural-parser (regex+context)";
      findings = analyzeJavaKotlin(code, "kotlin");
      limitations.push("Kotlin analysis uses pattern matching, not full AST. Some edge cases may be missed.");
      break;
      
    case "python":
      parserUsed = "structural-parser (regex+context)";
      findings = analyzePython(code);
      limitations.push("Python analysis uses pattern matching, not full AST. Some edge cases may be missed.");
      break;
      
    default:
      parserUsed = "none";
      limitations.push("Language could not be detected. Please ensure code is valid JavaScript, Java, Kotlin, or Python.");
  }
  
  // Sort findings by severity and line number
  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  findings.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    return severityDiff !== 0 ? severityDiff : a.line - b.line;
  });
  
  return {
    findings,
    language,
    linesScanned: lines,
    parserUsed,
    limitations,
  };
}

// UI-compatible risk format
export interface UICodeRisk {
  line: number;
  type: string;
  description: string;
  severity: "high" | "medium" | "low";
}

// Convert AST findings to existing UI format
export function convertToUIFormat(analysisResult: ReturnType<typeof analyzeCode>): {
  blockingCalls: UICodeRisk[];
  threadSafetyRisks: UICodeRisk[];
  errorHandlingGaps: UICodeRisk[];
  performanceConcerns: UICodeRisk[];
  bestPractices: string[];
  summary: string;
} {
  const blockingCalls: UICodeRisk[] = [];
  const threadSafetyRisks: UICodeRisk[] = [];
  const errorHandlingGaps: UICodeRisk[] = [];
  const performanceConcerns: UICodeRisk[] = [];
  const bestPracticesSet = new Set<string>();
  
  for (const finding of analysisResult.findings) {
    const item: UICodeRisk = {
      line: finding.line,
      type: finding.ruleId.replace(/_/g, " ").replace(/^(JS|JAVA|KT|PY)\s/, ""),
      description: finding.message + ". " + finding.whyItMatters,
      severity: finding.severity.toLowerCase() as "high" | "medium" | "low",
    };
    
    switch (finding.category) {
      case "blocking":
        blockingCalls.push(item);
        bestPracticesSet.add(finding.suggestedFix);
        break;
      case "thread-safety":
        threadSafetyRisks.push(item);
        bestPracticesSet.add(finding.suggestedFix);
        break;
      case "error-handling":
      case "safety":
        errorHandlingGaps.push(item);
        bestPracticesSet.add(finding.suggestedFix);
        break;
      case "performance":
        performanceConcerns.push(item);
        bestPracticesSet.add(finding.suggestedFix);
        break;
    }
  }
  
  const totalIssues = blockingCalls.length + threadSafetyRisks.length + 
                      errorHandlingGaps.length + performanceConcerns.length;
  
  const highCount = analysisResult.findings.filter(f => f.severity === "HIGH").length;
  const mediumCount = analysisResult.findings.filter(f => f.severity === "MEDIUM").length;
  const lowCount = analysisResult.findings.filter(f => f.severity === "LOW").length;
  
  let summary = `Scanned ${analysisResult.linesScanned} lines of ${analysisResult.language} code using ${analysisResult.parserUsed}. `;
  
  if (totalIssues > 0) {
    summary += `Found ${totalIssues} risks: ${highCount} high, ${mediumCount} medium, ${lowCount} low severity.`;
  } else {
    summary += "No risks detected by current ruleset. This does not guarantee correctness.";
  }
  
  if (analysisResult.limitations.length > 0) {
    summary += " " + analysisResult.limitations[0];
  }
  
  const bestPractices = Array.from(bestPracticesSet);
  if (bestPractices.length === 0 && totalIssues === 0) {
    bestPractices.push("No specific issues detected. Consider running additional static analysis tools.");
    bestPractices.push("This scanner focuses on backend risks, not style or formatting.");
  }
  
  return {
    blockingCalls,
    threadSafetyRisks,
    errorHandlingGaps,
    performanceConcerns,
    bestPractices,
    summary,
  };
}
