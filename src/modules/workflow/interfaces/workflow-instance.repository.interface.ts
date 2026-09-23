import type { WorkflowInstance } from "@/generated/prisma/client";
import type { CreateWorkflowInstanceInput, SaveWorkflowInstanceInput } from "../workflow.types";

export type WorkflowInstanceRepositoryErrorCode = "not_found" | "terminal" | "unavailable";

export class WorkflowInstanceRepositoryError extends Error {
  constructor(
    readonly code: WorkflowInstanceRepositoryErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "WorkflowInstanceRepositoryError";
  }
}

export interface IWorkflowInstanceRepository {
  create(input: CreateWorkflowInstanceInput): Promise<WorkflowInstance>;
  findById(id: string): Promise<WorkflowInstance | null>;
  save(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance>;
}
