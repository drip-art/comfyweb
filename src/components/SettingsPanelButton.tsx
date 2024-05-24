import { useLocalStorage } from 'usehooks-ts'
import config, { getBackendUrl } from '../config'
import BackendSwitcher from './BackendSwitcher'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

export default function SettingsPanelButton() {
  return (
    <div className="dropdown" tabIndex={0}>
      <Cog6ToothIcon className="w-8 h-8" />
      <div className="dropdown-content">
        <BackendSwitcher />
      </div>
    </div>
  )
}
