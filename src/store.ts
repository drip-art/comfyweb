import exifr from 'exifr'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Connection as FlowConnecton,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from 'reactflow'
import { create } from 'zustand'
import { WorkflowSchema } from './assets/workflow.schema'
import { createPrompt, deleteFromQueue, getQueue, getWidgetLibrary as getWidgets, sendPrompt } from './client'
import { NODE_IDENTIFIER } from './components/NodeComponent'
import { getBackendUrl } from './config'
import {
  PersistedNode,
  retrieveLocalWorkflow,
  saveLocalWorkflow,
  writeJsonToFile,
  type PersistedGraphLegacy,
  type PersistedNodeLegacy,
} from './persistence'
import {
  SDNode,
  SDNodeLegacy,
  Widget,
  type Connection,
  type GalleryItem,
  type NodeId,
  type NodeInProgress,
  type PropertyKey,
  type QueueItem,
  type WidgetKey,
  type WidgetLegacy,
} from './types'
import DIE from '@snomiao/die'

export type OnPropChange = (node: NodeId, property: PropertyKey, value: any) => void

export interface AppState {
  counter: number
  clientId?: string
  /** @deprecated legacy*/
  widgetsLegacy: Record<WidgetKey, WidgetLegacy>
  widgets: Record<WidgetKey, Widget>
  /** @deprecated legacy*/
  graphLegacy: Record<NodeId, SDNodeLegacy>
  graph: Record<NodeId, SDNode>
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
  /** @deprecated legacy*/
  onAddNodeLegacy: (widget: WidgetLegacy, node?: SDNodeLegacy, pos?: XYPosition, key?: number) => void
  onAddNode: (widget: Widget, node?: SDNode, pos?: XYPosition, key?: number) => void
  onDeleteNode: (id: NodeId) => void
  onDuplicateNode: (id: NodeId) => void
  onSubmit: () => Promise<void>
  onDeleteFromQueue: (id: number) => Promise<void>
  onInit: () => Promise<void>
  onLoadWorkflowLegacy: (persisted: PersistedGraphLegacy) => void
  onSaveWorkflowLegacy: () => void
  onLoadWorkflow: (persisted: PersistedGraphLegacy | WorkflowSchema) => void
  onSaveWorkflow: () => void
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
  graphLegacy: {},
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
      graphLegacy: {
        ...state.graphLegacy,
        [id]: {
          ...state.graphLegacy[id],
          fields: {
            ...state.graphLegacy[id]?.fields,
            [key]: val,
          },
        },
      },
    }))
  },
  onPersistLocal: () => {
    saveLocalWorkflow(AppState.toPersistedLegacy(get()))
  },
  onAddNode: (widget, node, position, key) => {
    set((st) => AppState.addNode(st, widget, node, position, key))
  },
  onAddNodeLegacy: (widget, node, position, key) => {
    set((st) => AppState.addNodeLegacy(st, widget, node, position, key))
  },
  onDeleteNode: (id) => {
    set(({ graphLegacy: { [id]: toDelete, ...graph }, nodes }) => ({
      // graph, // should work but currently buggy
      nodes: applyNodeChanges([{ type: 'remove', id }], nodes),
    }))
  },
  onDuplicateNode: (id) => {
    set((st) => {
      const item = st.graphLegacy[id]
      const node = st.nodes.find((n) => n.id === id)
      const position = node?.position
      const moved = position !== undefined ? { ...position, y: position.y + 100 } : undefined
      return AppState.addNodeLegacy(st, st.widgetsLegacy[item.widget], item, moved)
    })
  },
  onSubmit: async () => {
    const state = get()
    const graph = AppState.toPersistedLegacy(state)
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
    set({ widgets: widgets })
    get().onLoadWorkflow(retrieveLocalWorkflow() ?? { data: {}, connections: [] })
  },
  onLoadWorkflowLegacy: (workflow) => {
    set((st) => {
      let state: AppState = { ...st, nodes: [], edges: [], counter: 0, graphLegacy: {} }
      for (const [key, node] of Object.entries(workflow.data)) {
        const widget = state.widgetsLegacy[node.value.widget]
        if (widget !== undefined) {
          state = AppState.addNodeLegacy(state, widget, node.value, node.position, parseInt(key))
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
  onLoadWorkflow: (_workflow) => {
    if ((_workflow as any)['data']) return get().onLoadWorkflowLegacy(_workflow as PersistedGraphLegacy)
    const workflow = _workflow as WorkflowSchema
    set((st) => {
      let state: AppState = { ...st, nodes: [], edges: [], counter: 0, graphLegacy: {} }
      const nodes = workflow.nodes
      nodes.map((node, index) => {
        const widget = state.widgets[node.type]
        const values = node.widgets_values
        if (widget !== undefined) {
          // state = AppState.addNodeNew(state, widget, node.value, { x: node.pos[0], y: node.pos[1] }, index)
        } else {
          console.warn(`Unknown widget ${node.type}`)
        }
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
      alert('TODO: load workflow new')
      return st
    }, true)
  },

  onSaveWorkflowLegacy: () => {
    writeJsonToFile(AppState.toPersistedLegacy(get()))
  },
  onSaveWorkflow: () => {
    writeJsonToFile(AppState.toPersisted(get()))
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
      graphLegacy: {
        ...st.graphLegacy,
        [id]: { ...st.graphLegacy[id], images },
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
    void exifr.parse(getBackendUrl(`/view?${new URLSearchParams(image)}`)).then((res) => {
      get().onLoadWorkflowLegacy(JSON.parse(res.workflow))
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
  addNodeLegacy(
    state: AppState,
    widget: WidgetLegacy,
    node?: SDNodeLegacy,
    position?: XYPosition,
    key?: number
  ): AppState {
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
      graphLegacy: { ...state.graphLegacy, [id]: node ?? SDNodeLegacy.fromWidget(widget) },
      counter: nextKey,
    }
  },
  addNode(state: AppState, widget: Widget, node?: SDNode, position?: XYPosition, key?: number): AppState {
    const nextKey = key !== undefined ? Math.max(key, state.counter + 1) : state.counter + 1

    const id = node?.id?.toString() ?? nextKey.toString()
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
  addConnection(state: AppState, connection: FlowConnecton): AppState {
    return { ...state, edges: addEdge(connection, state.edges) }
  },
  toPersistedLegacy(state: AppState): PersistedGraphLegacy {
    const data: Record<NodeId, PersistedNodeLegacy> = {}
    for (const node of state.nodes) {
      const value = state.graphLegacy[node.id]
      if (value !== undefined) {
        data[node.id] = { value, position: node.position }
      }
    }

    return {
      data,
      connections: AppState.getValidConnections(state),
    }
  },
  toPersisted(state: AppState): WorkflowSchema {
    const nodes: Record<NodeId, PersistedNode> = {}
    for (const node of state.nodes) {
      const value = state.graph[node.id]
      if (value !== undefined) {
        nodes[node.id] = { value, position: node.position }
      }
    }
    throw new Error('Not implemented')
    return {
      // nodes,
      // links,
      // config,
      // extra,
      // groups,
      // last_link_id,
      // last_node_id,
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
