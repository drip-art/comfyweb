import { useLocalStorage } from 'usehooks-ts'
import config, { getBackendUrl, sameOriginBaseUrl } from '../config'

export default function BackendSwitcher() {
  const [comfywebConfig, setComfywebConfig] = useLocalStorage('comfyweb-config', config)

  return (
    <form
      className="card bg-gray-900 p-4 w-fit text-white"
      accessKey="s"
      onSubmit={(event) => {
        event.preventDefault()
        const newConfig = (globalThis.comfywebConfig = {
          ...comfywebConfig,
          baseUrl: (document.querySelector('input#backend_url') as HTMLInputElement)!.value,
        })
        setComfywebConfig(newConfig)
        alert('Reload with backend URL:' + getBackendUrl(''))
        location.reload()
      }}
    >
      <div className="flex gap-3">
        <label className="flex gap-3">
          Backend URL:
          <input
            list="backends"
            className="w-80 i  nput input-xs text-black dark"
            id="backend_url"
            name="backend_url"
            defaultValue={comfywebConfig.baseUrl}
          />
        </label>
        <datalist id="backends">
          <option>http://localhost:8188</option>
          <option>{sameOriginBaseUrl}</option>
          {/* https://comfy-api.drip.art/ */}
        </datalist>
        <button>Submit</button>
      </div>
    </form>
  )
}
