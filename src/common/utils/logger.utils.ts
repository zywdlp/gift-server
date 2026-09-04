import type { Request, Response } from "express";

interface RequestLogContext {
  url: string;
  method: string;
  clientIP: string;
  userAgent?: string;
  referrer?: string;
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
}

interface ResponseLogContext {
  statusCode: number;
  latency: number;
  contentLength?: number;
}

export class LoggerUtils {
  static captureRequestContext(req: Request): RequestLogContext {
    return {
      url: this.redactUrl(req.originalUrl),
      method: req.method,
      clientIP: this.parseClientIP(req),
      userAgent: req.headers["user-agent"],
      referrer: req.headers.referer,
      params: this.redactSensitiveFields(req.params as Record<string, unknown>),
      query: this.redactSensitiveFields(req.query as Record<string, unknown>),
      body: this.redactSensitiveFields(req.body as Record<string, unknown>),
    };
  }

  static captureResponseContext(res: Response, startTime: number): ResponseLogContext {
    return {
      statusCode: res.statusCode,
      latency: Date.now() - startTime,
      contentLength: res.getHeader("content-length") as number,
    };
  }

  static parseClientIP(req: Request): string {
    return (
      req.ip || req.socket?.remoteAddress || req.headers["x-forwarded-for"]?.toString() || "unknown"
    );
  }

  private static redactSensitiveFields(input: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = new Set([
      "password",
      "oldPassword",
      "newPassword",
      "confirmPassword",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "pin",
      "code",
      "phone",
      "cardtoken",
      "redeemsessiontoken",
      "qrtoken",
      "recipient",
      "address",
      "province",
      "city",
      "district",
      "detail",
    ]);

    const redact = (value: unknown, key?: string): unknown => {
      if (key && sensitiveKeys.has(key.toLowerCase())) return "[REDACTED]";
      if (Array.isArray(value)) return value.map((item) => redact(item));
      if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
          childKey,
          redact(childValue, childKey),
        ]));
      }
      return value;
    };
    return redact(input || {}) as Record<string, unknown>;
  }

  private static redactUrl(url: string): string {
    const [path, query] = url.split("?", 2);
    const safePath = path.replace(/(\/by-token\/)[^/]+/, "$1[REDACTED]");
    if (!query) return safePath;
    const safeQuery = this.redactSensitiveFields(Object.fromEntries(new URLSearchParams(query).entries()));
    return `${safePath}?${new URLSearchParams(Object.entries(safeQuery).map(([key, value]) => [key, String(value)])).toString()}`;
  }
}
