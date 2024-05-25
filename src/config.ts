import DIE from '@snomiao/die'

const isHot = !!(import.meta as any).hot // vite develop
const isProxied = import.meta.env?.BACKEND_URL // maybe https://api.drip.art/prompt
const isVercel = import.meta.env?.VERCEL_URL // comfyweb.vercel.app
const DEFAULT_BACKEND_BASE_URL = 'http://localhost:8188'

export const sameOriginBaseUrl = `${window.location.protocol}//${window.location.host}`
const defaultConfig = { baseUrl: DEFAULT_BACKEND_BASE_URL }
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

// load config by async
const config: Config = JSON.parse(localStorage.getItem('comfyweb-config') ?? 'null') ?? defaultConfig
globalThis.comfywebConfig = config

export function getBackendUrl(endpoint: string): string {
  const config = globalThis.comfywebConfig
  return `${config.baseUrl}${endpoint}`
}
export default config
