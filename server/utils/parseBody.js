// In serverless (Netlify) the JSON body is sometimes delivered as a raw Buffer
// or as a `{ type: "Buffer", data: [...] }` shape rather than a parsed object.
// This single helper normalizes all of those into a plain object so handlers
// can rely on `req.body` being usable. It replaces the copies of `parseBody` /
// `parseRequestBody` that were duplicated across several route files.
function normalizeBody(body) {
  if (!body) return {};

  if (body.type === "Buffer" && Array.isArray(body.data)) {
    try {
      return JSON.parse(Buffer.from(body.data).toString("utf8"));
    } catch {
      return {};
    }
  }

  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString("utf8"));
    } catch {
      return {};
    }
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body;
}

// Express middleware form: rewrites req.body in place.
function parseBodyMiddleware(req, _res, next) {
  req.body = normalizeBody(req.body);
  next();
}

module.exports = { normalizeBody, parseBodyMiddleware };
