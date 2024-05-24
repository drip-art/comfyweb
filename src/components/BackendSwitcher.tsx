import { useLocalStorage } from 'usehooks-ts'
import { getBackendUrl } from '../config'

export default function BackendSwitcher() {
  const [comfywebConfig, setComfywebConfig] = useLocalStorage('comfyweb-config', globalThis.comfywebConfig)

  return (
    <form
      onSubmit={(event) => {
        setComfywebConfig(event.currentTarget.form.backend_url.value)
        alert('New Backend URL:' + getBackendUrl(''))
      }}
    >
      <label>
        Backend URL:
        <input name="backend_url" defaultValue={comfywebConfig} />
      </label>
      <button>Submit</button>
    </form>
  )
}
