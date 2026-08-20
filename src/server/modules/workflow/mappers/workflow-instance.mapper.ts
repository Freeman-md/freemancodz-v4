import type { Prisma, WorkflowInstance as PrismaWorkflowInstance } from "@/generated/prisma/client";
import type { WorkflowInstance, WorkflowInstanceStatus } from "../models/workflow-instance";
import {
  toWorkflowJsonObject,
  type WorkflowJsonObject,
  type WorkflowJsonValue,
} from "../models/workflow-json";

export function mapWorkflowInstance(record: PrismaWorkflowInstance): WorkflowInstance {
  return {
    id: record.id,
    workflowId: record.workflowId,
    workflowVersion: record.workflowVersion,
    status: toWorkflowInstanceStatus(record.status),
    state: toWorkflowJsonObject(record.state),
    originChannel: record.originChannel,
    originPage: record.originPage,
    originEntry: record.originEntry,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    updatedAt: record.updatedAt,
  };
}

export function toWorkflowStateInput(state: unknown): Prisma.InputJsonObject {
  const normalized = toWorkflowJsonObject(state);

  return toPrismaJsonObject(normalized);
}

function toWorkflowInstanceStatus(status: string): WorkflowInstanceStatus {
  if (status === "active" || status === "completed" || status === "cancelled") {
    return status;
  }

  throw new Error("Workflow persistence returned an invalid status.");
}

function toPrismaJsonObject(value: WorkflowJsonObject): Prisma.InputJsonObject {
  const entries: Array<[string, Prisma.InputJsonValue | null]> = Object.entries(value).map(
    ([key, entry]) => [key, toPrismaJsonValue(entry)],
  );

  return Object.fromEntries(entries);
}

function toPrismaJsonValue(value: WorkflowJsonValue): Prisma.InputJsonValue | null {
  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(toPrismaJsonValue);
  }

  if (typeof value === "object") {
    return toPrismaJsonObject(value);
  }

  return value;
}
