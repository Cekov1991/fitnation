interface SharedConfig {
  baseUrl: string
}

let _config: SharedConfig = {
  baseUrl: 'http://localhost:8000/api',
}

export function initApi(config: SharedConfig) {
  _config = config
}

export function getConfig(): SharedConfig {
  return _config
}
