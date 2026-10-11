import * as Sentry from "@sentry/nextjs";

/** Generate a unique request ID for tracing. */
export function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface LogContext {
  requestId?: string;
  path?: string;
  method?: string;
  durationMs?: number;
  statusCode?: number;
  error?: Error;
  [key: string]: unknown;
}

function log(level: "info" | "warn" | "error", message: string, context: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...context,
    ...(context.error ? { error: context.error.message, stack: context.error.stack } : {}),
  };

  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  method(JSON.stringify(entry));

  if (level === "error" && context.error) {
    Sentry.captureException(context.error, {
      extra: { requestId: context.requestId, path: context.path, method: context.method },
    });
  }
}

export const logger = {
  info: (message: string, context: LogContext = {}) => log("info", message, context),
  warn: (message: string, context: LogContext = {}) => log("warn", message, context),
  error: (message: string, context: LogContext = {}) => log("error", message, context),
};