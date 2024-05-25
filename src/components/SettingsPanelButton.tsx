import { useLocalStorage } from 'usehooks-ts'
import config, { getBackendUrl } from '../config'
import BackendSwitcher from './BackendSwitcher'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

export default function SettingsPanelButton() {
  return (
    <div className="dropdown dropdown-end" tabIndex={0}>
      <Cog6ToothIcon className="w-6 h-6" />
      <div className="dropdown-content pt-4">
        <BackendSwitcher />
      </div>
    </div>
  )
}
