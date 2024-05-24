import ReactFlow, { Background, BackgroundVariant, Controls, Panel } from 'reactflow'
import { shallow } from 'zustand/shallow'

import { useAppStore } from '../store'
import { NODE_IDENTIFIER } from './NodeComponent'

import 'reactflow/dist/style.css'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'
import { Message } from '../types'
import { ControlPanelContainer, ImageViewContainer, NodeContainer } from '../containers'
import config from '../config'
import DIE from '@snomiao/die'

const nodeTypes = { [NODE_IDENTIFIER]: NodeContainer }

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <FlowContainer/>
      <WsController />
    </div>
  )
}

function FlowContainer() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onInit } = useAppStore(
    (st) => ({
      nodes: st.nodes,
      edges: st.edges,
      onNodesChange: st.onNodesChange,
      onEdgesChange: st.onEdgesChange,
      onConnect: st.onConnect,
      onInit: st.onInit,
    }),
    shallow
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      nodeTypes={nodeTypes}
      deleteKeyCode={['Delete']}
      disableKeyboardA11y={true}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={() => {
        void onInit()
      }}
    >
      <Background variant={BackgroundVariant.Dots} />
      <Controls />
      <Panel position="bottom-center">
        <ControlPanelContainer />
        <ImageViewContainer />
      </Panel>
    </ReactFlow>
  )
}

function WsController() {
  const { clientId, nodeIdInProgress, onNewClientId, onQueueUpdate, onNodeInProgress, onImageSave } = useAppStore(
    (st) => ({
      clientId: st.clientId,
      nodeIdInProgress: st.nodeInProgress?.id,
      onNewClientId: st.onNewClientId,
      onQueueUpdate: st.onQueueUpdate,
      onNodeInProgress: st.onNodeInProgress,
      onImageSave: st.onImageSave,
    }),
    shallow
  )
  const protocol = config.protocol === 'https:' ? 'wss' : config.protocol === 'http:' ? 'ws' : undefined
  if (!protocol) DIE(`Missing websocket protocol: ${protocol}`)
  useWebSocket(`${protocol}://${config.host}/ws`, {
    onMessage: (ev) => {
      const msg = JSON.parse(ev.data)
      if (Message.isStatus(msg)) {
        if (msg.data.sid !== undefined && msg.data.sid !== clientId) {
          onNewClientId(msg.data.sid)
        }
        void onQueueUpdate()
      } else if (Message.isExecuting(msg)) {
        if (msg.data.node !== undefined) {
          onNodeInProgress(msg.data.node, 0)
        } else if (nodeIdInProgress !== undefined) {
          onNodeInProgress(nodeIdInProgress, 0)
        }
      } else if (Message.isProgress(msg)) {
        if (nodeIdInProgress !== undefined) {
          onNodeInProgress(nodeIdInProgress, msg.data.value / msg.data.max)
        }
      } else if (Message.isExecuted(msg)) {
        const images = msg.data.output.images
        if (Array.isArray(images)) {
          onImageSave(msg.data.node, images)
        }
      }
    },
  })
  return <></>
}
