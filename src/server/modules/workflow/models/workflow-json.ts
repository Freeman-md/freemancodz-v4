export type WorkflowJsonPrimitive = string | number | boolean | null;

export type WorkflowJsonValue =
  WorkflowJsonPrimitive | WorkflowJsonValue[] | { [key: string]: WorkflowJsonValue };

export type WorkflowJsonObject = { [key: string]: WorkflowJsonValue };

export function toWorkflowJsonObject(value: unknown): WorkflowJsonObject {
  const normalized = toWorkflowJsonValue(value);

  if (normalized === null || Array.isArray(normalized) || typeof normalized !== "object") {
    throw new Error("Workflow data must be a JSON object.");
  }

  return normalized;
}

function toWorkflowJsonValue(value: unknown): WorkflowJsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Workflow data contains a non-finite number.");
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toWorkflowJsonValue);
  }

  if (typeof value !== "object") {
    throw new Error("Workflow data contains a non-JSON value.");
  }

  const prototype = Object.getPrototypeOf(value);

  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("Workflow data contains a non-JSON object.");
  }

  const normalized: WorkflowJsonObject = {};

  for (const [key, entry] of Object.entries(value)) {
    normalized[key] = toWorkflowJsonValue(entry);
  }

  return normalized;
}
