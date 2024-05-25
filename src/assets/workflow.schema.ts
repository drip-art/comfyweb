// import { WorkflowData } from "../workflowSchema";
// import WF20240523 from './workflow-2024-05-23.json'
// import WFDefault from './defaultWorkflow'
import { defaultWorkflow } from './defaultWorkflow'
import WFLegacy from './defaultWorkflowLegacy.json'
import { WF20240524 } from './workflow-2024-05-24'
// export type WorkflowNode = {
//   // TODO
// }
// export type WorkflowData = {
//   nodes: WorkflowNode[]
//   last_node_id?: number
//   last_link_id?: number
//   links?: (string | num112ber)[][]
//   groups?: any[]
//   config?: {}
//   extra?: {
//     groupNodes: { testerror: {} }
//   }
//   version?: number
// }
export type WorkflowSchema = typeof WF20240524 
const WFDefault = defaultWorkflow
export { WF20240524, WFDefault, WFLegacy }
