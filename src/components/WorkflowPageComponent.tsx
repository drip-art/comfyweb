import { memo } from 'react'
import { type PersistedGraphLegacy, readWorkflowFromFile } from '../persistence'
import { WorkflowSchema } from '../assets/workflow.schema'

interface Props {
  onLoadWorkflow: (persisted: PersistedGraphLegacy | WorkflowSchema) => void
  onSaveWorkflow: () => void
}

function WorkflowPageComponent({ onLoadWorkflow, onSaveWorkflow }: Props): JSX.Element {
  return (
    <div className="px-2 py-4">
      <label className="p-2 cursor-pointer bg-stone-800 hover:bg-stone-700 rounded-md">
        Load workflow
        <input type="file" className="hidden" onChange={(ev) => readWorkflowFromFile(ev, onLoadWorkflow)}></input>
      </label>
      <div
        className="p-2 my-4 cursor-pointer bg-stone-800 hover:bg-stone-700 rounded-md"
        onClick={onSaveWorkflow}
      >
        Save workflow
      </div>
    </div>
  )
}

export default memo(WorkflowPageComponent)
