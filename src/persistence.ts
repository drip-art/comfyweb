import { SDNode, type Connection, type NodeId, type SDNodeLegacy } from './types'
import defaultWorkflowLegacy from './assets/defaultWorkflowLegacy.json'
import { WorkflowSchema } from './assets/workflow.schema'

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

export function retrieveLocalWorkflow(): PersistedGraphLegacy | null {
  const item = localStorage.getItem(GRAPH_KEY)
  return item === null ? defaultWorkflowLegacy : JSON.parse(item)
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

export function writeJsonToFile(workflow: any, filename = 'workflow.json'): void {
  const a = document.createElement('a')
  a.download = filename
  a.href = URL.createObjectURL(new Blob([JSON.stringify(workflow)], { type: 'application/json' }))
  a.click()
}
