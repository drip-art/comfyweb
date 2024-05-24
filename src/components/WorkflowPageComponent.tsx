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
    <div className="px-2 py-4">
      <label className="p-2 cursor-pointer bg-stone-800 hover:bg-stone-700 rounded-md">
        Load workflow
        <input type="file" className="hidden" onChange={(ev) => readWorkflowFromFile(ev, onLoadWorkflow)}></input>
      </label>
      <label className="p-2 cursor-pointer bg-stone-800 hover:bg-stone-700 rounded-md">
        Load Image workflow
        <input
          type="file"
          className="hidden"
          onChange={(ev) => readImageWorkflowFromFile(ev, onLoadImageWorkflow)}
        ></input>
      </label>

      <div className="p-2 my-4 cursor-pointer bg-stone-800 hover:bg-stone-700 rounded-md" onClick={onSaveWorkflow}>
        Save workflow
      </div>
      <label className="p-2 cursor-pointer bg-stone-800 hover:bg-stone-700 rounded-md">
        Load default workflow (Legacy)
        <button
          onClick={() => {
            onLoadWorkflow(WFLegacy)
          }}
        />
      </label>
      <label className="p-2 cursor-pointer bg-stone-800 hover:bg-stone-700 rounded-md">
        Load default workflow
        <button
          onClick={() => {
            onLoadWorkflow(WF20240524)
          }}
        />
      </label>
      <label className="p-2 cursor-pointer bg-stone-800 hover:bg-stone-700 rounded-md">
        Load default workflow
        <button
          onClick={() => {
            WF20240524
          }}
        />
      </label>
    </div>
  )
}

export default memo(WorkflowPageComponent)
