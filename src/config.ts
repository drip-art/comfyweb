import DIE from '@snomiao/die'

const defaultConfig = {
  host: window.location.host,
  protocol: window.location.protocol,
}

const hotReloadConfig = {
  host: 'localhost:8188',
  protocol: 'http:',
}

const config =
  (await (async () => localStorage.getItem('comfyweb-config'))()
    .then((e) => JSON.parse(String(e)))
    .catch(() => null)) || (window.location.port === '5173' ? hotReloadConfig : defaultConfig)

// js listen to alt+b
globalThis.document?.addEventListener('keydown', function (event) {
  if (event.altKey && event.code === 'KeyB') {
    const i = prompt('Input your backend url', getBackendUrl('')) ?? alert('Abort') ?? DIE('Abort')
    const url = new URL(i)
    config.host = url.host
    config.protocol = url.protocol
    localStorage.setItem('comfyweb-config', JSON.stringify(config))
    alert('New Backend URL:' + getBackendUrl(''))
  }
})

export function getBackendUrl(endpoint: string): string {
  return `${config.protocol}//${config.host}${endpoint}`
}

export default config
