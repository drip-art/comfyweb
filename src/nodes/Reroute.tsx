'WIP'
import { memo } from 'react'
import { Handle, NodeProps, Position } from 'reactflow'
import { useAppStore } from '../store'
import { NodeId, WidgetLegacy } from '../types'
// useAppStore.setState((s) => (s.widgets.Reroute = RerouteNode))

const widget = {
  name: 'Reroute',
  category: 'Group',
  input: { required: { '*': ['*'] } },
  output: ['*'],
} satisfies WidgetLegacy

// Register widget
useAppStore.setState((st) => {
  st.widgetsCustom.Reroute = widget
  return st
})

function RerouteNode({}: {
  node: NodeProps<WidgetLegacy>
  progressBar?: number
  onDuplicateNode: (id: NodeId) => void
  onDeleteNode: (id: NodeId) => void
}) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isValidConnection={() => {
          return true
        }}
      />
{/* TODO */}
      <Handle
        type="source"
        position={Position.Right}
        isValidConnection={() => {
          return true
        }}
      />
    </>
  )
}

export default memo(RerouteNode)
