import { memo } from 'react'
import { type PersistedGraphLegacy, readWorkflowFromFile, readImageWorkflowFromFile } from '../persistence'
import { WF20240524, WFLegacy, WorkflowSchema } from '../assets/workflow.schema'
import { defaultWorkflow } from '../assets/defaultWorkflow'
import { ComfyImage } from '../types'

interface Props {
  onLoadWorkflow: (persisted: PersistedGraphLegacy | WorkflowSchema) => void
  onSaveWorkflow: () => void
  onLoadImageWorkflow: (image: ComfyImage | ArrayBuffer) => void
}

function WorkflowPageComponent({ onLoadWorkflow, onSaveWorkflow, onLoadImageWorkflow }: Props): JSX.Element {
  return (
    <div className="px-2 py-4 flex flex-wrap gap-4">
      <label className="p-2 btn text-white bg-stone-800 hover:bg-stone-700 rounded-md">
        Load
        <input type="file" className="hidden" onChange={(ev) => readWorkflowFromFile(ev, onLoadWorkflow)}></input>
      </label>
      <label className="p-2 btn text-white bg-stone-800 hover:bg-stone-700 rounded-md">
        Load Image
        <input
          type="file"
          className="hidden"
          onChange={(ev) => readImageWorkflowFromFile(ev, onLoadImageWorkflow)}
        ></input>
      </label>
      <label className="p-2 btn text-white bg-stone-800 hover:bg-stone-700 rounded-md" onClick={onSaveWorkflow}>
        Save
      </label>
      <label className="p-2 btn text-white bg-stone-800 hover:bg-stone-700 rounded-md">
        Load default (Legacy)
        <button
          onClick={() => {
            onLoadWorkflow(WFLegacy)
          }}
        />
      </label>
      <label className="p-2 btn text-white bg-stone-800 hover:bg-stone-700 rounded-md">
        Load default
        <button
          onClick={() => {
            onLoadWorkflow(WF20240524)
          }}
        />
      </label>
    </div>
  )
}

export default memo(WorkflowPageComponent)
