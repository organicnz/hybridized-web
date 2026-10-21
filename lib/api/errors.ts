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

/**
 * Turn whatever was thrown into an `Error`.
 *
 * Hono only hands an `Error` to the app's error handler; anything else is
 * re-thrown and the request dies without the clean JSON the API promises. The
 * database driver returns an `Error` subclass today, but a throw site should
 * not depend on that.
 */
export function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown;

  if (typeof thrown === "object" && thrown !== null) {
    const { message } = thrown as { message?: unknown };
    if (typeof message === "string") {
      const error = new Error(message);
      error.cause = thrown;
      return error;
    }
  }

  return new Error(typeof thrown === "string" ? thrown : String(thrown));
}
