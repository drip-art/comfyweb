import { PlusIcon } from '@heroicons/react/24/outline'
import { memo } from 'react'
import { type SDNode, type Widget, type WidgetKey } from '../types'

interface Props {
  widgets: Record<WidgetKey, Widget>
  onAddNode: (widget: Widget, node?: SDNode, pos?: { x: number; y: number }, key?: number) => void
}

function NodePickerComponent({ widgets, onAddNode }: Props): JSX.Element {
  const byCategory: Record<string, Widget[]> = {}
  for (const widget of Object.values(widgets)) {
    if (byCategory[widget.category] !== undefined) {
      byCategory[widget.category].push(widget)
    } else {
      byCategory[widget.category] = [widget]
    }
  }

  return (
    <div className="flex flex-row p-1 h-full w-full overflow-x-scroll">
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} className="flex flex-col px-1">
          <h3 className="text-md font-bold mx-auto">{cat}</h3>
          <div className="overflow-y-scroll">
            {items.map((i) => (
              <div
                key={i.name}
                className="text-xs p-1 my-1 bg-stone-800 hover:bg-stone-700 rounded-md cursor-pointer whitespace-nowrap"
                onClick={() => onAddNode(i)}
              >
                <PlusIcon className="h-4 w-4 inline" />
                <span className="align-middle px-0.5">{i.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default memo(NodePickerComponent)
