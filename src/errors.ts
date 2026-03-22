import type { Sensor42ResponseMeta } from './types.js'

export class Sensor42Error extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'Sensor42Error'
  }
}

export class Sensor42ConfigError extends Sensor42Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'Sensor42ConfigError'
  }
}

export class Sensor42NetworkError extends Sensor42Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'Sensor42NetworkError'
  }
}

export class Sensor42ApiError extends Sensor42Error {
  readonly status: number
  readonly url: string
  readonly body: string
  readonly meta: Sensor42ResponseMeta

  constructor(params: {
    status: number
    url: string
    body: string
    meta: Sensor42ResponseMeta
    message?: string
    cause?: unknown
  }) {
    const message =
      params.message ??
      `Sensor42 API request failed with status ${params.status}${params.body ? `: ${params.body}` : ''}`
    super(message, { cause: params.cause })
    this.name = 'Sensor42ApiError'
    this.status = params.status
    this.url = params.url
    this.body = params.body
    this.meta = params.meta
  }
}

