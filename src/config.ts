import DIE from '@snomiao/die'

const isHot = !!(import.meta as any).hot
const DEFAULT_BACKEND_BASE_URL = 'http://localhost:8188'

export const sameOriginBaseUrl = `${window.location.protocol}//${window.location.host}`
const defaultConfig = {
  baseUrl: isHot ? DEFAULT_BACKEND_BASE_URL : sameOriginBaseUrl,
}

export type Config = typeof defaultConfig

declare global {
  var comfywebConfig: Config
}

// js listen to alt+b
// globalThis.document?.addEventListener('keydown', function (event) {
//   if (event.altKey && event.code === 'KeyB') {
//     const i = prompt('Input your backend url', getBackendUrl('')) ?? alert('Abort') ?? DIE('Abort')
//     config.baseUrl = new URL(i).href
//     localStorage.setItem('comfyweb-config', JSON.stringify(config))
//     alert('New Backend URL:' + getBackendUrl(''))
//   }
// })

const config: Config =
  (await (async () => localStorage.getItem('comfyweb-config'))()
    .then((e) => JSON.parse(String(e)))
    .catch(() => null)) ?? defaultConfig
globalThis.comfywebConfig = config
console.log(config)

export function getBackendUrl(endpoint: string): string {
  const config = globalThis.comfywebConfig
  return `${config.baseUrl}${endpoint}`
}

export default config
