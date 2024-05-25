import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap, Panel } from 'reactflow'
import { shallow } from 'zustand/shallow'

import { useAppStore } from '../store'
import { NODE_IDENTIFIER } from './NodeComponent'

import { useEffect } from 'react'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'
import 'reactflow/dist/style.css'
import { getBackendUrl } from '../config'
import { ControlPanelContainer, ImageViewContainer, NodeContainer } from '../containers'
import { Message } from '../types'
import SettingsPanelButton from './SettingsPanelButton'

const nodeTypes = { [NODE_IDENTIFIER]: NodeContainer }

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <FlowContainer />
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
      onInit={(reactFlowInstance) => {
        onInit()
      }}
    >
      <Background variant={BackgroundVariant.Dots} />
      <Controls />
      <Panel position="bottom-center">
        <ControlPanelContainer />
        <ImageViewContainer />
        <div className="right-0 top-0 absolute overflow-visible">
          <div className="p-3">
            <SettingsPanelButton />
          </div>
        </div>
      </Panel>
      <MiniMap nodeStrokeWidth={3} position="top-right" />
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
  useWebSocket(getBackendUrl('/ws').replace(/^http/, 'ws'), {
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
        console.log({ images })
        if (Array.isArray(images)) {
          onImageSave(msg.data.node, images)
        }
      }
    },
  })
  return <></>
}
