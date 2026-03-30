export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer X)[]
      ? readonly DeepPartial<X>[]
      : DeepPartial<T[P]>;
};

export function merge(
  destination: Record<string, unknown>,
  ...sources: Record<string, unknown>[]
): Record<string, unknown> {
  for (const source of sources) {
    for (const key in source) {
      if (
        source[key] === undefined ||
        !Object.prototype.hasOwnProperty.call(source, key) ||
        ["__proto__", "constructor", "prototype"].includes(key)
      ) {
        continue;
      }

      const value = source[key];
      const current = destination[key];

      if (
        typeof value !== "object" ||
        value === null ||
        current === undefined ||
        Array.isArray(value)
      ) {
        destination[key] = value;
      } else {
        merge(current as Record<string, unknown>, value as Record<string, unknown>);
      }
    }
  }

  return destination;
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value);
}

export function isInteger(value: unknown): boolean {
  return typeof value === "number" && value % 1 === 0;
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function clone<T>(object: T): T {
  if (!object || typeof object !== "object") {
    return object;
  }

  const cloneTarget: Record<string, unknown> | unknown[] = Array.isArray(object) ? [] : {};

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const value = (object as Record<string, unknown>)[key];
      (cloneTarget as Record<string, unknown>)[key] =
        value && typeof value === "object" ? clone(value) : value;
    }
  }

  return cloneTarget as T;
}

export function notNull<T>(value: T | null): value is T {
  return value !== null;
}

export function undefinedIfNull<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}
