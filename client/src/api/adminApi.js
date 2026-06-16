import api from "./api";

// Wrapper over the shared axios instance for ADMIN endpoints, which return the
// standard envelope: success -> { data, meta? }, failure -> { error: {...} }.
// Each method resolves to { data, meta } so admin pages read `data` directly and
// don't have to know about the envelope. Errors are normalized so callers can
// rely on `err.message` / `err.code` / `err.details`.

function unwrap(res) {
  const body = res?.data ?? {};
  return { data: body.data, meta: body.meta };
}

function normalizeError(err) {
  const envelope = err?.response?.data?.error;
  if (envelope) {
    const normalized = new Error(envelope.message || "Request failed");
    normalized.code = envelope.code;
    normalized.details = envelope.details;
    normalized.status = err.response.status;
    return normalized;
  }
  return err;
}

async function request(promise) {
  try {
    return unwrap(await promise);
  } catch (err) {
    throw normalizeError(err);
  }
}

const adminApi = {
  get: (url, config) => request(api.get(url, config)),
  post: (url, body, config) => request(api.post(url, body, config)),
  put: (url, body, config) => request(api.put(url, body, config)),
  patch: (url, body, config) => request(api.patch(url, body, config)),
  delete: (url, config) => request(api.delete(url, config)),
};

export default adminApi;
