// Standard response helpers for the admin API. Admin endpoints return a
// consistent envelope so the admin frontend never has to special-case parsing:
//   success -> { data, meta? }
//   failure -> { error: { message, code, details? } }  (via the error handler)

// Sends a successful envelope. `meta` is optional (e.g. pagination info).
function ok(res, data = null, meta) {
  const body = { data };
  if (meta !== undefined) body.meta = meta;
  return res.json(body);
}

// Operational error that carries an HTTP status and machine-readable code.
// Throw this from any (async) admin handler — the central error middleware in
// index.js turns it into the standard error envelope.
class AppError extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST", details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

module.exports = { ok, AppError };
