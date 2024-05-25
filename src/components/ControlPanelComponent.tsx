import { memo, useState } from 'react'
import { ArrowsPointingInIcon } from '@heroicons/react/24/outline'
import { GalleryContainer, NodePickerContainer, QueueContainer, SettingsContainer, WorkflowPageContainer } from '../containers'

const TABS = ['Queue', 'Gallery', 'Nodes', 'Workflow', 'Settings'] as const
type Tab = (typeof TABS)[number]

interface PanelState {
  activeTab: Tab
  minimized: boolean
}

interface Props {
  promptError?: string
  onSubmit: () => Promise<void>
}

function ControlPanelComponent({ onSubmit, promptError }: Props): JSX.Element {
  const [{ activeTab, minimized }, setState] = useState<PanelState>({
    activeTab: 'Nodes',
    minimized: false,
  })

  return (
    <>
      {promptError !== undefined ? (
        <div className="error-popup p-1 text-sm rounded-md bg-stone-900 border-2 border-stone-400 text-red-500 -translate-y-10">
          {promptError}
        </div>
      ) : (
        <></>
      )}
      <div
        style={{ width: '64vw' }}
        className="drop-shadow-lg rounded-md bg-stone-900 border-2 border-stone-400 flex flex-col overflow-hidden"
      >
        <PanelTabs tabs={TABS} active={activeTab} onTabChange={(tab) => setState({ minimized: false, activeTab: tab })}>
          <button
            className="absolute bg-teal-800 hover:bg-teal-700 p-2 left-2 mx-0.5 cursor-pointer"
            onClick={() => {
              void onSubmit()
            }}
          >
            Enqueue
          </button>
          <ArrowsPointingInIcon
            className="h-5 w-5 mx-1 text-blue-500 self-center cursor-pointer"
            onClick={() => setState((st) => ({ ...st, minimized: !st.minimized }))}
          />
        </PanelTabs>
        {minimized ? (
          <></>
        ) : (
          <div className="h-80 flex">
            {minimized ? (
              <></>
            ) : activeTab === 'Queue' ? (
              <QueueContainer />
            ) : activeTab === 'Gallery' ? (
              <GalleryContainer />
            ) : activeTab === 'Nodes' ? (
              <NodePickerContainer />
            ) : activeTab === 'Settings' ? (
              <SettingsContainer />
            ) : (
              <WorkflowPageContainer />
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default memo(ControlPanelComponent)

interface PanelTabsProps<T> {
  tabs: readonly T[]
  active: T
  onTabChange: (tab: T) => void
  children: JSX.Element[]
}

function PanelTabs<T extends string>({ tabs, active, onTabChange, children }: PanelTabsProps<T>): JSX.Element {
  return (
    <div className="flex flex-row justify-end bg-stone-800 px-2 drop-shadow-md">
      {tabs.map((t) => (
        <PanelTab key={t} label={t} isActive={t === active} onClick={() => onTabChange(t)} />
      ))}
      {children}
    </div>
  )
}

interface PanelTabProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function PanelTab({ label, isActive, onClick }: PanelTabProps): JSX.Element {
  const bgClasses = isActive ? ['bg-stone-600'] : ['bg-stone-800', 'hover:bg-stone-700']
  const defaultClasses = ['p-2', 'mx-0.5', 'cursor-pointer']
  return (
    <div className={defaultClasses.concat(bgClasses).join(' ')} onClick={onClick}>
      {label}
    </div>
  )
}
