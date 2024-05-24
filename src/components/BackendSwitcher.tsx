import { useLocalStorage } from 'usehooks-ts'
import config, { getBackendUrl, sameOriginBaseUrl } from '../config'

export default function BackendSwitcher() {
  const [comfywebConfig, setComfywebConfig] = useLocalStorage('comfyweb-config', config)

  return (
    <form
      className="card bg-gray-900 p-4 w-fit text-white"
      accessKey='s'
      onSubmit={(event) => {
        event.preventDefault()
        setComfywebConfig(event.currentTarget.form.backend_url.value)
        setTimeout(() => {
          alert('New Backend URL:' + getBackendUrl(''))
        }, 0)
      }}
    >
      <div className="flex gap-3">
        <label className="flex gap-3">
          Backend URL:
          <input list='backends' className="w-80 i  nput input-xs text-black dark" name="backend_url" defaultValue={comfywebConfig.baseUrl} />
        </label>
        <datalist id='backends'>
          <option>http://localhost:8188</option>
          <option>{sameOriginBaseUrl}</option>
        </datalist>
        <button>Submit</button>
      </div>
    </form>
  )
}
