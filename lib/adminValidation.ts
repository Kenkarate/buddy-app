import { AppError } from "@/lib/apiResponse";

// Tiny hand-rolled validators (no external deps) for admin endpoints. Each one
// throws an AppError(422) on failure, which withErrorHandler turns into the
// standard error envelope. They return the coerced value on success.

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${field} is required`, 422, "VALIDATION_ERROR", { field });
  }
  return value.trim();
}

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[]
): T {
  if (!allowed.includes(value as T)) {
    throw new AppError(
      `${field} must be one of: ${allowed.join(", ")}`,
      422,
      "VALIDATION_ERROR",
      { field, allowed }
    );
  }
  return value as T;
}

// Coerces to a finite number and enforces optional min/max bounds.
export function requireNumber(
  value: unknown,
  field: string,
  { min, max, integer = false }: { min?: number; max?: number; integer?: boolean } = {}
): number {
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
export function requireObjectId(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[a-fA-F0-9]{24}$/.test(value)) {
    throw new AppError(`${field} is not a valid id`, 422, "VALIDATION_ERROR", { field });
  }
  return value;
}
