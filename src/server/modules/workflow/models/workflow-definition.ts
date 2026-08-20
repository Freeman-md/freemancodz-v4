import type { WorkflowJsonObject } from "./workflow-json";

export type WorkflowSemanticOutput = WorkflowJsonObject;

export type WorkflowExecutionResult<State extends WorkflowJsonObject> = {
  state: State;
  status: "active" | "completed";
  output: WorkflowSemanticOutput;
};
