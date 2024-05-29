import { useAttribute } from 'use-attribute'
import { memo } from 'react'
import { type NodeProps, Position, type HandleType, Handle } from 'reactflow'
import { type WidgetLegacy, Input, type NodeId, ComfyImage, Flow } from '../types'
import { TrashIcon, DocumentDuplicateIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline'
import './NodeComponent.css'
import { InputContainer } from '../containers'
import { getBackendUrl } from '../config'
import 'use-attribute'
import clsx from 'clsx'
import { cyrb53 } from './cyrb53'
export const NODE_IDENTIFIER = 'sdNode'
export const EDGE_IDENTIFIER = 'comfyEdge'

interface ImagePreview {
  image: ComfyImage
  index: number
}

type Props = {
  node: NodeProps<WidgetLegacy>
  progressBar?: number
  imagePreviews?: ImagePreview[]
  onPreviewImage: (idx: number) => void
  onDuplicateNode: (id: NodeId) => void
  onDeleteNode: (id: NodeId) => void
}

function NodeComponent({
  node,
  progressBar,
  imagePreviews,
  onPreviewImage,
  onDuplicateNode,
  onDeleteNode,
}: Props): JSX.Element {
  const required = Object.entries(node.data.input.required)
  const params = required.flatMap(([property, input]) => (Input.isParameterOrList(input) ? [{ property, input }] : []))
  const inputs = required.flatMap(([property, input]) => (!Input.isParameterOrList(input) ? [{ property, input }] : []))

  const isInProgress = progressBar !== undefined
  const defaultClasses = [
    'drop-shadow-md',
    'rounded-md',
    'bg-stone-900',
    'border-2',
    'flex',
    'flex-col',
    'overflow-hidden',
    'graph-node',
  ]
  const borderClasses = isInProgress ? ['border-teal-500'] : node.selected ? ['border-stone-100'] : ['border-stone-400']

  return (
    <div className={defaultClasses.concat(borderClasses).join(' ')}>
      <div className="bg-stone-800 flex justify-between relative">
        <h2 className="font-semibold px-2">{node.data.name}</h2>
        {isInProgress ? <div className="progress-bar bg-teal-800" style={{ width: `${progressBar * 100}%` }} /> : <></>}
        {node.selected ? (
          <div className="flex items-center px-1">
            <DocumentDuplicateIcon
              className="h-5 w-5 text-zinc-200 cursor-pointer"
              onClick={() => onDuplicateNode(node.id)}
            />
            <TrashIcon className="h-5 w-5 text-red-500 cursor-pointer" onClick={() => onDeleteNode(node.id)} />
            <ArrowsPointingInIcon className="h-5 w-5 text-blue-500 cursor-pointer" />
          </div>
        ) : (
          <></>
        )}
      </div>
      <div className="px-2 py-2 flex space-x-2 justify-between">
        <div className="flex flex-col grow-0 py-1">
          {inputs.map(({ property, input }, i) => (
            <Slot
              key={property}
              id={property}
              label={property}
              flowType={input[0]}
              type="target"
              position={Position.Left}
            />
          ))}
        </div>
        <div className="flex flex-col items-start grow p-1 space-y-1 text-sm">
          {params.map(({ property, input }) => (
            <InputContainer key={property} name={property} id={node.id} input={input} />
          ))}
        </div>
        <div className="flex flex-col py-1">
          {node.data.output.map((k) => (
            // warning: output key may not unique
            <Slot key={k} id={k} label={k} flowType={k} type="source" position={Position.Right} />
          ))}
        </div>
      </div>
      <div className="m-auto flex flex-wrap max-w-xs mb-2">
        {imagePreviews
          ?.map(({ image, index }) => {
            console.log(image)
            return (
              <div className="flex grow basis-1/2" key={JSON.stringify(image)}>
                <img
                  className="w-full rounded-xl drop-shadow-md p-1"
                  src={getBackendUrl(`/view?${new URLSearchParams(image)}`)}
                  onClick={() => onPreviewImage(index)}
                />
              </div>
            )
          })
          .reverse()}
      </div>
    </div>
  )
}

export default memo(NodeComponent)

interface SlotProps {
  id: string
  label: string
  type: HandleType
  position: Position
  flowType: Flow
}
function Slot({ id, label, type, position, flowType }: SlotProps): JSX.Element {
  const deg = cyrb53(flowType) % 360
  const styledElementRef = useAttribute<HTMLDivElement>(
    'style',
    [`--bg: hsl(${deg}deg 60% 80%)`, `--bg-hover: hsl(${deg}deg 80% 80%)`, `--bg-active: hsl(${deg}deg 80% 70%)`].join(
      '; '
    )
  )
  return (
    <div className={position === Position.Right ? 'flex flex-row-reverse' : 'flex'} ref={styledElementRef}>
      <Handle
        id={id}
        type={type}
        position={position}
        className={clsx(
          'w-3 h-3 relative',
          'bg-[var(--bg)]',
          'hover:bg-[var(--bg-hover)]',
          'activate:bg-[var(--bg-activate)]'
        )}
      />
      <h5 className="font-semibold text-xs" style={{ marginBottom: 2 }}>
        {label}
      </h5>
    </div>
  )
}
