import { randomUUID } from "node:crypto";

const windows = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = Number(process.env.RAG_RATE_LIMIT_PER_MINUTE || 30);

export function requestObservability(req, res, next) {
  const startedAt = performance.now();
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);

  res.on("finish", () => {
    console.log(JSON.stringify({
      event: "http_request",
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    }));
  });

  next();
}

export function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  const window = windows.get(key) || { startedAt: now, requests: 0 };

  if (now - window.startedAt >= WINDOW_MS) {
    window.startedAt = now;
    window.requests = 0;
  }

  window.requests += 1;
  windows.set(key, window);

  if (window.requests > MAX_REQUESTS) {
    const retryAfter = Math.ceil((window.startedAt + WINDOW_MS - now) / 1000);
    res.setHeader("Retry-After", retryAfter);
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again shortly.",
      requestId: req.requestId,
    });
  }

  return next();
}
