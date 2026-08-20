import type { WorkflowInstance, WorkflowStartContext } from "../models/workflow-instance";
import type {
  WorkflowAssistantContext,
  WorkflowToolCall,
  WorkflowToolExecutionResult,
} from "../models/workflow-service";

export interface IWorkflowService {
  start(workflowId: string, context: WorkflowStartContext): Promise<WorkflowInstance>;
  getAssistantContext(instanceId: string | null): Promise<WorkflowAssistantContext>;
  executeTool(
    instanceId: string | null,
    toolCall: WorkflowToolCall,
  ): Promise<WorkflowToolExecutionResult>;
  cancel(instanceId: string): Promise<WorkflowInstance>;
}
