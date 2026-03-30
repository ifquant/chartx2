export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
}

export function ensureDefined(value: undefined): never;
export function ensureDefined<T>(value: T | undefined): T;
export function ensureDefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("Value is undefined");
  }

  return value;
}

export function ensureNotNull(value: null): never;
export function ensureNotNull<T>(value: T | null): T;
export function ensureNotNull<T>(value: T | null): T {
  if (value === null) {
    throw new Error("Value is null");
  }

  return value;
}

export function ensure(value: undefined | null): never;
export function ensure<T>(value: T | undefined | null): T;
export function ensure<T>(value: T | undefined | null): T {
  return ensureNotNull(ensureDefined(value));
}

export function ensureNever(value: never): void {
  void value;
}
