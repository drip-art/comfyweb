import { type NodeProps } from 'reactflow'
import { shallow } from 'zustand/shallow'
import ControlPanelComponent from './components/ControlPanelComponent'
import GalleryComponent from './components/GalleryComponent'
import ImageViewComponent from './components/ImageViewComponent'
import InputComponent from './components/InputComponent'
import NodeComponent from './components/NodeComponent'
import NodePickerComponent from './components/NodePickerComponent'
import QueueComponent from './components/QueueComponent'
import WorkflowPageComponent from './components/WorkflowPageComponent'
import { useAppStore } from './store'
import { type Input, type NodeId, type WidgetLegacy } from './types'
import BackendSwitcher from './components/BackendSwitcher'
import { memo } from 'react'

export function NodeContainer(props: NodeProps<WidgetLegacy>): JSX.Element {
  const { progressBar, imagePreviews, onPreviewImage, onDuplicateNode, onDeleteNode } = useAppStore(
    (st) => ({
      progressBar: st.nodeInProgress?.id === props.id ? st.nodeInProgress.progress : undefined,
      imagePreviews: st.graph[props.id]?.images?.flatMap((image) => {
        const index = st.gallery.findIndex((i) => i.image === image)
        return index !== -1 ? { image, index } : []
      }),
      onPreviewImage: st.onPreviewImage,
      onPropChange: st.onPropChange,
      onDuplicateNode: st.onDuplicateNode,
      onDeleteNode: st.onDeleteNode,
    }),
    shallow
  )
  return (
    <NodeComponent
      node={props}
      progressBar={progressBar}
      imagePreviews={imagePreviews}
      onPreviewImage={onPreviewImage}
      onDuplicateNode={onDuplicateNode}
      onDeleteNode={onDeleteNode}
    />
  )
}

export function ControlPanelContainer(): JSX.Element {
  const { promptError, onSubmit } = useAppStore(
    (st) => ({
      promptError: st.promptError,
      onSubmit: st.onSubmit,
    }),
    shallow
  )
  return <ControlPanelComponent promptError={promptError} onSubmit={onSubmit} />
}
export function WorkflowPageContainer(): JSX.Element {
  const { onLoadWorkflow, onSaveWorkflow, onLoadImageWorkflow, onClearWorkflow } = useAppStore((st) => ({
    onLoadWorkflow: st.onLoadWorkflow,
    onClearWorkflow: st.onClearWorkflow,
    onSaveWorkflow: st.onSaveWorkflowLegacy,
    onLoadImageWorkflow: st.onLoadImageWorkflow,
  }))
  return (
    <WorkflowPageComponent
      {...{
        onClearWorkflow,
        onLoadWorkflow,
        onSaveWorkflow,
        onLoadImageWorkflow,
      }}
    />
  )
}

export function QueueContainer(): JSX.Element {
  const { queue, onDeleteFromQueue } = useAppStore(
    (st) => ({
      queue: st.queue,
      onDeleteFromQueue: st.onDeleteFromQueue,
    }),
    shallow
  )
  return <QueueComponent queue={queue} onDeleteFromQueue={onDeleteFromQueue} />
}
export function SettingsContainer() {
  return (
    <div className="w-full p-2">
      <BackendSwitcher />
    </div>
  )
}

export function NodePickerContainer(): JSX.Element {
  const { widgets, onAddNode } = useAppStore(
    (st) => ({ widgets: st.widgetsLegacy, onAddNode: st.onAddNodeLegacy }),
    shallow
  )
  return <NodePickerComponent widgets={widgets} onAddNode={onAddNode} />
}

export function GalleryContainer(): JSX.Element {
  const { gallery, onPreviewImage, onLoadImageWorkflow } = useAppStore(
    (st) => ({ gallery: st.gallery, onPreviewImage: st.onPreviewImage, onLoadImageWorkflow: st.onLoadImageWorkflow }),
    shallow
  )
  return (
    <GalleryComponent gallery={gallery} onPreviewImage={onPreviewImage} onLoadImageWorkflow={onLoadImageWorkflow} />
  )
}

export function ImageViewContainer(): JSX.Element {
  const { image, onHideImagePreview, onPreviewImageNavigate } = useAppStore(
    (st) => ({
      image: st.previewedImageIndex !== undefined ? st.gallery[st.previewedImageIndex]?.image : undefined,
      onHideImagePreview: st.onHideImagePreview,
      onPreviewImageNavigate: st.onPreviewImageNavigate,
    }),
    shallow
  )
  return (
    <ImageViewComponent
      image={image}
      onHideImagePreview={onHideImagePreview}
      onPreviewImageNavigate={onPreviewImageNavigate}
    />
  )
}

interface InputContainerProps {
  id: NodeId
  name: string
  input: Input
}

export const InputContainer = memo(({ id, name, input }: InputContainerProps): JSX.Element => {
  const { value, node, onPropChange } = useAppStore(
    (st) => ({
      node: st.graph[id],
      value: st.graph[id]?.fields[name],
      onPropChange: st.onPropChange,
    }),
    shallow
  )
  if (!node) return <></> // node was deleted
  if (value === undefined) {
    console.warn('Input missing value', { id, name, input, value })
    return <></>
  }
  return <InputComponent value={value} name={name} input={input} onChange={(val) => onPropChange(id, name, val)} />
})
