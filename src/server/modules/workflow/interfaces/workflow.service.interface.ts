import type {
  WorkflowAssistantContext,
  WorkflowPublicInstance,
  WorkflowStartContext,
  WorkflowToolCall,
  WorkflowToolExecutionResult,
} from "../workflow.types";

export interface IWorkflowService {
  start(workflowId: string, context: WorkflowStartContext): Promise<WorkflowPublicInstance>;
  getAssistantContext(instanceId: string | null): Promise<WorkflowAssistantContext>;
  executeTool(
    instanceId: string | null,
    toolCall: WorkflowToolCall,
  ): Promise<WorkflowToolExecutionResult>;
  cancel(instanceId: string): Promise<WorkflowPublicInstance>;
}
