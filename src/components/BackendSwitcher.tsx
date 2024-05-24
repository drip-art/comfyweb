import { useLocalStorage } from 'usehooks-ts'
import config, { getBackendUrl } from '../config'

export default function BackendSwitcher() {
  const [comfywebConfig, setComfywebConfig] = useLocalStorage('comfyweb-config', config)

  return (
    <form
      className='card bg-gray-900 p-4 w-fit text-white'
      onSubmit={(event) => {
        setComfywebConfig(event.currentTarget.form.backend_url.value)
        alert('New Backend URL:' + getBackendUrl(''))
      }}
    >
      <div className="flex gap-3">
        <label className='flex gap-3'>
          Backend URL:
          <input className='input input-xs text-black dark' name="backend_url" defaultValue={comfywebConfig.baseUrl} />
        </label>
        <button>Submit</button>
      </div>
    </form>
  )
}
