import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { spawn, ChildProcess } from "child_process";

const FASTAPI_URL = "http://127.0.0.1:5001";
let fastapiProcess: ChildProcess | null = null;

async function startFastAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("[FastAPI] Starting Python backend on port 5001...");
    
    fastapiProcess = spawn("python", [
      "-m", "uvicorn", "api.main:app", 
      "--host", "127.0.0.1", 
      "--port", "5001"
    ], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env }
    });

    let started = false;

    fastapiProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      console.log("[FastAPI]", output.trim());
      if (output.includes("Application startup complete") && !started) {
        started = true;
        resolve();
      }
    });

    fastapiProcess.stderr?.on("data", (data) => {
      console.error("[FastAPI Error]", data.toString().trim());
    });

    fastapiProcess.on("error", (err) => {
      console.error("[FastAPI] Failed to start:", err);
      reject(err);
    });

    fastapiProcess.on("exit", (code) => {
      console.log(`[FastAPI] Process exited with code ${code}`);
      fastapiProcess = null;
    });

    setTimeout(() => {
      if (!started) {
        console.log("[FastAPI] Assuming started after timeout");
        resolve();
      }
    }, 5000);
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await startFastAPI();

  const proxyOptions: Options = {
    target: FASTAPI_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.originalUrl} -> FastAPI`);
        
        if ((req as any).rawBody && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
          const bodyData = (req as any).rawBody;
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
      error: (err, req, res) => {
        console.error("[Proxy] Error:", err.message);
        if (res && 'status' in res && typeof res.status === 'function') {
          (res as Response).status(502).json({ 
            error: "Backend service unavailable",
            details: err.message 
          });
        }
      }
    }
  };

  app.use("/api", createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: (path, req) => `/api${path}`
  }));

  process.on("SIGTERM", () => {
    if (fastapiProcess) {
      console.log("[FastAPI] Shutting down...");
      fastapiProcess.kill();
    }
  });

  process.on("SIGINT", () => {
    if (fastapiProcess) {
      console.log("[FastAPI] Shutting down...");
      fastapiProcess.kill();
    }
  });

  return httpServer;
}
