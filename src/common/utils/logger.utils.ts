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
      url: req.originalUrl,
      method: req.method,
      clientIP: this.parseClientIP(req),
      userAgent: req.headers["user-agent"],
      referrer: req.headers.referer,
      params: req.params as Record<string, unknown>,
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
    ]);

    return Object.fromEntries(
      Object.entries(input || {}).map(([key, value]) => [
        key,
        sensitiveKeys.has(key) ? "[REDACTED]" : value,
      ])
    );
  }
}
