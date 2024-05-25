import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import BackendSwitcher from './BackendSwitcher'

export default function SettingsPanel() {
  return (
    <div className="dropdown dropdown-end" tabIndex={0}>
      <Cog6ToothIcon className="w-6 h-6" />
      <div className="dropdown-content pt-4">
        <BackendSwitcher />
      </div>
    </div>
  )
}
