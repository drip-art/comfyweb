import { getBackendUrl } from './config'
import { type PersistedNodeLegacy, type PersistedGraphLegacy } from './persistence'
import { Input, type NodeId, type PropertyKey, type WidgetLegacy, type WidgetKey } from './types'

interface PromptRequest {
  client_id?: string
  prompt: Record<NodeId, Node>
  extra_data?: ExtraData
}

interface ExtraData {
  extra_pnginfo?: Record<string, any>
}

interface PromptResponse {
  error?: string
}

interface Node {
  class_type: WidgetKey
  inputs: Record<PropertyKey, any>
}

interface Queue {
  queue_running: QueueItem[]
  queue_pending: QueueItem[]
}

type QueueItem = [number, number, Record<NodeId, Node>, { client_id?: string }]

type History = Record<string, HistoryItem>

interface HistoryItem {
  prompt: QueueItem
  outputs: Record<NodeId, Record<PropertyKey, any>>
}

export async function getWidgetLibrary(): Promise<Record<string, WidgetLegacy>> {
  return await fetch(getBackendUrl('/object_info')).then(async (r) => await r.json())
}

export async function getQueue(): Promise<Queue> {
  return await fetch(getBackendUrl('/queue')).then(async (r) => await r.json())
}

export async function deleteFromQueue(id: number): Promise<void> {
  await fetch(getBackendUrl('/queue'), {
    method: 'POST',
    body: JSON.stringify({ delete: [id] }),
  })
}

export async function getHistory(): Promise<History> {
  return await fetch(getBackendUrl('/history')).then(async (r) => await r.json())
}

export async function sendPrompt(prompt: PromptRequest): Promise<PromptResponse> {
  const resp = await fetch(getBackendUrl('/prompt'), {
    method: 'POST',
    body: JSON.stringify(prompt),
  })
  const error = resp.status !== 200 ? await resp.text() : undefined
  return { error }
}

export function createPrompt(
  graph: PersistedGraphLegacy,
  widgets: Record<string, WidgetLegacy>,
  clientId?: string
): PromptRequest {
  const prompt: Record<NodeId, Node> = {}
  const data: Record<NodeId, PersistedNodeLegacy> = {}

  for (const [id, node] of Object.entries(graph.data)) {
    const fields = { ...node.value.fields }
    for (const [property, value] of Object.entries(fields)) {
      const input = widgets[node.value.widget].input.required[property]
      console.log(widgets[node.value.widget], property, input)
      if (Input.isInt(input) && input[1].randomizable === true && value === -1) {
        fields[property] = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER)
      }
    }

    data[id] = {
      position: node.position,
      value: { ...node.value, fields },
    }
    prompt[id] = {
      class_type: node.value.widget,
      inputs: fields,
    }
  }

  for (const edge of graph.connections) {
    const source = graph.data[edge.source]
    if (source === undefined) {
      continue
    }
    const outputIndex = widgets[source.value.widget].output.findIndex((f) => f === edge.sourceHandle)
    if (prompt[edge.target] !== undefined) {
      prompt[edge.target].inputs[edge.targetHandle] = [edge.source, outputIndex]
    }
  }

  return {
    prompt,
    client_id: clientId,
    extra_data: { extra_pnginfo: { workflow: { connections: graph.connections, data } } },
  }
}
