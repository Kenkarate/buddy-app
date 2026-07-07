import { NextResponse } from "next/server";

// Standard response helpers for the admin API. Admin endpoints return a
// consistent envelope so the admin frontend never has to special-case parsing:
//   success -> { data, meta? }
//   failure -> { error: { message, code, details? } }  (via withErrorHandler)

// Operational error that carries an HTTP status and machine-readable code.
// Throw this from any admin route handler — withErrorHandler turns it into the
// standard error envelope (the Next equivalent of the central error middleware
// that used to live in server/index.js).
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode = 400,
    code = "BAD_REQUEST",
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

// Sends a successful envelope. `meta` is optional (e.g. pagination info).
export function ok(data: unknown = null, meta?: unknown): NextResponse {
  const body: Record<string, unknown> = { data };
  if (meta !== undefined) body.meta = meta;
  return NextResponse.json(body);
}

type RouteHandler<Args extends unknown[]> = (
  ...args: Args
) => Promise<Response> | Response;

// Wraps an admin route handler so thrown AppErrors (and unexpected errors)
// become the standard { error: { message, code, details } } envelope. Mirrors
// the central error handler from the old Express app.
export function withErrorHandler<Args extends unknown[]>(
  handler: RouteHandler<Args>
): RouteHandler<Args> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      const e = err as {
        statusCode?: number;
        status?: number;
        message?: string;
        code?: string;
        details?: unknown;
      };
      const isAppError = err instanceof AppError;
      const statusCode = isAppError
        ? (err as AppError).statusCode
        : e.statusCode || e.status || 500;

      if (!isAppError && statusCode >= 500) {
        console.error("UNHANDLED ERROR:", err);
      }

      const error: Record<string, unknown> = {
        message:
          isAppError || statusCode < 500
            ? e.message
            : "Something went wrong",
        code: e.code || (statusCode >= 500 ? "INTERNAL_ERROR" : "ERROR"),
      };
      if (e.details !== undefined) error.details = e.details;

      return NextResponse.json({ error }, { status: statusCode });
    }
  };
}
