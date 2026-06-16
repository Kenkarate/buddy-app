const { AppError } = require("./apiResponse");

// Tiny hand-rolled validators (no external deps) for admin endpoints. Each one
// throws an AppError(422) on failure, which the central error handler turns into
// the standard error envelope. They return the coerced value on success.

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${field} is required`, 422, "VALIDATION_ERROR", { field });
  }
  return value.trim();
}

function requireEnum(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw new AppError(`${field} must be one of: ${allowed.join(", ")}`, 422, "VALIDATION_ERROR", {
      field,
      allowed,
    });
  }
  return value;
}

// Coerces to a finite number and enforces optional min/max bounds.
function requireNumber(value, field, { min, max, integer = false } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new AppError(`${field} must be a number`, 422, "VALIDATION_ERROR", { field });
  }
  if (integer && !Number.isInteger(num)) {
    throw new AppError(`${field} must be a whole number`, 422, "VALIDATION_ERROR", { field });
  }
  if (min !== undefined && num < min) {
    throw new AppError(`${field} must be at least ${min}`, 422, "VALIDATION_ERROR", { field, min });
  }
  if (max !== undefined && num > max) {
    throw new AppError(`${field} must be at most ${max}`, 422, "VALIDATION_ERROR", { field, max });
  }
  return num;
}

// Validates a 24-char hex Mongo ObjectId without pulling in mongoose here.
function requireObjectId(value, field) {
  if (typeof value !== "string" || !/^[a-fA-F0-9]{24}$/.test(value)) {
    throw new AppError(`${field} is not a valid id`, 422, "VALIDATION_ERROR", { field });
  }
  return value;
}

module.exports = { requireString, requireEnum, requireNumber, requireObjectId };
