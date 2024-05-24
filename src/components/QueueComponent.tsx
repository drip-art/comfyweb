import { TrashIcon } from '@heroicons/react/24/outline'
import { memo } from 'react'
import { type QueueItem } from '../types'

interface Props {
  queue: QueueItem[]
  onDeleteFromQueue: (id: number) => Promise<void>
}

function QueueComponent({ queue, onDeleteFromQueue }: Props): JSX.Element {
  return queue.length === 0 ? (
    <div className="m-auto w-full text-center text-stone-500">Nothing to do!</div>
  ) : (
    <div className="overflow-y-scroll w-full">
      {queue.map((it, i) => (
        <div className="p-1 flex bg-stone-800 odd:bg-stone-900 items-center" key={i}>
          <span className='h-full'>{i + 1}.</span>
          <div className="flex flex-wrap">
            <Label label="model" value={it.model === undefined ? 'N/A' : it.model} />
            {it.prompts.map((prompt, i) => (
              <Label key={i} label="prompt" value={prompt} />
            ))}
          </div>
          {i !== 0 ? (
            <TrashIcon
              className="inline h-5 w-5 mx-1 text-red-500 align-text-bottom cursor-pointer"
              onClick={() => {
                void onDeleteFromQueue(it.id)
              }}
            />
          ) : (
            <></>
          )}
        </div>
      ))}
    </div>
  )
}

function Label({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="p-1 m-1 bg-stone-700 rounded-md text-xs whitespace-nowrap overflow-hidden text-ellipsis">
      {label}: {value}
    </div>
  )
}

export default memo(QueueComponent)
