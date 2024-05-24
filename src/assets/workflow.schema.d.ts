import WF20240523 from './workflow-2024-05-23.json';
import WFDefault from './defaultWorkflow.json';
export type WorkflowSchema = typeof WF20240523 & typeof WFDefault;
export { WF20240523, WFDefault };
