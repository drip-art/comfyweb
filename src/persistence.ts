import { SDNode, type Connection, type NodeId, type SDNodeLegacy } from './types'
// import defaultWorkflowLegacy from './assets/defaultWorkflowLegacy.json'
import { WF20240524, WorkflowSchema } from './assets/workflow.schema'
import { defaultWorkflow } from './assets/defaultWorkflow'

export interface PersistedNodeLegacy {
  value: SDNodeLegacy
  position: { x: number; y: number }
}
export interface PersistedNode {
  value: SDNode
  position: { x: number; y: number }
}

export interface PersistedGraphLegacy {
  data: Record<NodeId, PersistedNodeLegacy>
  connections: Connection[]
}
export interface PersistedGraphLegacy {
  data: Record<NodeId, PersistedNodeLegacy>
  connections: Connection[]
}

const GRAPH_KEY = 'graph'

export function retrieveLocalWorkflow(): WorkflowSchema | PersistedGraphLegacy | null {
  const item = localStorage.getItem(GRAPH_KEY)
  return item === null ? WF20240524 : JSON.parse(item)
}

export function saveLocalWorkflow(graph: PersistedGraphLegacy): void {
  localStorage.setItem(GRAPH_KEY, JSON.stringify(graph))
}

export function readWorkflowFromFile(
  ev: React.ChangeEvent<HTMLInputElement>,
  cb: (workflow: PersistedGraphLegacy | WorkflowSchema) => void
): void {
  const reader = new FileReader()
  if (ev.target.files !== null) {
    reader.readAsText(ev.target.files[0])
    reader.addEventListener('load', (ev) => {
      if (ev.target?.result != null && typeof ev.target.result === 'string') {
        cb(JSON.parse(ev.target.result))
      }
    })
  }
}
export function readImageWorkflowFromFile(
  ev: React.ChangeEvent<HTMLInputElement>,
  cb: (image: ArrayBuffer) => void
): void {
  const reader = new FileReader()
  if (ev.target.files !== null) {
    reader.readAsArrayBuffer(ev.target.files[0])
    reader.addEventListener('load', (ev) => {
      if (ev.target?.result != null && ev.target.result instanceof ArrayBuffer) {
        cb(ev.target.result)
      }
    })
  }
}

export function writeJsonToFile(workflow: any, filename = 'workflow.json'): void {
  const a = document.createElement('a')
  a.download = filename
  a.href = URL.createObjectURL(new Blob([JSON.stringify(workflow)], { type: 'application/json' }))
  a.click()
}
