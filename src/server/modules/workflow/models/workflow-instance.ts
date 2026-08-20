import type { WorkflowJsonObject } from "./workflow-json";

export const WORKFLOW_INSTANCE_STATUSES = ["active", "completed", "cancelled"] as const;

export type WorkflowInstanceStatus = (typeof WORKFLOW_INSTANCE_STATUSES)[number];

export type WorkflowStartContext = {
  originChannel: string;
  originPage: string | null;
  originEntry: string | null;
};

export type WorkflowInstance = WorkflowStartContext & {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: WorkflowInstanceStatus;
  state: WorkflowJsonObject;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
};

export type WorkflowPublicInstance = Pick<
  WorkflowInstance,
  "id" | "workflowId" | "workflowVersion" | "status"
>;

export type CreateWorkflowInstanceInput = WorkflowStartContext & {
  workflowId: string;
  workflowVersion: number;
  state: WorkflowJsonObject;
};

export type SaveWorkflowInstanceInput = {
  id: string;
  status: WorkflowInstanceStatus;
  state: WorkflowJsonObject;
  completedAt: Date | null;
};

export function toWorkflowPublicInstance(instance: WorkflowInstance): WorkflowPublicInstance {
  return {
    id: instance.id,
    workflowId: instance.workflowId,
    workflowVersion: instance.workflowVersion,
    status: instance.status,
  };
}
