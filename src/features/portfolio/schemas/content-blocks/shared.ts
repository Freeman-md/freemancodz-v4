export function parseObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid content stored for ${label}`);
  }

  return value as Record<string, unknown>;
}

export function readString(
  value: Record<string, unknown>,
  field: string,
  label: string,
): string {
  if (typeof value[field] !== "string") {
    throw new Error(`Invalid content stored for ${label}`);
  }

  return value[field];
}
