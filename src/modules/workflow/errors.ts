export type WorkflowServiceErrorCode =
  | "configuration_error"
  | "execution_failed"
  | "invalid_request"
  | "invalid_state"
  | "invalid_transition"
  | "not_found"
  | "persistence_failed"
  | "unavailable_definition"
  | "unavailable_tool";

export class WorkflowServiceError extends Error {
  constructor(
    readonly code: WorkflowServiceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "WorkflowServiceError";
  }
}

export type WorkflowInstanceStoreErrorCode = "not_found" | "terminal" | "unavailable";

export class WorkflowInstanceStoreError extends Error {
  constructor(
    readonly code: WorkflowInstanceStoreErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "WorkflowInstanceStoreError";
  }
}
