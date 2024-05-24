import { WidgetsSchema } from './assets/widget.schema'
import { WorkflowSchema } from './assets/workflow.schema'

export type WidgetKey = string
export type PropertyKey = string
export type NodeId = string

export interface SDNodeLegacy {
  widget: WidgetKey
  fields: Record<PropertyKey, any>
  images?: string[]
}
export type SDNode = Required<Pick<WorkflowSchema['nodes'][number], 'type' | 'widgets_values'>> &
  Partial<WorkflowSchema['nodes'][number]>

export const SDNodeLegacy = {
  fromWidget(widget: WidgetLegacy): SDNodeLegacy {
    return { widget: widget.name, fields: WidgetLegacy.getDefaultFields(widget) }
  },
}
export const SDNode = {
  fromWidget(widget: Widget) {
    return { type: widget.name, widgets_values: Widget.getDefaultValues(widget) } satisfies Partial<SDNode>
  },
}

export interface WidgetLegacy {
  name: WidgetKey
  input: { required: Record<PropertyKey, Input> }
  output: Flow[]
  category: string
}
export type Widget = WidgetLegacy

export const WidgetLegacy = {
  getDefaultFields(widget: WidgetLegacy): Record<PropertyKey, any> {
    const fields: Record<PropertyKey, any> = {}
    for (const [key, input] of Object.entries(widget.input.required)) {
      if (Input.isBool(input)) {
        fields[key] = input[1].default ?? false
      } else if (Input.isFloat(input)) {
        fields[key] = input[1].default ?? 0.0
      } else if (Input.isInt(input)) {
        fields[key] = input[1].default ?? 0
      } else if (Input.isString(input)) {
        fields[key] = ''
      } else if (Input.isList(input)) {
        fields[key] = input[0][0]
      }
    }
    return fields
  },
}
export const Widget = {
  getDefaultValues(widget: Widget): any[] {
    const fields: Record<PropertyKey, any> = {}
    for (const [key, input] of Object.entries(widget.input.required)) {
      if (Input.isBool(input)) {
        fields[key] = input[1].default ?? false
      } else if (Input.isFloat(input)) {
        fields[key] = input[1].default ?? 0.0
      } else if (Input.isInt(input)) {
        fields[key] = input[1].default ?? 0
      } else if (Input.isString(input)) {
        fields[key] = ''
      } else if (Input.isList(input)) {
        fields[key] = input[0][0]
      }
    }
    return Object.values(fields)
  },
}

export interface NodeInProgress {
  id: NodeId
  progress: number
}

export interface NumberProps<A> {
  default?: A
  min?: A
  max?: A
  randomizable?: boolean
}

export interface StringProps {
  multiline?: boolean
  dynamic_prompt?: boolean
}

export interface BoolProps {
  default?: boolean
}

export interface InputType {
  BOOL: [boolean, BoolProps]
  INT: [number, NumberProps<number>]
  FLOAT: [number, NumberProps<number>]
  STRING: [string, StringProps]
}

const FLOWS = ['MODEL', 'CONDITIONING', 'CLIP', 'IMAGE', 'LATENT', 'CONTROL_NET', 'MASK', 'WEBCAM'] as const
export type Flow = (typeof FLOWS)[number]

export type Parameter<K extends keyof InputType> = [K, InputType[K][1]]

export type Input = Parameter<keyof InputType> | [string[]] | [Flow]
/* HACK: make typescript happy before buildig correct widgets type */
// | Record<never, never>[]

export const Input = {
  isBool(i: Input): i is Parameter<'BOOL'> {
    return i[0] === 'BOOL'
  },

  isInt(i: Input): i is Parameter<'INT'> {
    return i[0] === 'INT'
  },

  isFloat(i: Input): i is Parameter<'FLOAT'> {
    return i[0] === 'FLOAT'
  },

  isString(i: Input): i is Parameter<'STRING'> {
    return i[0] === 'STRING'
  },

  isList(i: Input): i is [string[]] {
    return Array.isArray(i[0])
  },

  isParameterOrList(i: Input): boolean {
    return Input.isBool(i) || Input.isInt(i) || Input.isFloat(i) || Input.isString(i) || Input.isList(i)
  },
}

export interface MessageType {
  status: { status: { exec_info: { queue_remaining: number } }; sid?: string }
  executing: { node?: NodeId }
  progress: { value: number; max: number }
  executed: { node: NodeId; output: Record<string, any> }
}

export interface Message<K extends keyof MessageType> {
  type: K
  data: MessageType[K]
}

export const Message = {
  isStatus(m: Message<keyof MessageType>): m is Message<'status'> {
    return m.type === 'status'
  },

  isExecuting(m: Message<keyof MessageType>): m is Message<'executing'> {
    return m.type === 'executing'
  },

  isProgress(m: Message<keyof MessageType>): m is Message<'progress'> {
    return m.type === 'progress'
  },

  isExecuted(m: Message<keyof MessageType>): m is Message<'executed'> {
    return m.type === 'executed'
  },
}

export interface Connection {
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
}

export interface GalleryItem {
  prompt?: string
  image: string
}

export interface QueueItem {
  id: number
  prompts: string[]
  model?: string
}
export type ComfyImage = string | { filename: string; subfolder: string; type: 'output'; rand?: string }
