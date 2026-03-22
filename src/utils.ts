import { Sensor42ConfigError, Sensor42Error } from './errors.js'
import type { Sensor42ResponseMeta } from './types.js'

type PrimitiveQueryValue = boolean | number | string
type QueryValue =
  | PrimitiveQueryValue
  | Date
  | null
  | undefined
  | PrimitiveQueryValue[]
  | Date[]

type QueryParams = Record<string, QueryValue>

export function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim()
  if (!trimmed) {
    throw new Sensor42ConfigError('Sensor42 baseUrl must not be empty.')
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

export function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Sensor42ConfigError(`${name} must be a positive integer.`)
  }
}

export function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const url = new URL(path, `${baseUrl}/`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue
      }

      if (Array.isArray(value)) {
        if (value.length === 0) {
          continue
        }

        const list = value.map((item) => formatQueryValue(item)).join(',')
        url.searchParams.set(key, list)
        continue
      }

      url.searchParams.set(key, formatQueryValue(value))
    }
  }

  return url.toString()
}

export function buildResponseMeta(response: Response, url: string): Sensor42ResponseMeta {
  const headers = Object.fromEntries(response.headers.entries())

  return {
    status: response.status,
    url,
    headers,
    contentType: response.headers.get('content-type'),
    contentDisposition: response.headers.get('content-disposition'),
    credits: {
      charged: parseNumberHeader(response.headers, 'x-credits-charged'),
      balance: parseNumberHeader(response.headers, 'x-credits-balance'),
    },
    rateLimit: {
      limit: parseNumberHeader(response.headers, 'x-ratelimit-limit'),
      remaining: parseNumberHeader(response.headers, 'x-ratelimit-remaining'),
      reset: parseNumberHeader(response.headers, 'x-ratelimit-reset'),
      retryAfter: parseNumberHeader(response.headers, 'retry-after'),
    },
  }
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T
  } catch (error) {
    throw new Sensor42Error('Failed to parse Sensor42 JSON response.', { cause: error })
  }
}

export function encodePathSegment(value: string | number): string {
  return encodeURIComponent(String(value))
}

function formatQueryValue(value: PrimitiveQueryValue | Date): string {
  if (value instanceof Date) {
    return toDateOnly(value)
  }

  return String(value)
}

function parseNumberHeader(headers: Headers, name: string): number | null {
  const raw = headers.get(name)
  if (!raw) {
    return null
  }

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function toDateOnly(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new Sensor42ConfigError('Invalid Date passed to Sensor42 query serialization.')
  }

  return date.toISOString().slice(0, 10)
}
