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
  ComfyImage,
  ReactFlowConnection,
  SDNode,
  SDNodeLegacy,
  Widget,
  WidgetLegacy,
  type Connection,
  type GalleryItem,
  type NodeId,
  type NodeInProgress,
  type PropertyKey,
  type QueueItem,
  type WidgetKey,
} from './types'
import { map, mapObjIndexed } from 'rambda'

export type OnPropChange = (node: NodeId, property: PropertyKey, value: any) => void

export interface AppState {
  counter: number
  clientId?: string
  /** @deprecated legacy*/
  widgetsLegacy: Record<WidgetKey, WidgetLegacy>
  widgets: Record<WidgetKey, Widget>
  widgetsCustom: Record<WidgetKey, Widget>
  /** @deprecated legacy*/
  graph: Record<NodeId, SDNodeLegacy>
  graphNew: Record<NodeId, SDNode>
  nodes: Node[]
  edges: Edge[]
  nodeInProgress?: NodeInProgress
  promptError?: string
  queue: QueueItem[]
  gallery: GalleryItem[]
  previewedImageIndex?: number
  isValidConnection: (connection: ReactFlowConnection) => boolean
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
  onLoadImageWorkflow: (image: ComfyImage | ArrayBuffer) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  counter: 0,
  widgets: {},
  widgetsCustom: {},
  widgetsLegacy: {},
  graphNew: {},
  graph: {},
  nodes: [],
  edges: [],
  queue: [],
  gallery: [],
  isValidConnection: (connection) => {
    const { source, sourceHandle, target, targetHandle } = connection
    if (!target) return false
    if (!source) return false
    if (!sourceHandle) return false
    if (!targetHandle) return false

    const st = get()
    const sourceType = st.widgets[st.graph[target].widget].output.find((out) => out === sourceHandle)
    const targetType = new Map(Object.entries(st.widgets[st.graph[target].widget].input.required)).get(
      targetHandle
    )?.[0]
    return sourceType === targetType
  },
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
    saveLocalWorkflow(AppState.toPersistedLegacy(get()))
  },
  onAddNode: (widget, node, position, key) => {
    set((st) => AppState.addNode(st, widget, node, position, key))
  },
  onAddNodeLegacy: (widget, node, position, key) => {
    set((st) => AppState.addNodeLegacy(st, widget, node, position, key))
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

    const rawWidgets = await getWidgets()

    // add a control_after_generate field after seeds
    const widgets = Object.fromEntries(
      Object.entries(rawWidgets).map(([id, widget]) => {
        const newWidget = {
          ...widget,
          input: {
            ...widget.input,
            required: Object.fromEntries(
              Object.entries(widget.input.required).flatMap(([field, info], i, a) => {
                const isSeed = ['INT:seed', 'INT:noise_seed'].includes(`${info[0]}:${field}`)
                if (isSeed) {
                  return [
                    [field, info],
                    ['control_after_generate', [['fixed', 'increment', 'decrement', 'randomize']]],
                  ]
                }
                return [[field, info]]
              })
            ),
          },
        }
        if (id === 'KSampler') console.log(newWidget)
        return [id, newWidget]
      })
    ) as typeof rawWidgets
    console.log('widgets loaded', { widgets, rawWidgets })
    set({ widgetsLegacy: widgets })
    set({ widgets: widgets })

    get().onLoadWorkflow(retrieveLocalWorkflow() ?? { data: {}, connections: [] })
  },
  onLoadWorkflowLegacy: (workflow) => {
    console.info('Load workflow legacy', { workflow })
    set((st) => {
      let state: AppState = { ...st, nodes: [], edges: [], counter: 0, graph: {}, graphNew: {} }
      for (const [key, node] of Object.entries(workflow.data)) {
        const widget = state.widgetsLegacy[node.value.widget]
        if (widget !== undefined) {
          console.log('add params', [state, widget, node.value, node.position, parseInt(key)])
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
    console.info('Load workflow', { workflow })
    // data
    const data = Object.fromEntries(
      workflow.nodes.flatMap((node) => {
        const type = sanitizeNodeName(node.type)
        const widget = get().widgets[type]
        if (widget === undefined) {
          console.error(`Unknown widget: ${type}`)
          return []
        }
        const values = node.widgets_values
        const defaultFieldEntries = WidgetLegacy.getDefaultFieldsEntries(widget)
        const fields = Object.fromEntries(
          defaultFieldEntries.map(([key, defaultValue], i, a) => [key, values?.[i] ?? defaultValue])
        )
        if (type === 'KSampler') console.error(fields, defaultFieldEntries, values)
        console.log({ type, values, fields, defaultFieldEntries })
        return [[node.id, { position: { x: node.pos[0], y: node.pos[1] }, value: { widget: type, fields } }]]
      })
    )
    console.info({ data })
    // connections
    const nodeMap = new Map(workflow.nodes.map((node) => [node.id, node]))
    const connections = workflow.links.map((link) => {
      const [id, src, src_slot, dst, dst_slot] = link as number[]
      return {
        source: src.toString(),
        target: dst.toString(),
        sourceHandle: nodeMap.get(src)!.outputs![src_slot].name,
        targetHandle: nodeMap.get(dst)!.inputs![dst_slot].name,
      } satisfies Connection
    })
    console.info({ connections })
    return get().onLoadWorkflowLegacy({ data, connections })
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
    console.info('Load Image workflow', { image })
    const parseInput = image instanceof ArrayBuffer ? image : getBackendUrl(`/view?${new URLSearchParams(image)}`)
    void exifr.parse(parseInput).then((res) => {
      // exif will store PersistedGraphLegacy
      const imageWorkflow = JSON.parse(res.workflow) as PersistedGraphLegacy
      get().onLoadWorkflow(imageWorkflow)
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
      graph: { ...state.graph, [id]: node ?? SDNodeLegacy.fromWidgetLegacy(widget) },
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
      graphNew: { ...state.graphNew, [id]: node ?? SDNode.fromWidget(widget) },
      counter: nextKey,
    }
  },
  addConnection(state: AppState, connection: FlowConnecton): AppState {
    return { ...state, edges: addEdge(connection, state.edges) }
  },
  toPersistedLegacy(state: AppState): PersistedGraphLegacy {
    const data: Record<NodeId, PersistedNodeLegacy> = {}
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
  toPersisted(state: AppState): WorkflowSchema {
    const nodes: Record<NodeId, PersistedNode> = {}
    for (const node of state.nodes) {
      const value = state.graphNew[node.id]
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

function sanitizeNodeName(string: any) {
  return String(string).replace(/[&<>"'`=]/g, '')
}
