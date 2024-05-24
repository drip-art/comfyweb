import { create } from 'zustand'
import {
  type Edge,
  type Node,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  type XYPosition,
  type Connection as FlowConnecton,
} from 'reactflow'
import { createPrompt, deleteFromQueue, getQueue, getWidgetLibrary as getWidgets, sendPrompt } from './client'
import {
  type GalleryItem,
  type QueueItem,
  type Connection,
  type NodeId,
  type NodeInProgress,
  type PropertyKey,
  SDNodeLegacy,
  type WidgetLegacy as WidgetLegacy,
  type WidgetKey,
  Widget as Widget,
  SDNode,
} from './types'
import {
  retrieveLocalWorkflow,
  saveLocalWorkflow,
  writeJsonToFile,
  type PersistedGraph,
  type PersistedNode,
} from './persistence'
import { NODE_IDENTIFIER } from './components/NodeComponent'
import { getBackendUrl } from './config'
import exifr from 'exifr'
import { WorkflowSchema } from './assets/workflow.schema'

export type OnPropChange = (node: NodeId, property: PropertyKey, value: any) => void

export interface AppState {
  counter: number
  clientId?: string
  widgets: Record<WidgetKey, Widget>
  /** @deprecated use .widgets*/
  widgetsLegacy: Record<WidgetKey, WidgetLegacy>
  graph: Record<NodeId, SDNodeLegacy>
  nodes: Node[]
  edges: Edge[]
  nodeInProgress?: NodeInProgress
  promptError?: string
  queue: QueueItem[]
  gallery: GalleryItem[]
  previewedImageIndex?: number
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onPropChange: OnPropChange
  onAddNode: (widget: WidgetLegacy, node?: SDNodeLegacy, pos?: XYPosition, key?: number) => void
  onDeleteNode: (id: NodeId) => void
  onDuplicateNode: (id: NodeId) => void
  onSubmit: () => Promise<void>
  onDeleteFromQueue: (id: number) => Promise<void>
  onInit: () => Promise<void>
  onLoadWorkflow: (persisted: PersistedGraph | WorkflowSchema) => void
  onSaveWorkflow: () => void
  onLoadWorkflowNew: (persisted: WorkflowSchema) => void
  onSaveWorkflowNew: () => void
  onPersistLocal: () => void
  onNewClientId: (id: string) => void
  onQueueUpdate: () => Promise<void>
  onNodeInProgress: (id: NodeId, progress: number) => void
  onImageSave: (id: NodeId, images: string[]) => void
  onPreviewImage: (id: number) => void
  onPreviewImageNavigate: (next: boolean) => void
  onHideImagePreview: () => void
  onLoadImageWorkflow: (image: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  counter: 0,
  widgets: {},
  widgetsLegacy: {},
  graph: {},
  nodes: [],
  edges: [],
  queue: [],
  gallery: [],
  onNodesChange: (changes) => {
    set((st) => ({ nodes: applyNodeChanges(changes, st.nodes) }))
  },
  onEdgesChange: (changes) => {
    set((st) => ({ edges: applyEdgeChanges(changes, st.edges) }))
  },
  onConnect: (connection) => {
    set((st) => AppState.addConnection(st, connection))
  },
  onPropChange: (id, key, val) => {
    set((state) => ({
      graph: {
        ...state.graph,
        [id]: {
          ...state.graph[id],
          fields: {
            ...state.graph[id]?.fields,
            [key]: val,
          },
        },
      },
    }))
  },
  onPersistLocal: () => {
    saveLocalWorkflow(AppState.toPersisted(get()))
  },
  onAddNode: (widget, node, position, key) => {
    set((st) => AppState.addNode(st, widget, node, position, key))
  },
  onDeleteNode: (id) => {
    set(({ graph: { [id]: toDelete, ...graph }, nodes }) => ({
      // graph, // should work but currently buggy
      nodes: applyNodeChanges([{ type: 'remove', id }], nodes),
    }))
  },
  onDuplicateNode: (id) => {
    set((st) => {
      const item = st.graph[id]
      const node = st.nodes.find((n) => n.id === id)
      const position = node?.position
      const moved = position !== undefined ? { ...position, y: position.y + 100 } : undefined
      return AppState.addNode(st, st.widgetsLegacy[item.widget], item, moved)
    })
  },
  onSubmit: async () => {
    const state = get()
    const graph = AppState.toPersisted(state)
    const res = await sendPrompt(createPrompt(graph, state.widgetsLegacy, state.clientId))
    set({ promptError: res.error })
  },
  onDeleteFromQueue: async (id) => {
    await deleteFromQueue(id)
    await get().onQueueUpdate()
  },
  onInit: async () => {
    setInterval(() => get().onPersistLocal(), 5000)

    const widgets = await getWidgets()
    set({ widgetsLegacy: widgets })
    get().onLoadWorkflow(retrieveLocalWorkflow() ?? { data: {}, connections: [] })
  },
  onLoadWorkflow: (_workflow) => {
    if ((_workflow as any)['nodes']) return get().onLoadWorkflowNew(_workflow as WorkflowSchema)
    const workflow = _workflow as PersistedGraph
    set((st) => {
      let state: AppState = { ...st, nodes: [], edges: [], counter: 0, graph: {} }
      for (const [key, node] of Object.entries(workflow.data)) {
        const widget = state.widgetsLegacy[node.value.widget]
        if (widget !== undefined) {
          state = AppState.addNode(state, widget, node.value, node.position, parseInt(key))
        } else {
          console.warn(`Unknown widget ${node.value.widget}`)
        }
      }
      for (const connection of workflow.connections) {
        state = AppState.addConnection(state, connection)
      }
      return state
    }, true)
  },
  onLoadWorkflowNew: (workflow) => {
    set((st) => {
      let state: AppState = { ...st, nodes: [], edges: [], counter: 0, graph: {} }
      const nodes = workflow.nodes
      nodes.map((node) => {
        const widget = state.widgets[node.type]
        const values = node.widgets_values
      })
      // for (const [key, node] of Object.entries(nodes)) {
      //   const widget = state.widgets[node.value.widget]
      //   if (widget !== undefined) {
      //     state = AppState.addNodeNew(state, widget, node.value, node.position, parseInt(key))
      //   } else {
      //     console.warn(`Unknown widget ${node.value.widget}`)
      //   }
      // }
      // for (const connection of workflow.connections) {
      //   state = AppState.addConnection(state, connection)
      // }

      // return state
      alert('TODO')
      return st
    }, true)
  },

  onSaveWorkflow: () => {
    writeJsonToFile(AppState.toPersisted(get()))
  },
  onSaveWorkflowNew: () => {
    writeJsonToFile(AppState.toPersistedNew(get()))
  },
  onNewClientId: (id) => {
    set({ clientId: id })
  },
  onQueueUpdate: async () => {
    set({ queue: await getQueueItems(get().clientId) })
  },
  onNodeInProgress: (id, progress) => {
    set({ nodeInProgress: { id, progress } })
  },
  onImageSave: (id, images) => {
    set((st) => ({
      gallery: st.gallery.concat(images.map((image) => ({ image }))),
      graph: {
        ...st.graph,
        [id]: { ...st.graph[id], images },
      },
    }))
  },
  onPreviewImage: (index) => {
    set({ previewedImageIndex: index })
  },
  onPreviewImageNavigate: (next) => {
    set((st) => {
      if (st.previewedImageIndex === undefined) {
        return {}
      }
      const idx = next ? st.previewedImageIndex - 1 : st.previewedImageIndex + 1
      return idx < 0 || idx === st.gallery.length ? {} : { previewedImageIndex: idx }
    })
  },
  onHideImagePreview: () => {
    set({ previewedImageIndex: undefined })
  },
  onLoadImageWorkflow: (image) => {
    void exifr.parse(getBackendUrl(`/view/${image}`)).then((res) => {
      get().onLoadWorkflow(JSON.parse(res.workflow))
    })
  },
}))

export const AppState = {
  getValidConnections(state: AppState): Connection[] {
    return state.edges.flatMap((e) =>
      e.sourceHandle !== undefined && e.sourceHandle !== null && e.targetHandle !== undefined && e.targetHandle !== null
        ? [{ source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle }]
        : []
    )
  },
  addNode(state: AppState, widget: WidgetLegacy, node?: SDNodeLegacy, position?: XYPosition, key?: number): AppState {
    const nextKey = key !== undefined ? Math.max(key, state.counter + 1) : state.counter + 1
    const id = nextKey.toString()
    const maxZ = state.nodes
      .map((n) => n.zIndex ?? 0)
      .concat([0])
      .reduce((a, b) => Math.max(a, b))
    const item = {
      id,
      data: widget,
      position: position ?? { x: 0, y: 0 },
      type: NODE_IDENTIFIER,
      zIndex: maxZ + 1,
    }
    return {
      ...state,
      nodes: applyNodeChanges([{ type: 'add', item }], state.nodes),
      graph: { ...state.graph, [id]: node ?? SDNode.fromWidget(widget) },
      counter: nextKey,
    }
  },
  addNodeNew(state: AppState, widget: Widget, node: SDNode, position?: XYPosition, key?: number): AppState {
    const nextKey = key !== undefined ? Math.max(key, state.counter + 1) : state.counter + 1

    const id = nextKey.toString()
    const maxZ = state.nodes
      .map((n) => n.zIndex ?? 0)
      .concat([0])
      .reduce((a, b) => Math.max(a, b))
    const item = {
      id,
      data: widget,
      position: position ?? { x: 0, y: 0 },
      type: NODE_IDENTIFIER,
      zIndex: maxZ + 1,
    }
    return {
      ...state,
      nodes: applyNodeChanges([{ type: 'add', item }], state.nodes),
      // TODO: fix node type
      // graph: { ...state.graph, [id]: node },
      counter: nextKey,
    }
  },
  addConnection(state: AppState, connection: FlowConnecton): AppState {
    return { ...state, edges: addEdge(connection, state.edges) }
  },
  toPersisted(state: AppState): PersistedGraph {
    const data: Record<NodeId, PersistedNode> = {}
    for (const node of state.nodes) {
      const value = state.graph[node.id]
      if (value !== undefined) {
        data[node.id] = { value, position: node.position }
      }
    }

    return {
      data,
      connections: AppState.getValidConnections(state),
    }
  },
  toPersistedNew(state: AppState): WorkflowSchema {
    // const data: Record<NodeId, PersistedNode> = {}
    // for (const node of state.nodes) {
    //   const value = state.graph[node.id]
    //   if (value !== undefined) {
    //     data[node.id] = { value, position: node.position }
    //   }
    // }

    return {
      // data,
      // connections: AppState.getValidConnections(state),
    } as WorkflowSchema
  },
}

async function getQueueItems(clientId?: string): Promise<QueueItem[]> {
  const history = await getQueue()
  // hacky way of getting the queue
  const queue = history.queue_running
    .concat(history.queue_pending)
    .filter(([i, id, graph, client]) => client.client_id === clientId)
    .map(([i, id, graph]) => {
      const prompts = Object.values(graph).flatMap((node) =>
        node.class_type === 'CLIPTextEncode' && node.inputs.text !== undefined ? [node.inputs.text] : []
      )
      const checkpoint = Object.values(graph).find((node) => node.class_type.startsWith('CheckpointLoader'))
      const model = checkpoint?.inputs?.ckpt_name
      return { id, prompts, model }
    })
  return queue
}
